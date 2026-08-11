import { createElement, isValidElement } from "react";
import { Edit3, Star, Trash2 } from "lucide-react";
import moment from "moment";
import { isAmcActive } from "@utils/amc";

export const DEFAULT_COLUMN_WIDTH = 800;

export const ACTIONS_COLUMN = {
  key: "__actions",
  label: "Actions",
  width: "auto",
  minWidth: 90,
  resizable: true,
  isAlwaysVisible: true,
  isActionsColumn: true,
};

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

export function getRowIdentifier(row) {
  return (
    row?.quotation_id ??
    row?.category_id ??
    row?._id ??
    row?.id ??
    row?.adminID ??
    row?.ticketID ??
    row?.ticket_id ??
    row?.roleId ??
    row?.userId ??
    row?.menu_id ??
    row?.customer_id ??
    row?.company_id
  );
}

function getNumberValue(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export function getColumnWidth(...values) {
  for (const value of values) {
    const numberValue = getNumberValue(value);
    if (numberValue !== null) {
      return numberValue;
    }
  }

  return DEFAULT_COLUMN_WIDTH;
}

export function getCellStyle(column) {
  const width = getColumnWidth(column.currentWidth, column.minWidth || 40, DEFAULT_COLUMN_WIDTH);

  return {
    width,
    minWidth: width,
    maxWidth: width,
  };
}

function getStatusClass(value) {
  if (!value) {
    return "status-gray";
  }

  return STATUS_CLASS_MAP[String(value).trim().toLowerCase()] || "status-gray";
}

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
    color: "#ffffff",
    border: colorValue,
    backgroundColor: colorValue,
  };
}

function getBadgeClassName(type, colorValue) {
  const baseClassName = PILL_BASE_CLASS[type] || "status-pill";

  if (!colorValue || isInlineColorValue(colorValue)) {
    return baseClassName;
  }

  return `${baseClassName} ${colorValue}`;
}

function renderCheckboxCell(row, selectionProps) {
  const rowId = getRowIdentifier(row);
  const { selectedRowIds = [], onToggleRow, allowSelection = true } = selectionProps;

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
    <div className="person-cell w-full justify-between">
      <div className="flex gap-1.5 items-center">
        <span className={`person-avatar ${avatarStyle ? "" : `avatar-${index % 12}`}`.trim()} style={avatarStyle}>
          {String(value || "?").charAt(0)}
        </span>
        <span className="text-overflow">{value || "-"}</span>
      </div>
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
  const className = getBadgeClassName(type, colorValue);
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

function parseJsonCellValue(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "object") return [value];

  if (typeof value === "string") {
    try {
      const parsedValue = JSON.parse(value);
      if (Array.isArray(parsedValue)) return parsedValue;
      if (parsedValue && typeof parsedValue === "object") return [parsedValue];
    } catch {
      return [];
    }
  }

  return [];
}

function changeTimeFormat(date) {
  const parsedDate = moment(date, [
    moment.ISO_8601,
    "DD-MM-YYYY",
    "YYYY-MM-DD",
    "YY-MM-DD",
    "Do MMMM YYYY",
    "MMMM Do YYYY",
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

function renderCustomerProductsCell(value) {
  const products = parseJsonCellValue(value);

  if (!products.length) {
    return "-";
  }

  return (
    <div className="customer-products-cell">
      {products.map((product, index) => {
        const addOns = Array.isArray(product?.add_ons)
          ? product.add_ons.filter(Boolean).join(", ")
          : product?.add_ons || "";

        return (
          <div className="customer-product-item" key={`${product?.product_id || index}-${product?.serial_number || index}`}>
            <div className="customer-product-head">
              <strong>{product?.product_name || "-"}</strong>
              {product?.expiry_date ? <small>{changeTimeFormat(product.expiry_date)}</small> : null}
            </div>
            <div className="customer-product-meta">
              <span>{product?.serial_number ? `SN ${product.serial_number}` : "No serial"}</span>
              {addOns ? <span>{addOns}</span> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

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
    case "customerProducts":
    case "json":
      return renderCustomerProductsCell(value);
    default:
      if (Array.isArray(value) || (value && typeof value === "object")) {
        return JSON.stringify(value);
      }

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

export function DefaultRow({ row, index, columns, editRow, selectionProps, onDeleteRow, rowActions, renderActions }) {
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

export function createRowRenderContext({ editRow, selectionProps, onDeleteRow, rowActions, renderActions }) {
  return {
    getRowIdentifier,
    getCellStyle,
    renderCell: (column, row, index) => renderValueCell(column, row, index, selectionProps),
    renderActionCell: (row, index) => (
      <ActionCell
        row={row}
        index={index}
        editRow={editRow}
        onDeleteRow={onDeleteRow}
        rowActions={rowActions}
        renderActions={renderActions}
      />
    ),
    getRowClick: (column, row) =>
      typeof editRow === "function" && !column.isActionsColumn && !column.checkbox
        ? () => editRow(row)
        : undefined,
  };
}
