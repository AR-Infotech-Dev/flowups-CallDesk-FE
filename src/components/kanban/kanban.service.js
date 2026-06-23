import { makeRequest } from "@/api/httpClient";

export const fetchKanbanColumns = async (config = {}) => {
  return await makeRequest(config.columnsApi || "/system/searchSlugList", {
    method: "POST",
    body: {
      tableName: config.categoryTableName || "categories",
      selectFields: config.categorySelectFields || "category_id,categoryName,cat_color",
      searchField: config.categorySearchField || "categoryName",
      slug: config.categoryParentSlug,
      status: config.categoryStatus || "active",
    },
  });
};

export const updateKanbanCardStatus = async ({ config = {}, movedCard, targetColumnId }) => {
  const updatePath = typeof config.updateApi === "function"
    ? config.updateApi(movedCard, targetColumnId)
    : config.appendIdToUpdateApi === false
      ? config.updateApi
      : `${config.updateApi}/${movedCard[config.idField]}`;

  const updateBody = typeof config.buildUpdateBody === "function"
    ? config.buildUpdateBody(movedCard, targetColumnId)
    : { [config.statusField]: targetColumnId };

  return await makeRequest(updatePath, {
    method: config.updateMethod || "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updateBody),
  });
};
