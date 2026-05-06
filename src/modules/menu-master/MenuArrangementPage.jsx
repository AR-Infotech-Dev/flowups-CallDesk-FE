// import { useEffect, useState } from "react";
// import {
//   DndContext,
//   closestCenter,
//   PointerSensor,
//   useSensor,
//   useSensors,
// } from "@dnd-kit/core";

// import {
//   SortableContext,
//   verticalListSortingStrategy,
//   arrayMove,
//   useSortable,
// } from "@dnd-kit/sortable";

// import { CSS } from "@dnd-kit/utilities";

// import {
//   ChevronDown,
//   ChevronUp,
//   GripVertical,
//   Pencil,
//   Trash2,
//   Settings,
// } from "lucide-react";

// import { toast } from "react-toastify";
// import { makeRequest } from "../../api/httpClient";
// import ModulePageLayout from "../shared/ModulePageLayout";

// // ======================================================
// // TREE ITEM
// // ======================================================
// function MenuTreeItem({ item, onEdit, onDelete, }) {
//   const [open, setOpen] = useState(true);
//   const { attributes, listeners, setNodeRef, transform, transition, } = useSortable({ id: item.menu_id, });

//   const style = { transform: CSS.Transform.toString(transform), transition, };

//   return (
//     <li ref={setNodeRef} style={style} className="border rounded-xl bg-white mb-3 overflow-hidden" >
//       {/* parent row */}
//       <div className="flex items-center justify-between px-4 py-3">
//         <div className="flex items-center gap-3">
//           <button {...attributes} {...listeners} className="cursor-grab text-slate-500" >
//             <GripVertical size={18} />
//           </button>

//           <span className="font-medium"> {item.menuName} </span>
//         </div>

//         <div className="flex items-center gap-2">
//           <button className="p-1" onClick={() => onEdit(item)} >
//             <Pencil size={16} />
//           </button>

//           {!item.subMenu
//             ?.length && (
//               <button className="p-1" onClick={() => onDelete(item)} >
//                 <Trash2 size={16} />
//               </button>
//             )}

//           <button className="p-1">
//             <Settings size={16} />
//           </button>

//           {item.subMenu?.length > 0 && (
//             <button className="p-1" onClick={() => setOpen(!open)} >
//               {open
//                 ? (<ChevronUp size={16} />)
//                 : (<ChevronDown size={16} />)
//               }
//             </button>
//           )}
//         </div>
//       </div>

//       {/* child rows */}
//       {open && item.subMenu?.length > 0 && (
//         <ul className="border-t bg-slate-50 px-6 py-2 space-y-2">
//           {item.subMenu.map((child) => (
//             <li key={child.menu_id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white border" >
//               <div className="flex items-center gap-2">
//                 <GripVertical size={16} className="text-slate-400" />
//                 <span> {child.menuName} </span>
//               </div>

//               <div className="flex gap-2">
//                 <button onClick={() => onEdit(child)} >
//                   <Pencil size={15} />
//                 </button>

//                 <button onClick={() => onDelete(child)} >
//                   <Trash2 size={15} />
//                 </button>

//                 <button>
//                   <Settings size={15} />
//                 </button>
//               </div>
//             </li>
//           )
//           )}
//         </ul>
//       )}
//     </li>
//   );
// }

// // ======================================================
// // MAIN PAGE
// // ======================================================
// function MenuArrangementPage({ onEdit, }) {
//   const [rows, setRows] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const sensors = useSensors(useSensor(PointerSensor));

//   // ==========================================
//   // LOAD MENUS
//   // ==========================================
//   const getMenus = async () => {
//     setLoading(true);

//     const res = await makeRequest("/menus/getMenuList", { method: "GET", });

//     setLoading(false);

//     if (res.success) {
//       setRows(res.data || []);
//     } else {
//       toast.error(res.message);
//     }
//   };

//   useEffect(() => {
//     getMenus();
//   }, []);

//   // ==========================================
//   // DELETE
//   // ==========================================
//   const handleDelete = async (item) => {
//     const res = await makeRequest(`/menus/${item.menu_id}`, { method: "DELETE", });

//     if (res.success) {
//       toast.success("Deleted");
//       getMenus();
//     } else {
//       toast.error(res.message);
//     }
//   };

//   // ==========================================
//   // DRAG END
//   // ==========================================
//   const handleDragEnd = async (event) => {
//     const { active, over, } = event;
//     if (!over || active.id === over.id)
//       return;

//     const oldIndex = rows.findIndex((item) => item.menu_id === active.id);

//     const newIndex = rows.findIndex((item) => item.menu_id === over.id);

//     const newRows = arrayMove(rows, oldIndex, newIndex);

//     setRows(newRows);

//     const payload = newRows.map((item, index) => ({
//       menu_id: item.menu_id,
//       parentID: 0,
//       menuIndex: index + 1,
//     })
//     );

//     const res = await makeRequest("/menus/updatePositions", {
//       method: "POST",
//       body: {
//         positions: payload,
//       },
//     }
//     );

//     if (res.success) {
//       toast.success("Menu updated");
//     } else {
//       toast.error(res.message);
//     }
//   };

