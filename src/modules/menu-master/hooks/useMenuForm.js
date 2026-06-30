import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getMenuDetails, saveMenu } from "../data/menuMaster.service";
import { menuMasterSchema } from "../data/module.schema";
import { getMenuIdentifier, normalizeMenuData } from "../utils/menuMaster.utils";

export const useMenuForm = ({ isOpen, onClose, selectedMenu, onAfterSave }) => {
  const [loading, setLoading] = useState(false);
  const [fetchingMenu, setFetchingMenu] = useState(false);
  const [formData, setFormData] = useState(menuMasterSchema.form.initialValues);
  const [errors, setErrors] = useState({});

  const mode = selectedMenu ? "edit" : "create";
  const menuId = getMenuIdentifier(selectedMenu);

  useEffect(() => {
    const fetchMenuDetails = async () => {
      if (!isOpen || !menuId) return;

      try {
        setFetchingMenu(true);
        const res = await getMenuDetails(menuId);
        setFormData(normalizeMenuData(res?.data || selectedMenu));
      } catch (error) {
        toast.error("Unable to fetch menu details");
        setFormData(normalizeMenuData(selectedMenu));
      } finally {
        setFetchingMenu(false);
      }
    };

    if (selectedMenu && isOpen) {
      fetchMenuDetails();
      return;
    }

    setFormData(menuMasterSchema.form.initialValues);
    setErrors({});
  }, [selectedMenu, isOpen, menuId]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    const result = menuMasterSchema.validationSchema.safeParse(formData);

    if (!result.success) {
      const nextErrors = {};

      result.error.issues.forEach((item) => {
        nextErrors[item.path[0]] = item.message;
      });

      setErrors(nextErrors);
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      const res = await saveMenu({ mode, menuId, payload: formData });

      if (res.success) {
        toast.success(res?.message || `Menu ${mode === "create" ? "created" : "updated"} successfully`);
        setFormData(menuMasterSchema.form.initialValues);
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

  const handleClose = () => {
    setFormData(menuMasterSchema.form.initialValues);
    setErrors({});
    onClose();
  };

  return {
    loading,
    fetchingMenu,
    formData,
    errors,
    handleChange,
    handleSave,
    handleClose,
  };
};
