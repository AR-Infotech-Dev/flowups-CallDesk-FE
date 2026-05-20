import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";

import { makeRequest } from "../../../api/httpClient";
import FlyoutPanel from "../../../components/ui/FlyoutPanel";
import ActionButton from "../../../components/ui/ActionButton";
import Spinner from "../../../components/ui/Spinner";
import DynamicModuleForm from "../../../components/ui/DynamicModuleForm";
import { categoryModuleSchema } from "../data/module.schema";

function getCategoryIdentifier(category = {}) {
  return category?.category_id;
}

function slugifyCategory(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeCategoryData(category = {}) {
  return {
    ...categoryModuleSchema.form.initialValues,
    ...category,
    categoryName: category?.categoryName || "",
    slug: category?.slug || "",
    is_parent: category?.is_parent || category?.isParent || "yes",
    parent_id: category?.parent_id || "",
    cat_color: category?.cat_color || categoryModuleSchema.form.initialValues.cat_color,
    description: category?.description || "",
    status: category?.status || "active",
    is_sys_category: category?.is_sys_category || "no",
  };
}

function CategoryForm({ isOpen, onClose, selectedCategory, onAfterSave, menu_id }) {
  const [loading, setLoading] = useState(false);
  const [fetchingCategory, setFetchingCategory] = useState(false);
  const [formData, setFormData] = useState(categoryModuleSchema.form.initialValues);
  const [errors, setErrors] = useState({});
  const mode = selectedCategory ? "edit" : "create";
  const categoryId = getCategoryIdentifier(selectedCategory);

  useEffect(() => {
    const fetchCategoryDetails = async () => {
      if (!isOpen || !categoryId) {
        return;
      }

      try {
        setFetchingCategory(true);
        const res = await makeRequest(`${categoryModuleSchema.api.edit}/${categoryId}`, {
          method: "GET",
        });
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

  if (!isOpen) {
    return null;
  }

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
        nextState.parent_id = "";
      }

      return nextState;
    });
  };

  const handleSave = async () => {
    const payload = {
      ...formData,
      slug: slugifyCategory(formData.slug || formData.categoryName),
      parent_id: formData.is_parent === "yes" ? "" : formData.parent_id,
    };

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

      const saveUrl =
        mode === "create"
          ? categoryModuleSchema.api.create
          : `${categoryModuleSchema.api.edit}/${categoryId}`;

      const method = mode === "create" ? "PUT" : "POST";

      const res = await makeRequest(saveUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

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

  return (
    <FlyoutPanel
      isOpen={isOpen}
      onClose={handleClose}
      title={selectedCategory ? "Edit Category" : "Create Category"}
      closeButton={
        <button className="flyout-close" onClick={handleClose} aria-label="Close panel">
          <X size={18} />
        </button>
      }
      footer={
        <div className="flex w-full items-center justify-end gap-3">
          <ActionButton disabled={loading || fetchingCategory} variant="flyoutSecondary" onClick={handleClose}>
            Cancel
          </ActionButton>
          <ActionButton
            className={loading ? "bg-purple-200 cursor-not-allowed" : ""}
            disabled={loading || fetchingCategory}
            variant="flyoutSecondary"
            onClick={handleSave}
          >
            {loading || fetchingCategory ? <Spinner /> : null} Save
          </ActionButton>
        </div>
      }
    >
      <div className="flyout-form-shell">
        <div className="ws-main-container">
          {fetchingCategory ? (
            <div className="p-5 text-center">
              <Spinner />
            </div>
          ) : (
            <div className="rounded-xl bg-white px-4 py-3">
              <DynamicModuleForm
                sections={categoryModuleSchema.form.sections}
                values={formData}
                onChange={handleChange}
                errors={errors}
                menuId={menu_id}
              />
            </div>
          )}
        </div>
      </div>
    </FlyoutPanel>
  );
}

export default CategoryForm;