//   return (
//     <ModulePageLayout
//       title="Create and Arrange Positions"
//       description="Drag & drop hierarchical list with mouse and touch compatibility"
//       controls={
//         <button className="btn btn-primary"> Create </button>
//       }
//       table={
//         <div className="bg-white rounded-2xl p-4 shadow-sm">
//           {loading ? (
//             <div className="p-6 text-center">
//               Loading...
//             </div>
//           ) : (
//             <DndContext
//               sensors={sensors}
//               collisionDetection={closestCenter}
//               onDragEnd={handleDragEnd}
//             >
//               <SortableContext
//                 items={rows.map((item) => item.menu_id)}
//                 strategy={verticalListSortingStrategy}
//               >
//                 <ul>
//                   {rows.map((item) => (
//                     <MenuTreeItem
//                       key={item.menu_id}
//                       item={item}
//                       onEdit={onEdit}
//                       onDelete={handleDelete}
//                     />
//                   )
//                   )}
//                 </ul>
//               </SortableContext>
//             </DndContext>
//           )}
//         </div>
//       }
//     />
//   );
// }

// export default MenuArrangementPage;

import { useEffect, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import {
  GripVertical,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { toast } from "react-toastify";
import { makeRequest } from "../../api/httpClient";

// ======================================================
// HELPERS
// ======================================================
const flattenMenus = (rows = []) => {
  const result = [];

  rows.forEach((parent) => {
    result.push({
      ...parent,
      parentID: 0,
      isChild: false,
    });

    (parent.subMenu || []).forEach((child) => {
      result.push({
        ...child,
        parentID: parent.menu_id,
        isChild: true,
      });
    });
  });

  return result;
};

const rebuildMenus = (flat = []) => {
  const parents = flat.filter((item) => !item.isChild);

  return parents.map((parent) => ({
    ...parent,
    subMenu: flat.filter(
      (item) => item.parentID === parent.menu_id
    ),
  }));
};

// ======================================================
// SORTABLE ROW
// ======================================================
function SortableRow({ item }) {
  const [open, setOpen] = useState(true);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: item.menu_id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-xl mb-2 px-4 py-3 bg-white flex items-center justify-between ${
        item.isChild ? "ml-10" : ""
      }`}
    >
      {/* LEFT */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab text-slate-500"
        >
          <GripVertical size={18} />
        </button>

        <span className="font-medium">
          {item.menuName}
        </span>
      </div>

      {/* RIGHT */}
      {!item.isChild && (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-slate-500"
        >
          {open ? (
            <ChevronUp size={16} />
          ) : (
            <ChevronDown size={16} />
          )}
        </button>
      )}
    </div>
  );
}

// ======================================================
// MAIN PAGE
// ======================================================
function MenuArrangementPage() {
  const [rows, setRows] = useState([]);
  const [flatRows, setFlatRows] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor)
  );

  // ====================================================
  // LOAD MENUS
  // ====================================================
  const getMenus = async () => {
    const res = await makeRequest(
      "/menus/getMenuList",
      {
        method: "GET",
      }
    );

    if (res.success) {
      const data = res.data || [];

      setRows(data);
      setFlatRows(flattenMenus(data));
    }
  };

  useEffect(() => {
    getMenus();
  }, []);

  // ====================================================
  // SAVE POSITIONS
  // ====================================================
  const savePositions = async (list = []) => {
    const payload = list.map(
      (item, index) => ({
        menu_id: item.menu_id,
        parentID: item.parentID || 0,
        menuIndex: index + 1,
      })
    );

    const res = await makeRequest(
      "/menus/updatePositions",
      {
        method: "POST",
        body: {
          positions: payload,
        },
      }
    );

    if (res.success) {
      toast.success(
        "Menu positions updated"
      );
    } else {
      toast.error(
        res.message ||
          "Unable to update positions"
      );
    }
  };

  // ====================================================
  // DRAG END
  // ====================================================
  const handleDragEnd = async (
    event
  ) => {
    const { active, over } = event;

    if (
      !over ||
      active.id === over.id
    ) {
      return;
    }

    const oldIndex =
      flatRows.findIndex(
        (item) =>
          item.menu_id === active.id
      );

    const newIndex =
      flatRows.findIndex(
        (item) =>
          item.menu_id === over.id
      );

    let moved = arrayMove(
      flatRows,
      oldIndex,
      newIndex
    );

    const activeItem =
      moved[newIndex];

    const targetItem =
      moved[newIndex + 1] ||
      moved[newIndex - 1];

    // ==================================
    // CHILD MOVED UNDER NEW PARENT
    // ==================================
    if (
      targetItem &&
      !targetItem.isChild &&
      activeItem.isChild
    ) {
      activeItem.parentID =
        targetItem.menu_id;
    }

    // ==================================
    // ROOT MENU ALWAYS ROOT
    // ==================================
    if (!activeItem.isChild) {
      activeItem.parentID = 0;
    }

    setFlatRows(moved);
    setRows(rebuildMenus(moved));

    await savePositions(moved);
  };

  // ====================================================
  // UI
  // ====================================================
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-5">
        Menu Arrangement
      </h2>

      <DndContext
        sensors={sensors}
        collisionDetection={
          closestCenter
        }
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          className={"overflow-auto"}
          items={flatRows.map(
            (item) => item.menu_id
          )}
          strategy={
            verticalListSortingStrategy
          }
        >
          <div className="space-y-2">
            {flatRows.map((item) => (
              <SortableRow
                key={item.menu_id}
                item={item}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

export default MenuArrangementPage;