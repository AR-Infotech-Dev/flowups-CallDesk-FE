# Kanban Usage Guide

This guide explains how to reuse the shared Kanban board in another module.

## Files Involved

- `src/components/kanban/KanbanBoard.jsx` - main board, drag/drop, update API, lazy load.
- `src/components/kanban/KanbanColumn.jsx` - one status column and scroll-based lazy loading.
- `src/components/kanban/KanbanCard.jsx` - card UI and drag preview.
- `src/components/kanban/kanbanUtils.js` - column normalization, grouping, and reorder helpers.

## Basic Usage

Import `KanbanBoard` in your module page:

```jsx
import KanbanBoard from "../../components/kanban/KanbanBoard";
```

Render it when the module is in Kanban view:

```jsx
<KanbanBoard
  rows={moduleRows}
  config={moduleSchema.kanban}
  loading={loading}
  editRow={(row) => {
    setSelectedRow(row);
    setIsFlyoutOpen(true);
  }}
  onAfterUpdate={getModuleList}
/>
```

## Required Schema

Add a `kanban` object in that module schema:

```js
kanban: {
  enabled: true,

  // Columns are loaded from categories by slug.
  categoryParentSlug: "ticket_status",
  categoryTableName: "categories",
  categorySelectFields: "category_id,categoryName,cat_color",
  categorySearchField: "categoryName",
  categoryValueKey: "category_id",
  categoryLabelKey: "categoryName",
  categoryColorKey: "cat_color",

  // Row fields used by Kanban.
  statusField: "ticket_status",
  idField: "ticket_id",
  titleField: "ticket_no",

  // API called after card is dropped into another column.
  updateApi: "/tickets/update_status",
  appendIdToUpdateApi: true,
  updateMethod: "POST",
  buildUpdateBody: (row, targetColumnId) => ({
    ticket_status: targetColumnId,
  }),

  // Fields shown inside every card.
  cardFields: [
    { key: "client_id", label: "Client" },
    { key: "contact_person", label: "Contact" },
    { key: "query_type", label: "Type", type: "badge", colorField: "type_color" },
    { key: "due_date", label: "Due", type: "date" },
    { key: "ticket_priority", label: "Priority", type: "tag", colorField: "priority_color" },
  ],
}
```

## Update API Contract

When a card is dropped into another column, `KanbanBoard` calls:

```js
`${updateApi}/${row[idField]}`
```

Example:

```txt
POST /tickets/update_status/123
```

Body comes from `buildUpdateBody`:

```json
{
  "ticket_status": "205"
}
```

If your backend does not need the row id in the URL, set:

```js
appendIdToUpdateApi: false
```

Then include the id in `buildUpdateBody`:

```js
buildUpdateBody: (row, targetColumnId) => ({
  ticket_id: row.ticket_id,
  ticket_status: targetColumnId,
})
```

## Lazy Load Usage

For large modules, use per-column lazy loading:

```jsx
<KanbanBoard
  rows={moduleRows}
  config={moduleSchema.kanban}
  loading={loading}
  lazyLoad
  reloadKey={JSON.stringify({
    searchText: filterState.searchText,
    filters: filterState.filters,
    order: filterState.order,
    order_by: filterState.order_by,
  })}
  onLoadColumnPage={getKanbanColumnPage}
  editRow={editRow}
  onAfterUpdate={getModuleList}
/>
```

Add the loader function in the module page:

```js
const getKanbanColumnPage = useCallback(
  async ({ columnId, page }) => {
    const statusFilter = {
      field: moduleSchema.kanban.statusField,
      condition: "equal_to",
      value: String(columnId),
      type: "select",
    };

    const res = await makeRequest(moduleSchema.api.list, {
      method: "POST",
      body: {
        status: "active",
        page,
        searchText: filterState.searchText,
        filters: [
          ...(filterState.filters || []),
          statusFilter,
        ],
        order: filterState.order,
        order_by: filterState.order_by,
        [moduleSchema.kanban.statusField]: columnId,
      },
    });

    if (!res.success) {
      throw new Error(res?.message || "Error while fetching kanban data");
    }

    return {
      rows: res.data || [],
      pagination: res.pagination || {},
    };
  },
  [
    filterState.searchText,
    filterState.order,
    filterState.order_by,
    JSON.stringify(filterState.filters),
  ]
);
```

## Lazy Load Response Contract

The list API should return:

```js
{
  success: true,
  data: [],
  pagination: {
    page: 1,
    totalPages: 5,
    total: 100,
    start: 1,
    end: 20
  }
}
```

Kanban loads the next page only when:

```js
pagination.page < pagination.totalPages
```

## How Drag And Drop Works

1. User drags a card.
2. `DragOverlay` shows the floating card preview with high z-index.
3. On drop, the card moves immediately in UI.
4. If the target column is different, update API is called.
5. If update succeeds, the board stays as-is.
6. If update fails, the board rolls back to the previous state.

## Checklist For New Module

- Add `kanban` config in module schema.
- Make sure `statusField` matches the row status field.
- Make sure `idField` is unique for every row.
- Make sure category columns return id, title, and optional color.
- Add `cardFields` for the card display.
- Confirm update API path and body.
- If using lazy load, implement `onLoadColumnPage`.
- Hide table pagination footer in Kanban mode if each column is lazy-loaded.

