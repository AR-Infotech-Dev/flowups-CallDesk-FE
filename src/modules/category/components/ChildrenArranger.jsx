// import { useEffect, useMemo, useState } from "react";
// import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
// import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
// import { CSS } from "@dnd-kit/utilities";
// import { GripVertical } from "lucide-react";

// function isLockedColumn(column) {
//     return column?.checkbox || column?.className === "icon-col";
// }

// function SortableColumnRow({ column, checked, disabled = false, onToggle }) {
//     const {
//         attributes,
//         listeners,
//         setNodeRef,
//         transform,
//         transition,
//         isDragging,
//     } = useSortable({
//         id: column.key,
//         disabled: !checked,
//     });

//     const style = {
//         transform: CSS.Transform.toString(transform),
//         transition,
//         zIndex: isDragging ? 20 : "auto",
//     };

//     return (
//         <div
//             ref={setNodeRef}
//             style={style}
//             className={`column-arranger-row ${checked ? "is-selected" : "is-hidden"} ${isDragging ? "is-dragging" : ""}`}
//         >
//             <span className="column-arranger-grip" {...attributes} {...listeners}>
//                 {checked ? <GripVertical size={12} /> : null}
//             </span>
//             <label className="column-arranger-label">
//                 {/* <input
//                     type="checkbox"
//                     checked={checked}
//                     disabled={disabled}
//                     onChange={(event) => onToggle(column.key, event.target.checked)}
//                 /> */}
//                 <span>{column.label}</span>
//             </label>
//         </div>
//     );
// }

// function StaticColumnRow({ column, onToggle }) {
//     return (
//         <div className="column-arranger-row is-hidden">
//             <span className="column-arranger-grip" />
//             <label className="column-arranger-label">
//                 <input
//                     type="checkbox"
//                     checked={false}
//                     disabled={disabled}
//                     onChange={(event) => onToggle(column.key, event.target.checked)}
//                 />
//                 <span>{column.label}</span>
//             </label>
//         </div>
//     );
// }


// function ChildrenArranger({ value = [], onChange, }) {
//     const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 }, }));
//     // Backend children -> existing SortableColumnRow structure
//     const selectedColumns = useMemo(() => {
//         return value.map((child) => ({
//             ...child,
//             key: String(child.category_id),
//             label: child.categoryName,
//         }));
//     }, [value]);

//     const draftSelectedKeys = selectedColumns.map(
//         (column) => column.key
//     );
//     const handleDragEnd = (event) => {
//         const { active, over } = event;

//         if (!over || active.id === over.id) {
//             return;
//         }
//         const oldIndex = draftSelectedKeys.indexOf(
//             String(active.id)
//         );
//         const newIndex = draftSelectedKeys.indexOf(
//             String(over.id)
//         );
//         if (oldIndex === -1 || newIndex === -1) {
//             return;
//         }
//         const reordered = arrayMove(value, oldIndex, newIndex).map((child, index) => ({ ...child, categories_index: index + 1, }));
//         console.log("AFTER DRAG:", reordered);
//         onChange?.(reordered);
//     };
//     return (
//         <div className="column-arranger-list">
//             <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} >
//                 <SortableContext items={draftSelectedKeys} strategy={verticalListSortingStrategy} >
//                     {selectedColumns.map((column) => (
//                         <SortableColumnRow
//                             key={column.key}
//                             column={column}
//                             checked
//                             disabled={false}
//                             onToggle={() => { }}
//                         />
//                     ))}
//                 </SortableContext>
//             </DndContext>
//         </div>
//     );
// }
// export default ChildrenArranger;
import { useMemo } from "react";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";


function SortableChildRow({ child, index }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: String(child.category_id),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : "auto",
  };

  return (
    <div ref={setNodeRef} style={style} className={` group flex min-h-10 items-center gap-3 rounded-md border bg-white px-3 py-2 transition-all duration-150 ${ isDragging ? "border-blue-400 shadow-md" : "border-slate-200 hover:border-slate-300 hover:shadow-sm" } `} >
      {/* Drag handle */}
      <button type="button" {...attributes} {...listeners}
        className=" flex shrink-0 cursor-grab touch-none items-center justify-center text-slate-400 hover:text-blue-600 active:cursor-grabbing " aria-label={`Reorder ${child.categoryName}`} >
        <GripVertical size={16} />
      </button>

      {/* Category name */}
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
        {child.categoryName}
      </span>
    </div>
  );
}

function ChildrenArranger({ value = [], onChange }) {
  const sensors = useSensors( useSensor(PointerSensor, { activationConstraint: { distance: 6, }, }) );

  const children = Array.isArray(value) ? value : [];
  const sortableIds = useMemo(
    () => children.map((child) => String(child.category_id)),
    [children]
  );
  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sortableIds.indexOf(String(active.id));
    const newIndex = sortableIds.indexOf(String(over.id));

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reorderedChildren = arrayMove( children, oldIndex, newIndex ).map((child, index) => ({ ...child, categories_index: index + 1, }));

    console.log("Children after drag:", reorderedChildren);
    onChange?.(reorderedChildren);
  };

  return (
    <div className="col-span-full w-full mt-5">
      {/* Section heading */}
      <div className="mb-2 flex items-end justify-between">
        <div>
          <label className=" text-xs font-medium text-gray-500">
            Child Categories
          </label> 
        </div>
      </div>

      {/* Empty state */}
      {children.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          No child categories available
        </div>
      ) : (
        <div className="p-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortableIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1.5">
                {children.map((child, index) => (
                  <SortableChildRow
                    key={child.category_id}
                    child={child}
                    index={index}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}

export default ChildrenArranger;