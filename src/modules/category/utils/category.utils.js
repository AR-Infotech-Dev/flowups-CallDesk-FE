import { categoryModuleSchema } from "../data/module.schema";

export function getCategoryIdentifier(category = {}) {
  return category?.category_id || category?.id;
}

export function slugifyCategory(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function normalizeCategoryData(category = {}) {
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
    categories_index: category?.categories_index || "",
  };
}

export function normalizeCategorySavePayload(formData = {}) {
  return {
    ...formData,
    slug: slugifyCategory(formData.slug || formData.categoryName),
    parent_id: formData.is_parent === "yes" ? "" : formData.parent_id,
  };
}
