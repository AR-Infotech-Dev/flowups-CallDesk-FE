import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Edit3, Folder, GripVertical, Link2, Settings, Trash2 } from "lucide-react";
import {ICONS} from "../data/module.schema"
const getMenuId = (menu = {}) => menu?.menu_id ?? menu?.menuID ?? menu?.id;
const getMenuName = (menu = {}) => menu?.menu_name || menu?.menuName || menu?.label || "Untitled menu";
const getModuleName = (menu = {}) => menu?.module_name || menu?.moduleName || "-";
const getMenuLink = (menu = {}) => menu?.menu_link || menu?.menuLink || menu?.path || "-";
const getStatus = (menu = {}) => menu?.status || "active";
const getIcon = (menu = {}) => ICONS[menu?.icon_name || "Folder"];


function MenuListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-16 animate-pulse rounded-md border border-slate-100 bg-slate-50" />
      ))}
    </div>
  );
}

function MenuRow({
  menu,
  canEdit,
  canDelete,
  canSort,
  onEdit,
  onDelete,
  onConfigure,
}) {
  const menuId = getMenuId(menu);
  const Icon = getIcon(menu);
  const status = String(getStatus(menu)).toLowerCase();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: menuId });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`grid min-w-225 grid-cols-[auto_minmax(220px,1.4fr)_minmax(150px,0.8fr)_minmax(180px,1fr)_90px_auto] items-center gap-3 border border-slate-200 bg-white px-2 py-2 shadow-sm ${isDragging ? "opacity-60 ring-2 ring-indigo-200" : ""}`}
    >
      <button
        type="button"
        {...(canSort ? attributes : {})}
        {...(canSort ? listeners : {})}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50 ${canSort ? "cursor-grab" : "cursor-not-allowed opacity-50"}`}
        title="Drag to sort"
      >
        <GripVertical size={16} />
      </button>

      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
          <Icon size={16} />
        </div>

        <div className="min-w-0">
          <button
            type="button"
            // Edit permission controls whether row title opens the flyout.
            onClick={canEdit ? () => onEdit?.(menu) : undefined}
            className={`block max-w-full truncate text-left text-sm font-semibold text-slate-900 ${canEdit ? "hover:text-indigo-600" : "cursor-default"}`}
          >
            {getMenuName(menu)}
          </button>
          <div className="mt-1 text-xs text-slate-500">ID: {menuId}</div>
        </div>
      </div>

      <div className="truncate text-sm text-slate-700">{getModuleName(menu)}</div>

      <div className="flex min-w-0 items-center gap-2 text-sm text-slate-500">
        <Link2 size={14} className="shrink-0" />
        <span className="truncate">{getMenuLink(menu)}</span>
      </div>

      <span className={`justify-self-start rounded-full px-2.5 py-1 text-xs font-semibold ${status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
        {status}
      </span>

      <div className="flex items-center justify-end gap-2">
        {canEdit && (
          <button
            type="button"
            onClick={() => onEdit?.(menu)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
            title="Edit menu"
          >
            <Edit3 size={15} />
          </button>
        )}

        {canEdit && (
          <button
            type="button"
            onClick={() => onConfigure?.(menu)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-violet-50 hover:text-violet-600"
            title="Configure menu"
          >
            <Settings size={15} />
          </button>
        )}

        {canDelete && (
          <button
            type="button"
            onClick={() => onDelete?.(menu)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-rose-50 hover:text-rose-600"
            title="Delete menu"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

function MenuList({
  rows = [],
  loading = false,
  canEdit = true,
  canDelete = true,
  canSort = true,
  onEdit,
  onDelete,
  onConfigure,
  onSortChange,
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = (event) => {
    if (!canSort) return;

    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = rows.findIndex((menu) => getMenuId(menu) === active.id);
    const newIndex = rows.findIndex((menu) => getMenuId(menu) === over.id);

    if (oldIndex < 0 || newIndex < 0) return;

    // Only local row order changes here. Parent page shows Save Sequence and calls API.
    onSortChange?.(arrayMove(rows, oldIndex, newIndex));
  };

  if (loading) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-4">
        <MenuListSkeleton />
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-md border border-slate-200 bg-white">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-500">
            <Folder size={18} />
          </div>
          <div className="text-sm font-semibold text-slate-800">No menus found</div>
          <div className="mt-1 text-xs text-slate-500">Create a menu to show it here.</div>
        </div>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={rows.map((menu) => getMenuId(menu))} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 overflow-x-auto" style={{"scrollbarWidth":"none"}}>
          {/* <div className="grid min-w-[900px] grid-cols-[auto_minmax(220px,1.4fr)_minmax(150px,0.8fr)_minmax(180px,1fr)_90px_auto] gap-3 px-3 pb-1 text-xs font-semibold uppercase text-slate-500">
            <div />
            <div>Menu</div>
            <div>Module</div>
            <div>Link</div>
            <div>Status</div>
            <div className="text-right">Actions</div>
          </div> */}
          {rows.map((menu) => (
            <MenuRow
              key={getMenuId(menu)}
              menu={menu}
              canEdit={canEdit}
              canDelete={canDelete}
              canSort={canSort}
              onEdit={onEdit}
              onDelete={onDelete}
              onConfigure={onConfigure}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export default MenuList;
