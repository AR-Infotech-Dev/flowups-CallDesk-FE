import { toast } from "react-toastify";
import { useEffect, useMemo, useState } from "react";
import { makeRequest } from "../../api/httpClient";
import { useModuleFilters } from "../../store/hooks";
import {
  buildFilterFieldsFromStructure,
  getDefinitions,
} from "../../utils/moduleStructure";

import ModuleControls from "../shared/ModuleControls";
import ModulePageLayout from "../shared/ModulePageLayout";
import DynamicFilter from "../../components/DynamicFilter";
import ActionButton from "../../components/ui/ActionButton";
import Spinner from "../../components/ui/Spinner";
import useMenuPermissions from "../../auth/useMenuPermissions";

import MenuForm from "./components/MenuForm";
import MenuList from "./components/MenuList";
import {
  menuMasterFallbackColumns,
  menuMasterSchema,
} from "./data/module.schema";

function MenuMasterModulePage({ menu_id }) {
  const resolvedMenuID = menu_id || menuMasterSchema.menu_id || null;
  const permissions = useMenuPermissions(resolvedMenuID);

  const [fields, setFields] = useState([]);
  const [menuList, setMenuList] = useState([]);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savingSequence, setSavingSequence] = useState(false);
  const [sequenceDirty, setSequenceDirty] = useState(false);

  const {
    filterState,
    setSearchText,
    applyFilterPayload,
    clearFilters,
  } = useModuleFilters("menu-master", menuList);

  const columnOptions = {
    skipFields: menuMasterSchema.skipFields,
    columnMappings: menuMasterSchema.columnMappings,
    tableCellConfig: menuMasterSchema.tableCellConfig,
  };

  const resolvedFilterFields = useMemo(
    () =>
      buildFilterFieldsFromStructure(
        fields,
        menuMasterSchema.defaultColumns.map((key) => ({
          label:
            menuMasterFallbackColumns.find(
              (column) => column.key === key
            )?.label || key,
          value: key,
          type: "text",
        })),
        columnOptions
      ),
    [fields]
  );

  // ======================================
  // GET MENU LIST
  // ======================================
  const getMenuList = async () => {
    setLoading(true);

    const res = await makeRequest(
      menuMasterSchema.api.list,
      {
        method: "POST",
        body: {
          status: "active",
          getAll: "Y",
          searchText: filterState.searchText,
          filters: filterState.filters,
          order: 'ASC',
          order_by: 'menu_index',
        },
      }
    );

    setLoading(false);

    if (res.success) {
      setMenuList(res.data || []);
      setSelectedMenu(null);
      setSequenceDirty(false);
      return;
    }

    toast.error(
      res?.message || "Error while fetching menus"
    );
  };

  // ======================================
  // GET FIELD DEFINITIONS
  // ======================================
  const getColumnList = async () => {
    const res = await getDefinitions(
      resolvedMenuID
    );

    if (res.success) {
      setFields(res.data || []);
      return;
    }

    toast.error(
      res?.message ||
      "Error while fetching module fields"
    );
  };

  // ======================================
  // DELETE MENU
  // ======================================
  const handleDeleteMenu = async (menu) => {
    const menuId = menu?.menu_id ?? menu?.id;

    if (!menuId) {
      toast.error(
        "Menu id not found."
      );
      return;
    }

    setDeleting(true);

    const res = await makeRequest(
      menuMasterSchema.api.delete,
      {
        method: "POST",
        body: {
          action: "delete",
          ids: [menuId],
        },
      }
    );

    setDeleting(false);

    if (res.success) {
      toast.success(
        res?.message ||
        "Menus deleted successfully."
      );

      await getMenuList();
      return;
    }

    toast.error(
      res?.message ||
      "Error while deleting menus"
    );
  };

  // ======================================
  // SORT MENU CARDS
  // ======================================
  const handleSortChange = (nextRows) => {
    setMenuList(nextRows);
    setSequenceDirty(true);
  };

  // ======================================
  // SAVE MENU SEQUENCE
  // ======================================
  const handleSaveSequence = async () => {
    const positions = menuList.map((menu, index) => ({
      menu_id: menu?.menu_id,
      menu_index: index + 1,
    })).filter((item) => item.menu_id);

    if (!positions.length) {
      toast.error("No menu sequence found to save.");
      return;
    }

    setSavingSequence(true);

    const res = await makeRequest("/menus/update-positions", {
      method: "POST",
      body: {
        positions,
      },
    });

    setSavingSequence(false);

    if (res.success) {
      toast.success(res?.message || "Menu sequence saved.");
      setSequenceDirty(false);
      await getMenuList();
      return;
    }

    toast.error(res?.message || "Unable to save menu sequence.");
  };

  // ======================================
  // EFFECTS
  // ======================================
  useEffect(() => {
    getColumnList();
  }, [resolvedMenuID]);

  useEffect(() => {
    getMenuList();
  }, [
    filterState.searchText,
    filterState.order,
    filterState.order_by,
    JSON.stringify(
      filterState.filters
    ),
  ]);

  return (
    <>
      <ModulePageLayout
        title={menuMasterSchema.title}
        description={
          menuMasterSchema.description
        }
        controls={
          <ModuleControls
            canCreate={permissions.canAdd}
            canDelete={permissions.canDelete}
            loading={loading}
            onRefresh={getMenuList}
            onCreate={() => {
              setSelectedMenu(null);
              setIsFlyoutOpen(true);
            }}
            onDeleteSelected={
              undefined
            }
            showDelete={
              false
            }
            deleteDisabled={
              true
            }
            deleting={deleting}
            filter={
              <DynamicFilter
                fields={
                  resolvedFilterFields
                }
                savedFilters={
                  menuMasterSchema.savedFilters
                }
                onSearch={
                  setSearchText
                }
                onApplyFilters={
                  applyFilterPayload
                }
                onSaveFilter={() => { }}
                onDeleteFilter={() => { }}
                onSelectSavedFilter={() => { }}
                onClearFilters={
                  clearFilters
                }
              />
            }
          >
            {sequenceDirty && (
              <ActionButton variant="primary" disabled={savingSequence} onClick={handleSaveSequence}>
                {savingSequence ? <Spinner /> : null}
                Save Sequence
              </ActionButton>
            )}
          </ModuleControls>
        }
        table={
          <MenuList
            loading={loading}
            rows={menuList}
            canEdit={permissions.canEdit}
            canDelete={permissions.canDelete}
            canSort={permissions.canEdit}
            onEdit={(menu) => {
              setSelectedMenu(menu);
              setIsFlyoutOpen(true);
            }}
            onDelete={handleDeleteMenu}
            onConfigure={(menu) => {
              setSelectedMenu(menu);
              setIsFlyoutOpen(true);
            }}
            onSortChange={handleSortChange}
          />
        }
      />

      <MenuForm
        isOpen={isFlyoutOpen}
        onClose={() =>
          setIsFlyoutOpen(false)
        }
        selectedMenu={
          selectedMenu
        }
        menu_id={resolvedMenuID}
        onAfterSave={
          getMenuList
        }
      />
    </>
  );
}

export default MenuMasterModulePage;
