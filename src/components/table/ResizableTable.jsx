import { Fragment, useEffect, useMemo, useState } from "react";
import TableHeader from "./TableHeader";
import TableSkeleton from "./TableSkeleton";
import NoTableData from "./NoTableData";
import ColumnArranger from "./ColumnArranger";
import { useAuth } from "@auth/components/AuthProvider";
import { hasFieldVisiblePermission } from "@auth/utils/permissions";
import {
  ACTIONS_COLUMN,
  DEFAULT_COLUMN_WIDTH,
  DefaultRow,
  createRowRenderContext,
  getColumnWidth,
  getRowIdentifier,
} from "./tableRowHelpers";

window.TIMEFORMAT = "Do MMMM YYYY"

const VISIBLE_COLUMNS_STORAGE_SUFFIX = "-visible-columns";

function getStoredWidths(storageKey) {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    return JSON.parse(window.localStorage.getItem(storageKey) || "{}");
  } catch {
    return {};
  }
}

function getStoredVisibleColumnKeys(storageKey) {
  if (!storageKey || typeof window === "undefined") {
    return null;
  }

  try {
    const parsedValue = JSON.parse(window.localStorage.getItem(`${storageKey}${VISIBLE_COLUMNS_STORAGE_SUFFIX}`) || "null");
    return Array.isArray(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
}

function setStoredVisibleColumnKeys(storageKey, columnKeys = []) {
  if (!storageKey || typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(`${storageKey}${VISIBLE_COLUMNS_STORAGE_SUFFIX}`, JSON.stringify(columnKeys));
}

function getFixedColumnKeys(columns) {
  return columns
    .filter((column) => column.checkbox || column.className === "icon-col" || column.isAlwaysVisible)
    .map((column) => column.key);
}

function getDefaultVisibleColumnKeys(columns, defaultVisibleColumnKeys = []) {
  const fixedColumnKeys = getFixedColumnKeys(columns);

  if (defaultVisibleColumnKeys.length) {
    return [...new Set([...fixedColumnKeys, ...defaultVisibleColumnKeys])];
  }
  return columns.map((column) => column.key);
}

function normalizeVisibleColumnKeys(columns, columnKeys = [], defaultVisibleColumnKeys = [], useDefaults = false) {
  const availableKeySet = new Set(columns.map((column) => column.key));
  const fixedColumnKeys = getFixedColumnKeys(columns);
  const sourceKeys = useDefaults
    ? getDefaultVisibleColumnKeys(columns, defaultVisibleColumnKeys)
    : columnKeys;
  const normalizedKeys = sourceKeys.filter((key) => availableKeySet.has(key));
  const missingFixedKeys = fixedColumnKeys.filter((key) => !normalizedKeys.includes(key));

  return [...new Set([...missingFixedKeys, ...normalizedKeys])];
}

function hasMatchingStoredColumnKeys(columns, storedKeys = []) {
  if (!Array.isArray(storedKeys) || storedKeys.length === 0) {
    return false;
  }

  const fixedColumnKeys = new Set(getFixedColumnKeys(columns));
  const availableKeySet = new Set(columns.map((column) => column.key));

  return storedKeys.some((key) => availableKeySet.has(key) && !fixedColumnKeys.has(key));
}

function getInitialVisibleColumnKeys(columns, storageKey, defaultVisibleColumnKeys = []) {
  const storedKeys = getStoredVisibleColumnKeys(storageKey);
  const useStoredKeys = hasMatchingStoredColumnKeys(columns, storedKeys);

  return normalizeVisibleColumnKeys(
    columns,
    useStoredKeys ? storedKeys : [],
    defaultVisibleColumnKeys,
    !useStoredKeys
  );
}

function ResizableTable({
  columns,
  rows = [],
  storageKey,
  renderRow,
  editRow,
  onEditRow,
  onDeleteRow,
  rowActions = [],
  renderActions,
  showActions,
  loading,
  sortConfig,
  onSortChange,
  selectedRowIds = [],
  onToggleRow,
  onToggleAllRows,
  defaultVisibleColumnKeys = [],
  allowSelection = true,
  menuId,
  onVisibleColumnsChange,
}) {
  
  const { authSession } = useAuth();
  const user = authSession?.user;
  const [columnWidths, setColumnWidths] = useState(() => getStoredWidths(storageKey));
  const [visibleColumnKeys, setVisibleColumnKeys] = useState(() => {
    return getInitialVisibleColumnKeys(columns, storageKey, defaultVisibleColumnKeys);
  });
  

  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const handleEditRow = onEditRow || editRow;
  const shouldShowActions = showActions ?? Boolean(handleEditRow || onDeleteRow || rowActions.length || renderActions);

  useEffect(() => {
    if (!storageKey) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(columnWidths));
  }, [columnWidths, storageKey]);

  useEffect(() => {
    const storedKeys = getStoredVisibleColumnKeys(storageKey);
    const useStoredKeys = hasMatchingStoredColumnKeys(columns, storedKeys);

    setVisibleColumnKeys((current) => {
      if (useStoredKeys) {
        return normalizeVisibleColumnKeys(columns, storedKeys, defaultVisibleColumnKeys, false);
      }

      return normalizeVisibleColumnKeys(
        columns,
        [],
        defaultVisibleColumnKeys,
        true
      );
    });
  }, [columns, defaultVisibleColumnKeys, storageKey]);

  const handleApplyColumnKeys = (nextColumnKeys) => {
    const normalizedKeys = normalizeVisibleColumnKeys(columns, nextColumnKeys, defaultVisibleColumnKeys, false);
    setVisibleColumnKeys(normalizedKeys);
    setStoredVisibleColumnKeys(storageKey, normalizedKeys);
  };

  const resolvedColumns = useMemo(
    () => {
      const visibleColumns = visibleColumnKeys
        .map((key) => columns.find((column) => column.key === key))
        .filter(Boolean)
        .filter((column) => allowSelection || !column.checkbox)
        .filter((column) => column.checkbox || column.className === "icon-col" || column.isAlwaysVisible || hasFieldVisiblePermission({ menuId, field: column, user }))
        .map((column) => ({
          ...column,
          currentWidth: Math.max(
            getColumnWidth(column.minWidth, 40),
            getColumnWidth(columnWidths[column.key], column.width, DEFAULT_COLUMN_WIDTH)
          ),
        }));

      if (!shouldShowActions) {
        return visibleColumns;
      }

      return [
        ...visibleColumns,
        {
          ...ACTIONS_COLUMN,
          currentWidth: Math.max(
            getColumnWidth(ACTIONS_COLUMN.minWidth, 90),
            getColumnWidth(columnWidths[ACTIONS_COLUMN.key], ACTIONS_COLUMN.width, ACTIONS_COLUMN.minWidth)
          ),
        },
      ];
    },
    [allowSelection, columnWidths, columns, menuId, shouldShowActions, user, visibleColumnKeys]
  );

  useEffect(() => {
    if (typeof onVisibleColumnsChange !== "function") return;
    onVisibleColumnsChange(
      resolvedColumns
        .filter((column) => !column.checkbox && column.key !== ACTIONS_COLUMN.key)
        .map((column) => column.key)
    );
  }, [onVisibleColumnsChange, resolvedColumns]);

  const selectableRows = useMemo(
    () => rows.map((row) => getRowIdentifier(row)).filter(Boolean),
    [rows]
  );

  const allRowsSelected = selectableRows.length > 0 && selectableRows.every((rowId) => selectedRowIds.includes(rowId));

  const selectionProps = useMemo(
    () => ({
      selectedRowIds,
      onToggleRow,
      allowSelection,
    }),
    [allowSelection, onToggleRow, selectedRowIds]
  );

  const rowRenderContext = useMemo(
    () =>
      createRowRenderContext({
        editRow: handleEditRow,
        selectionProps,
        onDeleteRow,
        rowActions,
        renderActions,
      }),
    [handleEditRow, onDeleteRow, renderActions, rowActions, selectionProps]
  );

  const handleResize = (key, nextWidth) => {
    setColumnWidths((current) => ({
      ...current,
      [key]: nextWidth,
    }));
  };
  return (
    <div className="table-card">
      <ColumnArranger
        setIsColumnMenuOpen={setIsColumnMenuOpen}
        isColumnMenuOpen={isColumnMenuOpen}
        columns={columns}
        visibleColumnKeys={visibleColumnKeys}
        onApplyColumnKeys={handleApplyColumnKeys}
      />

      <div className="table-scroll-x">
        <table style={{ width: "100%", minWidth: "100%" }}>
          <TableHeader
            setIsColumnMenuOpen={setIsColumnMenuOpen}
            columns={resolvedColumns}
            onResize={handleResize}
            sortConfig={sortConfig}
            onSortChange={onSortChange}
            allRowsSelected={allRowsSelected}
            onToggleAllRows={allowSelection ? onToggleAllRows : undefined}
          />

          <tbody>
            {loading && <TableSkeleton resolvedColumns={resolvedColumns} rows={10} />}

            {!loading &&
              rows.map((row, index) => {
                const rowKey = getRowIdentifier(row) ?? row?.name ?? index;

                return typeof renderRow === "function" ? (
                  <Fragment key={rowKey}>
                    {renderRow(row, index, resolvedColumns, rowRenderContext)}
                  </Fragment>
                ) : (
                  <DefaultRow
                    key={rowKey}
                    row={row}
                    index={index}
                    columns={resolvedColumns}
                    editRow={handleEditRow}
                    selectionProps={selectionProps}
                    onDeleteRow={onDeleteRow}
                    rowActions={rowActions}
                    renderActions={renderActions}
                  />
                );
              })}

            {!loading && rows.length === 0 && (
              <NoTableData colSpan={Math.max(resolvedColumns.length, 1)} />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ResizableTable;
