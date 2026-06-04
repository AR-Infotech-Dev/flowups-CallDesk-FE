import { createElement, isValidElement, useEffect, useMemo, useState } from "react";
import { Edit3, Star, Trash2 } from "lucide-react";
import moment from "moment";
import TableHeader from "./TableHeader";
import TableSkeleton from "./TableSkeleton";
import NoTableData from "./NoTableData";
import ColumnArranger from "./ColumnArranger";
import { useAuth } from "../../auth/AuthProvider";
import { hasFieldVisiblePermission } from "../../auth/permissions";
import { isAmcActive } from "../../utils/amc";

window.TIMEFORMAT = "Do MMMM YYYY"

const STATUS_CLASS_MAP = {
  active: "status-green",
  pending: "status-amber",
  inactive: "status-gray",
  rejected: "status-red",
  review: "status-purple",
  closed: "status-gray",
  resolved: "status-green",
  open: "status-blue",
};

const PILL_BASE_CLASS = {
  badge: "badge",
  status: "status-pill",
  tag: "tag",
};

function getCellStyle(column) {
  return {
    width: column.currentWidth,
    minWidth: column.currentWidth,
    maxWidth: column.currentWidth,
  };
}

const ACTIONS_COLUMN = {
  key: "__actions",
  label: "Actions",
  width: "auto",
  minWidth: 90,
  resizable: true,
  isAlwaysVisible: true,
  isActionsColumn: true,
};

function getRowIdentifier(row) {
  return (
    row?._id ??
    row?.id ??
    row?.adminID ??
    row?.ticketID ??
    row?.ticket_id ??
    row?.roleId ??
    row?.userId ??
    row?.menu_id ??
    row?.customer_id ??
    row?.company_id ??
    row?.category_id
  );
}

