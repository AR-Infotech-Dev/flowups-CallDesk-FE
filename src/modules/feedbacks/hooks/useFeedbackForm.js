import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { getFeedbackIdentifier, normalizeFeedbackData, generateCredentials } from "../utils/feedbacks.utils";
import { getFeedbackDetails, saveFeedback } from "../data/feedbacks.service";
import { feedbacksModuleSchema } from "../data/module.schema";

export const useFeedbackForm = ({ isOpen, onClose, onAfterSave, selectedFeedback }) => {
    const [loading, setLoading] = useState(false);
    const [fetchingFeedback, setFetchingFeedback] = useState(false);
    const [formData, setFormData] = useState(feedbacksModuleSchema.form.initialValues);
    const [errors, setErrors] = useState({});
    const mode = selectedFeedback ? "edit" : "create";
    const feedbackID = getFeedbackIdentifier(selectedFeedback);

    useEffect(() => {
        const fetchFeedbackDetails = async () => {
            if (!isOpen || !feedbackID) { return; }
            try {
                setFetchingFeedback(true);
                const res = await getFeedbackDetails(feedbackID)
                const feedbackData = res?.data;
                setFormData(normalizeFeedbackData(feedbackData));
            } catch (error) {
                toast.error("Unable to fetch feedback details");
                setFormData(normalizeFeedbackData(selectedFeedback));
            } finally {
                setFetchingFeedback(false);
            }
        };
        // EDIT MODE
        if (selectedFeedback && isOpen) { fetchFeedbackDetails(); return; }
        // CREATE MODE
        setFormData(feedbacksModuleSchema.form.initialValues);
    }, [selectedFeedback, isOpen, feedbackID]);

    const handleClose = () => {
        setFormData(feedbacksModuleSchema.form.initialValues);
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
        const result = feedbacksModuleSchema.validationSchema.safeParse(formData);
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
            const res = await saveFeedback({ mode, feedbackID, formData });
            if (res.success) {
                toast.success(
                    res?.message ||
                    `Feedback ${mode === "create" ? "created" : "updated"} successfully`
                );
                setFormData(feedbacksModuleSchema.form.initialValues);
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
        fetchingFeedback,
        formData,
        errors,
        handleClose,
        handleChange,
        handleSave,
    }
}
