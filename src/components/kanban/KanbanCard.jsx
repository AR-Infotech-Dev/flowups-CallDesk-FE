import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays, GripVertical, UserRound } from "lucide-react";

import { useAuth } from "../../auth/AuthProvider";
import { hasFieldVisiblePermission } from "../../auth/permissions";
import { useKanbanContext } from "./KanbanContext";
import { isInlineColorValue, resolveCardValue } from "./kanbanUtils";

function formatFieldValue(field, value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (field?.type === "date") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString("en-IN");
    }
  }

  return String(value);
}

function FieldIcon({ type }) {
  if (type === "date") {
    return <CalendarDays size={12} />;
  }

  return <UserRound size={12} />;
}

function AccentPill({ field, value, row }) {
  const colorValue = field?.colorField ? row?.[field.colorField] : "";
  const baseClassName = field?.type === "tag" ? "tag" : field?.type === "badge" ? "status-pill" : "kanban-card-pill";
  const style = isInlineColorValue(colorValue)
    ? { backgroundColor: colorValue, borderColor: colorValue, color: "#ffffff" }
    : undefined;
  const className = style
    ? "kanban-card-pill"
    : `${baseClassName} ${colorValue || ""}`.trim();

  return (
    <span className={className} style={style}>
      {formatFieldValue(field, value)}
    </span>
  );
}

function formatDateRange(row) {
  const startDate = row?.start_date ? formatFieldValue({ type: "date" }, row.start_date) : "-";
  const dueDate = row?.due_date ? formatFieldValue({ type: "date" }, row.due_date) : "-";
  return `${startDate} - ${dueDate}`;
}

function isOverdue(row, columnId, config) {
  const dueDateValue = row?.due_date;
  if (!dueDateValue) {
    return false;
  }

  const doneColumns = config?.doneColumnIds || [];
  if (doneColumns.map(String).includes(String(columnId))) {
    return false;
  }

  const columnTitle = String(row?._kanbanColumnTitle || "").toLowerCase();
  if (/(closed|complete|completed|done)/i.test(columnTitle)) {
    return false;
  }

  const dueDate = new Date(dueDateValue);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  return !Number.isNaN(dueDate.getTime()) && dueDate < today;
}

function getAvatarLabel(row) {
  const source =
    row?.assignee_name ||
    row?.contact_person ||
    row?.client_name ||
    row?.name ||
    row?.ticket_no ||
    "";

  const parts = String(source).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return "?";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function KanbanCardView({
  row,
  columnId,
  config,
  style,
  className = "kanban-card",
  dragHandleProps = {},
  onOpen,
  interactive = true,
}) {
  const { authSession } = useAuth();
  const { menuId } = useKanbanContext();
  const user = authSession?.user;
  const cardId = row._kanbanId;
  const titleValue =
    row?.[config.cardTitleField] ||
    row?.[config.titleField] ||
    row?.title ||
    row?.subject ||
    row?.description ||
    `#${cardId}`;
  const cardFields = (config.cardFields || []).filter((field) =>
    hasFieldVisiblePermission({ menuId, field: typeof field === "string" ? { key: field } : field, user })
  );
  const tagFields = cardFields.filter((field) => field?.type === "tag" || field?.type === "badge");
  const detailFields = cardFields.filter((field) => field?.type !== "tag" && field?.type !== "badge");
  const showStartDate = hasFieldVisiblePermission({ menuId, field: { key: "start_date", name: "start_date" }, user });
  const showDueDate = hasFieldVisiblePermission({ menuId, field: { key: "due_date", name: "due_date" }, user });
  const showDateRange = showStartDate || showDueDate;
  const overdue = isOverdue(row, columnId, config);
  const { onKeyDown: onDragKeyDown, ...cardDragProps } = dragHandleProps;

  const handleCardKeyDown = (event) => {
    onDragKeyDown?.(event);

    if (event.defaultPrevented) {
      return;
    }

    if (!interactive) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen?.();
    }
  };

  return (
    <article
      style={style}
      className={className}
      onClick={interactive ? onOpen : undefined}
      onKeyDown={handleCardKeyDown}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      {...cardDragProps}
    >
      <div className="kanban-card-head">
        <button
          type="button"
          className="kanban-card-grip"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <GripVertical size={14} />
        </button>
        <div className="kanban-card-title-wrap">
          <h4 className="kanban-card-title">{titleValue}</h4>
        </div>
        {overdue ? <span className="kanban-card-alert">Overdue</span> : null}
      </div>

      <div className="kanban-card-body">
        {showDateRange && (
          detailFields.some((field) => field?.type === "date" || field?.key === "start_date" || field?.key === "due_date") ||
          row?.start_date ||
          row?.due_date
        ) ? (
          <div className="kanban-card-date-row">
            <span className="kanban-card-label">
              <CalendarDays size={14} />
            </span>
            <span className="kanban-card-value kanban-card-date-value">
              {`${showStartDate ? formatFieldValue({ type: "date" }, row?.start_date) : "-"} - ${showDueDate ? formatFieldValue({ type: "date" }, row?.due_date) : "-"}`}
            </span>
          </div>
        ) : null}

        {detailFields
          .filter((field) => field?.type !== "date" && field?.key !== "start_date" && field?.key !== "due_date")
          .map((field) => {
            const key = typeof field === "string" ? field : field.key;
            const value = resolveCardValue(row, field);

            return (
              <div key={key} className="kanban-card-row">
                <span className="kanban-card-label">
                  <FieldIcon type={field?.type} />
                  {field.label || key}
                </span>
                <span className="kanban-card-value">{formatFieldValue(field, value)}</span>
              </div>
            );
          })}

        {tagFields.length ? (
          <div className="kanban-card-footer">
            <div className="kanban-card-tags">
              {tagFields.map((field) => {
                const key = typeof field === "string" ? field : field.key;
                const value = resolveCardValue(row, field);

                return <AccentPill key={key} field={field} value={value} row={row} />;
              })}
            </div>

            <span className="kanban-card-avatar" title={getAvatarLabel(row)}>
              {getAvatarLabel(row)}
            </span>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function KanbanCard({ row, columnId, isActiveDrag = false }) {
  const { config, editRow } = useKanbanContext();
  const cardId = row._kanbanId;
  
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: cardId,
    data: {
      type: "card",
      cardId,
      columnId,
      row,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.28 : 1,
    zIndex: isDragging || isActiveDrag ? 999 : "auto",
    position: isDragging || isActiveDrag ? "relative" : undefined,
  };

  // Opens the ticket drawer when the card body is clicked.
  const handleOpen = () => {
    editRow?.(row);
  };

  return (
    <div
      ref={setNodeRef}
    >
      <KanbanCardView
        row={row}
        columnId={columnId}
        config={config}
        style={style}
        dragHandleProps={{ ...attributes, ...listeners }}
        onOpen={handleOpen}
      />
    </div>
  );
}

export function KanbanCardPreview({ row, columnId }) {
  const { config } = useKanbanContext();

  return (
    <KanbanCardView
      row={row}
      columnId={columnId}
      config={config}
      className="kanban-card kanban-card-overlay"
      interactive={false}
    />
  );
}

export default KanbanCard;