function getStatusClass(value) {
  if (!value) {
    return "status-gray";
  }

  return STATUS_CLASS_MAP[String(value).trim().toLowerCase()] || "status-gray";
}

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
    const parsedValue = JSON.parse(window.localStorage.getItem(`${storageKey}-visible-columns`) || "null");
    return Array.isArray(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
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

// function getColumnCellType(column) {
//   if (typeof column.cellType === "object" && column.cellType !== null) {
//     return column.cellType.type || "text";
//   }

//   return column.cellType || "text";
// }

// Replace getColumnCellType() function with this updated version

function getColumnCellType(column) {
  if (typeof column.cellType === "object" && column.cellType !== null) {
    return column.cellType.type || "text";
  }

  const explicitType = column.cellType || "";
  if (column.key.toLowerCase().includes("date")) {
    return "date";
  }
  if (explicitType) return explicitType;

  return "text";
}

function getColumnColorField(column) {
  if (typeof column.cellType === "object" && column.cellType !== null) {
    return column.cellType.colorField || column.cellType.color_field || "";
  }

  return column.colorField || column.color_field || "";
}

function isInlineColorValue(value) {
  if (!value) {
    return false;
  }

  return /^(#|rgb|hsl|var\()/i.test(String(value).trim());
}

function getInlineBadgeStyle(colorValue) {
  if (!isInlineColorValue(colorValue)) {
    return undefined;
  }

  return {
    // color: colorValue,
    // border:`1px solid ${colorValue} `,
    // backgroundColor: "#ffffff" ,
    color: "#ffffff",
    border: colorValue,
    backgroundColor: colorValue,
  };
}

function getBadgeClassName(type, colorValue, fallbackClassName) {
  const baseClassName = PILL_BASE_CLASS[type] || "status-pill";

  if (!colorValue || isInlineColorValue(colorValue)) {
    return baseClassName;
  }

  return `${baseClassName} ${colorValue}`;
}

function renderCheckboxCell(row, selectionProps) {
  const rowId = getRowIdentifier(row);
  const { selectedRowIds = [], onToggleRow, allowSelection = true } = selectionProps;

  // Delete permission controls row selection. If delete is not allowed, checkbox is hidden.
  if (!allowSelection) return null;

  return (
    <input
      type="checkbox"
      checked={selectedRowIds.includes(rowId)}
      onChange={(event) => {
        event.stopPropagation();
        onToggleRow?.(rowId, event.target.checked);
      }}
      onClick={(event) => event.stopPropagation()}
    />
  );
}

function renderFavoriteCell(row) {
  return (
    <button className="table-icon-button user-favorite-button">
      <Star size={14} fill={row.favorite ? "currentColor" : "none"} />
    </button>
  );
}

function renderPersonCell(value, row, colorField, index) {
  const avatarColor = row?.[colorField];
  const avatarStyle = isInlineColorValue(avatarColor)
    ? { background: avatarColor }
    : undefined;

  return (
    <div className="person-cell">
      <span
        className={`person-avatar ${avatarStyle ? "" : `avatar-${index % 12}`}`.trim()}
        style={avatarStyle}
      >
        {String(value || "?").charAt(0)}
      </span>
      <span className="text-overflow">{value || "-"}</span>
      {isAmcActive(row) ? <span className="table-amc-chip">AMC</span> : null}
    </div>
  );
}

function renderDotTextCell(value, row, colorField, index) {
  const dotColor = row?.[colorField];
  const dotStyle = isInlineColorValue(dotColor)
    ? { background: dotColor }
    : undefined;
  const dotClassName = dotStyle ? "company-dot" : `company-dot user-department-dot dept-${index % 5}`;

  return (
    <div className="company-cell">
      <span className={dotClassName} style={dotStyle} />
      <span className="text-overflow">{value || "-"}</span>
    </div>
  );
}

function renderBadgeCell(type, value, row, colorField) {
  const colorValue = row?.[colorField];
  const fallbackClassName = type === "status" ? getStatusClass(value) : type === "tag" ? "lilac" : "status-gray";
  const className = getBadgeClassName(type, colorValue, fallbackClassName);
  const inlineStyle = getInlineBadgeStyle(colorValue);
  const finalClassName = !colorValue || isInlineColorValue(colorValue)
    ? `${PILL_BASE_CLASS[type] || "status-pill"} ${fallbackClassName}`
    : className;

  return (
    <span className={`text-overflow ${finalClassName}`} style={inlineStyle}>
      {value || "-"}
    </span>
  );
}

function changeTimeFormat(date) {
  const parsedDate = moment(date, [
    moment.ISO_8601,
    "DD-MM-YYYY",
    "YYYY-MM-DD",
    "YY-MM-DD",
    "Do MMMM YYYY",
    "MMMM Do YYYY"
  ]);

  if (!parsedDate.isValid()) return "-";

  const timeFormat = window.TIMEFORMAT || "DD-MM-YYYY";

  switch (timeFormat) {
    case "DD-MM-YYYY":
      return parsedDate.format("DD-MM-YYYY");

    case "YYYY:MM:DD":
      return parsedDate.format("YYYY:MM:DD");

    case "YY:MM:DD":
      return parsedDate.format("YY:MM:DD");

    case "Do MMMM YYYY":
      return parsedDate.format("Do MMMM YYYY");

    case "MMMM Do YYYY":
      return parsedDate.format("MMMM Do YYYY");

    case "DD:MM:YY":
      return parsedDate.format("DD:MM:YY");

    default:
      return parsedDate.format("DD-MM-YYYY");
  }
}

// function padZero(value) {
//   return String(value).padStart(2, "0");
// }

// function formatDateByType(dateValue, formatType = "5") {
//   if (!dateValue) return "-";

//   const date = new Date(dateValue);
//   if (isNaN(date.getTime())) return dateValue;

//   const dd = padZero(date.getDate());
//   const mm = padZero(date.getMonth() + 1);
//   const yyyy = date.getFullYear();
//   const yy = String(yyyy).slice(-2);

//   const monthShort = date.toLocaleString("en-US", { month: "short" });
//   const monthLong = date.toLocaleString("en-US", { month: "long" });

//   const hh = padZero(date.getHours());
//   const min = padZero(date.getMinutes());

//   switch (String(formatType)) {
//     case "1":
//       return `${dd}/${mm}/${yyyy}`; // d/m/yyyy

//     case "2":
//       return `${mm}/${dd}/${yyyy}`; // m/d/yyyy

//     case "3":
//       return `${dd}/${mm}/${yy}`; // d/m/yy

//     case "4":
//       return `${mm}/${dd}/${yy}`; // m/d/yy

//     case "5":
//       return `${dd}-${mm}-${yy}`; // d-m-yy

//     case "6":
//       return `${mm}-${dd}-${yy}`; // m-d-yy

//     case "7":
//       return `${dd} ${monthLong} ${yyyy}`; // d Month yyyy

//     case "8":
//       return `${monthShort} ${dd} ${yyyy}`; // Month d yyyy

//     case "9":
//       return `${yyyy}-${mm}-${dd}`; // yyyy-m-d

//     case "t":
//       return `${hh}:${min}`; // time only

//     case "0":
//     default:
//       return date.toLocaleDateString("en-IN");
//   }
// }

function renderValueCell(column, row, index, selectionProps) {
  const value = row?.[column.key];
  const cellType = getColumnCellType(column);
  const colorField = getColumnColorField(column);

  if (column.checkbox) {
    return renderCheckboxCell(row, selectionProps);
  }

  if (column.className === "icon-col") {
    return renderFavoriteCell(row);
  }

  switch (cellType) {


    case "person":
      return renderPersonCell(value, row, colorField, index);

    case "clip":
      return <div className="text-overflow table-text-clip">{value || "-"}</div>;

    case "tag":
      return renderBadgeCell("tag", value, row, colorField);

    case "badge":
      return renderBadgeCell("badge", value, row, colorField);

    case "status":
      return renderBadgeCell("status", value, row, colorField);

    case "dotText":
      return renderDotTextCell(value, row, colorField, index);

    case "date":
      return value ? changeTimeFormat(value) : "-";

    case "currency":
      return value ? `Rs ${Number(value).toLocaleString("en-IN")}` : "Rs 0";

    default:
      return value ?? "-";
  }
}

function normalizeAction(action, row, index) {
  if (typeof action === "function") {
    return action(row, index);
  }

  return action;
}

function renderActionIcon(icon) {
  if (!icon) return null;
  if (isValidElement(icon)) return icon;
  if (typeof icon === "function") {
    const Icon = icon;
    return <Icon size={14} />;
  }
  if (typeof icon === "object" && icon.$$typeof) {
    return createElement(icon, { size: 14 });
  }

  return null;
}

function ActionCell({ row, index, editRow, onDeleteRow, rowActions = [], renderActions }) {
  const customContent = typeof renderActions === "function" ? renderActions(row, index) : null;

  if (customContent) {
    return <div className="table-row-actions">{customContent}</div>;
  }

  const actions = [
    typeof editRow === "function"
      ? {
        key: "edit",
        label: "Edit",
        icon: Edit3,
        className: "table-action-edit",
        onClick: editRow,
      }
      : null,
    typeof onDeleteRow === "function"
      ? {
        key: "delete",
        label: "Delete",
        icon: Trash2,
        className: "table-action-delete",
        onClick: onDeleteRow,
      }
      : null,
    ...rowActions.map((action) => normalizeAction(action, row, index)),
  ].filter(Boolean).filter((action) => !action.hidden);

  if (!actions.length) return null;

  return (
    <div className="table-row-actions">
      {actions.map((action, actionIndex) => (
        <button
          key={action.key || action.label || actionIndex}
          type="button"
          className={`table-icon-button table-action-button ${action.className || ""}`.trim()}
          title={action.label}
          data-tooltip={action.label}
          aria-label={action.label}
          disabled={Boolean(action.disabled)}
          onClick={(event) => {
            event.stopPropagation();
            action.onClick?.(row, index, event);
          }}
        >
          {renderActionIcon(action.icon)}
        </button>
      ))}
    </div>
  );
}

// function DefaultRow({ row, index, columns, editRow, selectionProps }) {
//   const rowKey = getRowIdentifier(row) ?? row?.name ?? index;

//   return (
//     <tr key={rowKey} className="group">
//       {columns.map((column) => (
//         <td
//           key={column.key}
//           className={column.className || ""}
//           style={getCellStyle(column)}

//         >
//           {renderValueCell(column, row, index, selectionProps)}
//         </td>
//       ))}
//       <td className=" relative hidden group-hover:table-cell" >
//         <div className="flex absolute">
//           <span className="edit" onClick={typeof editRow === "function" ? () => editRow(row) : undefined}>
//             <Pencil size={12} /> 
//           </span>
//         </div>
//       </td>
//     </tr>
//   );
// }
function DefaultRow({ row, index, columns, editRow, selectionProps, onDeleteRow, rowActions, renderActions }) {
  const rowKey = getRowIdentifier(row) ?? row?.name ?? index;
  const activeAmc = isAmcActive(row);

  return (
    <tr key={rowKey} className={`group ${activeAmc ? "table-row-amc-active" : ""}`}>
      {columns.map((column) => (
        <td
          key={column.key}
          className={`${column.className || ""} ${column.isActionsColumn ? "table-actions-cell" : ""}`.trim()}
          style={getCellStyle(column)}
          onClick={
            // If editRow is missing, row click does nothing. Pages pass editRow only when edit permission exists.
            typeof editRow === "function" && !column.isActionsColumn && !column.checkbox
              ? () => editRow(row)
              : undefined
          }
        >
          {column.isActionsColumn ? (
            <ActionCell
              row={row}
              index={index}
              editRow={editRow}
              onDeleteRow={onDeleteRow}
              rowActions={rowActions}
              renderActions={renderActions}
            />
          ) : (
            renderValueCell(column, row, index, selectionProps)
          )}
        </td>
      ))}
      <td></td>
    </tr>
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
}) {
  const { authSession } = useAuth();
  const user = authSession?.user;
  const [columnWidths, setColumnWidths] = useState(() => getStoredWidths(storageKey));
  const [visibleColumnKeys, setVisibleColumnKeys] = useState(() => {
    const storedKeys = getStoredVisibleColumnKeys(storageKey);
    return normalizeVisibleColumnKeys(
      columns,
      storedKeys || [],
      defaultVisibleColumnKeys,
      !storedKeys
    );
  }
  );
  
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
    if (!storageKey || columns.length === 0) {
      return;
    }

    const storedKeys = getStoredVisibleColumnKeys(storageKey);
    if (storedKeys && visibleColumnKeys.length === 0) {
      return;
    }

    window.localStorage.setItem(`${storageKey}-visible-columns`, JSON.stringify(visibleColumnKeys));
  }, [columns.length, storageKey, visibleColumnKeys]);

  useEffect(() => {
    const storedKeys = getStoredVisibleColumnKeys(storageKey);

    setVisibleColumnKeys((current) => {
      if (storedKeys) {
        return normalizeVisibleColumnKeys(columns, storedKeys, defaultVisibleColumnKeys, false);
      }

      return normalizeVisibleColumnKeys(
        columns,
        current?.length ? current : [],
        defaultVisibleColumnKeys,
        !current?.length
      );
    });
  }, [columns, defaultVisibleColumnKeys, storageKey]);

  const handleApplyColumnKeys = (nextColumnKeys) => {
    setVisibleColumnKeys(
      normalizeVisibleColumnKeys(columns, nextColumnKeys, defaultVisibleColumnKeys, false)
    );
  };

  const resolvedColumns = useMemo(
    () => {
      const visibleColumns = visibleColumnKeys
        .map((key) => columns.find((column) => column.key === key))
        .filter(Boolean)
        .filter((column) => allowSelection || !column.checkbox)
        .filter((column) => column.checkbox || column.className === "icon-col" || hasFieldVisiblePermission({ menuId, field: column, user }))
        .map((column) => ({
          ...column,
          currentWidth: Math.max(column.minWidth || 40, columnWidths[column.key] || column.width || 800),
        }));

      if (!shouldShowActions) {
        return visibleColumns;
      }

      return [
        ...visibleColumns,
        {
          ...ACTIONS_COLUMN,
          currentWidth: Math.max(ACTIONS_COLUMN.minWidth, columnWidths[ACTIONS_COLUMN.key] || ACTIONS_COLUMN.width),
        },
      ];
    },
    [allowSelection, columnWidths, columns, menuId, shouldShowActions, user, visibleColumnKeys]
  );

  const tableWidth = useMemo(
    () => resolvedColumns.reduce((sum, column) => sum + column.currentWidth, 0),
    [resolvedColumns]
  );

  const selectableRows = useMemo(
    () => rows.map((row) => getRowIdentifier(row)).filter(Boolean),
    [rows]
  );

  const allRowsSelected =
    selectableRows.length > 0 &&
    selectableRows.every((rowId) => selectedRowIds.includes(rowId));

  const selectionProps = useMemo(
    () => ({
      selectedRowIds,
      onToggleRow,
      allowSelection,
    }),
    [allowSelection, onToggleRow, selectedRowIds]
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
              rows.map((row, index) =>
                typeof renderRow === "function" ? (
                  renderRow(row, index, resolvedColumns)
                ) : (
                  <DefaultRow
                    key={getRowIdentifier(row) ?? row?.name ?? index}
                    row={row}
                    index={index}
                    columns={resolvedColumns}
                    editRow={handleEditRow}
                    selectionProps={selectionProps}
                    onDeleteRow={onDeleteRow}
                    rowActions={rowActions}
                    renderActions={renderActions}
                  />
                )
              )}

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
