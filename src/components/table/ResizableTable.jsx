import { useEffect, useMemo, useState } from "react";
import { Columns, Star, Pencil } from "lucide-react";
import moment from "moment";
import TableHeader from "./TableHeader";
import TableSkeleton from "./TableSkeleton";
import NoTableData from "./NoTableData";
import ColumnArranger from "./ColumnArranger";
import { useAuth } from "../../auth/AuthProvider";
import { hasFieldVisiblePermission } from "../../auth/permissions";

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
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return JSON.parse(window.localStorage.getItem(`${storageKey}-visible-columns`) || "null");
  } catch {
    return null;
  }
}

function getDefaultVisibleColumnKeys(columns, defaultVisibleColumnKeys = []) {
  const fixedColumnKeys = columns
    .filter((column) => column.checkbox || column.className === "icon-col" || column.isAlwaysVisible)
    .map((column) => column.key);

  if (defaultVisibleColumnKeys.length) {
    return [...new Set([...fixedColumnKeys, ...defaultVisibleColumnKeys])];
  }

  return columns.map((column) => column.key);
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
function DefaultRow({ row, index, columns, editRow, selectionProps }) {
  const rowKey = getRowIdentifier(row) ?? row?.name ?? index;

  return (
    <tr key={rowKey} className="group">
      {columns.map((column) => (
        <td
          key={column.key}
          className={column.className || ""}
          style={getCellStyle(column)}
          onClick={
            // If editRow is missing, row click does nothing. Pages pass editRow only when edit permission exists.
            typeof editRow === "function"
              ? () => editRow(row)
              : undefined
          }
        >
          {renderValueCell(column, row, index, selectionProps)}
        </td>
      ))}
    </tr>
  );
}

function ResizableTable({
  columns,
  rows = [],
  storageKey,
  renderRow,
  editRow,
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
  const [visibleColumnKeys, setVisibleColumnKeys] = useState(() =>
    getStoredVisibleColumnKeys(storageKey) || getDefaultVisibleColumnKeys(columns, defaultVisibleColumnKeys)
  );
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(columnWidths));
  }, [columnWidths, storageKey]);

  useEffect(() => {
    window.localStorage.setItem(`${storageKey}-visible-columns`, JSON.stringify(visibleColumnKeys));
  }, [storageKey, visibleColumnKeys]);

  useEffect(() => {
    const nextDefaultKeys = getDefaultVisibleColumnKeys(columns, defaultVisibleColumnKeys);
    const storedKeys = getStoredVisibleColumnKeys(storageKey);

    setVisibleColumnKeys((current) => {
      const preferredKeys =
        Array.isArray(storedKeys) && storedKeys.length
          ? storedKeys
          : current?.length
            ? current
            : nextDefaultKeys;

      const fixedKeysToAppend = nextDefaultKeys.filter((key) => !preferredKeys.includes(key));
      return [...new Set([...preferredKeys, ...fixedKeysToAppend])];
    });
  }, [columns, defaultVisibleColumnKeys, storageKey]);

  const resolvedColumns = useMemo(
    () =>
      visibleColumnKeys
        .map((key) => columns.find((column) => column.key === key))
        .filter(Boolean)
        .filter((column) => allowSelection || !column.checkbox)
        .filter((column) => column.checkbox || column.className === "icon-col" || hasFieldVisiblePermission({ menuId, field: column, user }))
        .map((column) => ({
          ...column,
          currentWidth: Math.max(column.minWidth || 40, columnWidths[column.key] || column.width || 800),
        })),
    [allowSelection, columnWidths, columns, menuId, user, visibleColumnKeys]
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
        onApplyColumnKeys={setVisibleColumnKeys}
      />

      <div className="table-scroll-x">
        <table style={{ width: tableWidth, minWidth: tableWidth }}>
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
                    editRow={editRow}
                    selectionProps={selectionProps}
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
