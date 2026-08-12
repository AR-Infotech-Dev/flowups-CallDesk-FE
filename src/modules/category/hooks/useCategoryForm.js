import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { categoryModuleSchema } from "../data/module.schema";
import { getCategoryDetails, saveCategory, updateChildrenOrder } from "../data/categories.service";
import {
  getCategoryIdentifier,
  normalizeCategoryData,
  normalizeCategorySavePayload,
  slugifyCategory,
} from "../utils/category.utils";

export const useCategoryForm = ({ isOpen, onClose, selectedCategory, onAfterSave }) => {
  const [loading, setLoading] = useState(false);
  const [fetchingCategory, setFetchingCategory] = useState(false);
  const [formData, setFormData] = useState(categoryModuleSchema.form.initialValues);
  const [errors, setErrors] = useState({});

  const mode = selectedCategory ? "edit" : "create";
  const categoryId = getCategoryIdentifier(selectedCategory);

  useEffect(() => {
    const fetchCategoryDetails = async () => {
      if (!isOpen || !categoryId) return;

      try {
        setFetchingCategory(true);
        const res = await getCategoryDetails(categoryId);
        setFormData(normalizeCategoryData(res?.data || selectedCategory));
      } catch (error) {
        toast.error("Unable to fetch category details");
        setFormData(normalizeCategoryData(selectedCategory));
      } finally {
        setFetchingCategory(false);
      }
    };

    if (selectedCategory && isOpen) {
      fetchCategoryDetails();
      return;
    }

    setFormData(categoryModuleSchema.form.initialValues);
    setErrors({});
  }, [selectedCategory, isOpen, categoryId]);

  const handleClose = () => {
    setFormData(categoryModuleSchema.form.initialValues);
    setErrors({});
    onClose();
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => {
      const nextState = {
        ...current,
        [name]: value,
      };

      if (name === "categoryName") {
        const currentSlug = String(current.slug || "");
        const nextSlug = slugifyCategory(value);
        const previousGeneratedSlug = slugifyCategory(current.categoryName || "");

        if (!currentSlug || currentSlug === previousGeneratedSlug) {
          nextState.slug = nextSlug;
        }
      }

      if (name === "is_parent" && value === "yes") {
        nextState.parent_id = null;
      }

      return nextState;
    });
  };

  const handleSave = async () => {
    const payload = {
      ...normalizeCategorySavePayload(formData),

      parent_id: formData.is_parent === "yes" ? null : Number(formData.parent_id),
      children: (formData.children || []).map((child, index) => ({ category_id: child.category_id, categories_index: index + 1, })), };
    console.log("SAVE PAYLOAD:", payload);
    const result = categoryModuleSchema.validationSchema.safeParse(payload);
    if (!result.success) {
      const nextErrors = {};
      result.error.issues.forEach((issue) => {
        nextErrors[issue.path[0]] = issue.message;
      });
      setErrors(nextErrors);
      return;
    }

    try {
      setErrors({});
      setLoading(true);
      const res = await saveCategory({ mode, categoryId, payload });

      if (res.success) {
        toast.success(res?.message || `Category ${mode === "create" ? "created" : "updated"} successfully`);
        setFormData(categoryModuleSchema.form.initialValues);
        onClose();
        onAfterSave?.();
        return;
      }

      toast.error(res?.msg || res?.message || "Something went wrong");
    } catch (error) {
      toast.error(error.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    fetchingCategory,
    formData,
    errors,
    handleClose,
    handleChange,
    handleSave,
  };
};
