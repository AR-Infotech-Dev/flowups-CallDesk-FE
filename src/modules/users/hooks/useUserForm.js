import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { getUserIdentifier, normalizeUserData, generateCredentials } from "../utils/users.utils";
import { getUserDetails, saveUser } from "../data/users.service";
import { usersModuleSchema } from "../data/module.schema";

export const useUserForm = ({ isOpen, onClose, onAfterSave, selectedUser }) => {
    const [loading, setLoading] = useState(false);
    const [fetchingUser, setFetchingUser] = useState(false);
    const [formData, setFormData] = useState(usersModuleSchema.form.initialValues);
    const [errors, setErrors] = useState({});
    const mode = selectedUser ? "edit" : "create";
    const userID = getUserIdentifier(selectedUser);

    useEffect(() => {
        const fetchUserDetails = async () => {
            if (!isOpen || !userID) { return; }
            try {
                setFetchingUser(true);
                const res = await getUserDetails(userID)
                const userData = res?.data;
                setFormData(normalizeUserData(userData));
            } catch (error) {
                toast.error("Unable to fetch user details");
                setFormData(normalizeUserData(selectedUser));
            } finally {
                setFetchingUser(false);
            }
        };
        // EDIT MODE
        if (selectedUser && isOpen) { fetchUserDetails(); return; }
        // CREATE MODE
        setFormData(usersModuleSchema.form.initialValues);
    }, [selectedUser, isOpen, userID]);

    const handleClose = () => {
        setFormData(usersModuleSchema.form.initialValues);
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
        const result = usersModuleSchema.validationSchema.safeParse(formData);
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
            const res = await saveUser({ mode, userID, formData });
            if (res.success) {
                toast.success(
                    res?.message ||
                    `User ${mode === "create" ? "created" : "updated"} successfully`
                );
                setFormData(usersModuleSchema.form.initialValues);
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
        fetchingUser,
        formData,
        errors,
        handleClose,
        handleChange,
        handleSave,
    }
}
