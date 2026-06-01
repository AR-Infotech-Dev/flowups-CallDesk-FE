import { useEffect, useMemo, useState } from "react";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

function isLockedColumn(column) {
  return column?.checkbox || column?.className === "icon-col";
}

function SortableColumnRow({ column, checked, disabled = false, onToggle }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.key,
    disabled: !checked,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`column-arranger-row ${checked ? "is-selected" : "is-hidden"} ${isDragging ? "is-dragging" : ""}`}
    >
      <span className="column-arranger-grip" {...attributes} {...listeners}>
        {checked ? <GripVertical size={12} /> : null}
      </span>
      <label className="column-arranger-label">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onToggle(column.key, event.target.checked)}
        />
        <span>{column.label}</span>
      </label>
    </div>
  );
}

function StaticColumnRow({ column, onToggle }) {
  return (
    <div className="column-arranger-row is-hidden">
      <span className="column-arranger-grip" />
      <label className="column-arranger-label">
        <input
          type="checkbox"
          checked={false}
          onChange={(event) => onToggle(column.key, event.target.checked)}
        />
        <span>{column.label}</span>
      </label>
    </div>
  );
}

function ColumnArranger({
  setIsColumnMenuOpen,
  isColumnMenuOpen,
  columns = [],
  visibleColumnKeys = [],
  onApplyColumnKeys,
}) {
  const [draftSelectedKeys, setDraftSelectedKeys] = useState([]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const manageableColumns = useMemo(
    () => columns.filter((column) => column && !isLockedColumn(column)),
    [columns]
  );

  const manageableKeySet = useMemo(
    () => new Set(manageableColumns.map((column) => column.key)),
    [manageableColumns]
  );

  const alwaysVisibleKeySet = useMemo(
    () => new Set(manageableColumns.filter((column) => column.isAlwaysVisible).map((column) => column.key)),
    [manageableColumns]
  );

  useEffect(() => {
    if (!isColumnMenuOpen) {
      return;
    }

    const selectedKeys = visibleColumnKeys.filter((key) => manageableKeySet.has(key));
    const missingAlwaysVisibleKeys = [...alwaysVisibleKeySet].filter((key) => !selectedKeys.includes(key));
    setDraftSelectedKeys([...selectedKeys, ...missingAlwaysVisibleKeys]);
  }, [alwaysVisibleKeySet, isColumnMenuOpen, manageableKeySet, visibleColumnKeys]);

  const selectedColumns = useMemo(
    () =>
      draftSelectedKeys
        .map((key) => manageableColumns.find((column) => column.key === key))
        .filter(Boolean),
    [draftSelectedKeys, manageableColumns]
  );

  const hiddenColumns = useMemo(
    () => manageableColumns.filter((column) => !draftSelectedKeys.includes(column.key)),
    [draftSelectedKeys, manageableColumns]
  );

  if (!isColumnMenuOpen) return null;

  const handleToggleColumn = (columnKey, checked) => {
    if (alwaysVisibleKeySet.has(columnKey)) {
      return;
    }

    setDraftSelectedKeys((current) => {
      if (checked) {
        return current.includes(columnKey) ? current : [...current, columnKey];
      }

      return current.filter((key) => key !== columnKey);
    });
  };

  // Reorders only the checked columns. Unchecked columns always remain below.
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setDraftSelectedKeys((current) => {
      const oldIndex = current.indexOf(active.id);
      const newIndex = current.indexOf(over.id);

      if (oldIndex === -1 || newIndex === -1) {
        return current;
      }

      return arrayMove(current, oldIndex, newIndex);
    });
  };

  const handleCancel = () => {
    setIsColumnMenuOpen(false);
  };

  const handleApply = () => {
    const lockedKeys = columns.filter(isLockedColumn).map((column) => column.key);
    onApplyColumnKeys?.([...lockedKeys, ...draftSelectedKeys]);
    setIsColumnMenuOpen(false);
  };

  return (
    <div className="table-column-picker-menu column-arranger-menu">
      <div className="column-arranger-title">Manage Columns</div>

      <div className="column-arranger-list">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={draftSelectedKeys} strategy={verticalListSortingStrategy}>
            {selectedColumns.map((column) => (
              <SortableColumnRow
                key={column.key}
                column={column}
                checked
                disabled={alwaysVisibleKeySet.has(column.key)}
                onToggle={handleToggleColumn}
              />
            ))}
          </SortableContext>
        </DndContext>

        {hiddenColumns.map((column) => (
          <StaticColumnRow key={column.key} column={column} onToggle={handleToggleColumn} />
        ))}
      </div>

      <div className="column-arranger-footer">
        <button type="button" className="column-arranger-button secondary" onClick={handleCancel}>
          Cancel
        </button>
        <button type="button" className="column-arranger-button primary" onClick={handleApply}>
          Apply
        </button>
      </div>
    </div>
  );
}

export default ColumnArranger;
