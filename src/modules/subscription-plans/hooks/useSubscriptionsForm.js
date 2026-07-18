import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { getSubscriptionIdentifier, normalizeSubscriptionData, generateCredentials } from "../utils/subscriptions.utils";
import { getSubscriptionDetails, saveSubscription } from "../data/subscriptions.service";
import { subscriptionsModuleSchema } from "../data/module.schema";

export const useSubscriptionForm = ({ isOpen, onClose, onAfterSave, selectedSubscription }) => {
    const [loading, setLoading] = useState(false);
    const [fetchingSubscription, setFetchingSubscription] = useState(false);
    const [formData, setFormData] = useState(subscriptionsModuleSchema.form.initialValues);
    const [errors, setErrors] = useState({});
    const mode = selectedSubscription ? "edit" : "create";
    const subscriptionID = getSubscriptionIdentifier(selectedSubscription);

    useEffect(() => {
        const fetchSubscriptionDetails = async () => {
            if (!isOpen || !subscriptionID) { return; }
            try {
                setFetchingSubscription(true);
                const res = await getSubscriptionDetails(subscriptionID)
                const subscriptionData = res?.data;
                setFormData(normalizeSubscriptionData(subscriptionData));
            } catch (error) {
                toast.error("Unable to fetch subscription details");
                setFormData(normalizeSubscriptionData(selectedSubscription));
            } finally {
                setFetchingSubscription(false);
            }
        };
        // EDIT MODE
        if (selectedSubscription && isOpen) { fetchSubscriptionDetails(); return; }
        // CREATE MODE
        setFormData(subscriptionsModuleSchema.form.initialValues);
    }, [selectedSubscription, isOpen, subscriptionID]);

    const handleClose = () => {
        setFormData(subscriptionsModuleSchema.form.initialValues);
        setErrors({});
        onClose();
    }
    const handleChange = (event) => {
        const { name, value } = event.target;
        let nextData = {
            ...formData,
            [name]: value,
        };

        if ((name === "name" || name === "dateOfBirth") && nextData.name && nextData.dateOfBirth) {
            const credentials = generateCredentials(nextData.name, nextData.dateOfBirth);
            nextData = {
                ...nextData,
                ...credentials,
            };
        }

        setFormData(nextData);
    };
    const handleSave = async () => {
        const result = subscriptionsModuleSchema.validationSchema.safeParse(formData);
        if (result.success == false) {
            const newErrors = {};
            result.error.issues.forEach((item) => {
                newErrors[item.path[0]] = item.message;
            });
            setErrors(newErrors);
            return;
        }
        try {
            setErrors({});
            setLoading(true);
            const res = await saveSubscription({ mode, subscriptionID, formData });
            if (res.success) {
                toast.success(
                    res?.message ||
                    `Subscription ${mode === "create" ? "created" : "updated"} successfully`
                );
                setFormData(subscriptionsModuleSchema.form.initialValues);
                onClose();
                onAfterSave?.();
                return;
            }
            toast.error(res?.message || "Something went wrong");
        } catch (error) {
            toast.error(error.message || "Server error");
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        fetchingSubscription,
        formData,
        errors,
        handleClose,
        handleChange,
        handleSave,
    }
}
