function normalizeMatchValue(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_\s-]+/g, " ");
}

// Compares row status with a Kanban column using id, title, slug, or category name.
function matchesColumn(rowValue, column) {
  const normalizedRowValue = normalizeMatchValue(rowValue);
  if (!normalizedRowValue) {
    return false;
  }

  const candidates = [
    column?.id,
    column?.title,
    column?.raw?.slug,
    column?.raw?.categoryName,
    column?.raw?.name,
  ]
    .map(normalizeMatchValue)
    .filter(Boolean);

  return candidates.includes(normalizedRowValue);
}

// Converts category API response into the small shape used by the board.
export function normalizeKanbanColumns(rawColumns = [], config = {}) {
  const valueKey = config.categoryValueKey || "category_id";
  const labelKey = config.categoryLabelKey || "categoryName";
  const colorKey = config.categoryColorKey || "cat_color";

  return rawColumns.map((item) => ({
    id: String(item?.[valueKey] ?? ""),
    title: item?.[labelKey] || "Untitled",
    color: item?.[colorKey] || "",
    raw: item,
  })).filter((item) => item.id);
}

// Groups incoming rows by Kanban column and attaches UI-only metadata.
export function buildKanbanState(columns = [], rows = [], config = {}) {
  const statusField = config.statusField;
  const idField = config.idField;

  return columns.reduce((accumulator, column) => {
    accumulator[column.id] = rows
      .filter((row) => matchesColumn(row?.[statusField], column))
      .map((row) => ({
        ...row,
        _kanbanId: String(row?.[idField]),
        _kanbanColumnId: String(column.id),
        _kanbanColumnTitle: column.title,
        _kanbanColumnColor: column.color,
      }))
      .filter((row) => row._kanbanId);

    return accumulator;
  }, {});
}

// Finds the current column for a card id inside the board state.
export function findColumnIdForCard(boardState = {}, cardId) {
  return Object.keys(boardState).find((columnId) =>
    (boardState[columnId] || []).some((item) => String(item._kanbanId) === String(cardId))
  );
}

// Reorders cards locally after drag/drop; backend persistence happens in KanbanBoard.
export function reorderKanbanState(
  boardState,
  activeCardId,
  fromColumnId,
  toColumnId,
  targetIndex = -1,
  config = {},
  targetColumn = null
) {
  const nextState = Object.fromEntries(
    Object.entries(boardState).map(([columnId, items]) => [columnId, [...items]])
  );

  const sourceItems = nextState[fromColumnId] || [];
  const movingIndex = sourceItems.findIndex((item) => String(item._kanbanId) === String(activeCardId));

  if (movingIndex === -1) {
    return boardState;
  }

  const [sourceItem] = sourceItems.splice(movingIndex, 1);
  const movingItem = {
    ...sourceItem,
    ...(config.statusField ? { [config.statusField]: toColumnId } : {}),
    _kanbanStatus: toColumnId,
    _kanbanColumnId: toColumnId,
    _kanbanColumnTitle: targetColumn?.title || sourceItem._kanbanColumnTitle,
    _kanbanColumnColor: targetColumn?.color || sourceItem._kanbanColumnColor,
  };

  const destinationItems = nextState[toColumnId] || [];
  const safeTargetIndex =
    targetIndex < 0 || targetIndex > destinationItems.length
      ? destinationItems.length
      : targetIndex;

  destinationItems.splice(safeTargetIndex, 0, movingItem);
  nextState[fromColumnId] = sourceItems;
  nextState[toColumnId] = destinationItems;

  return nextState;
}

export function resolveCardValue(row, field) {
  if (!field) {
    return "";
  }

  const key = typeof field === "string" ? field : field.key;
  return row?.[key];
}

export function isInlineColorValue(value) {
  if (!value) {
    return false;
  }

  return /^(#|rgb|hsl|var\()/i.test(String(value).trim());
}
