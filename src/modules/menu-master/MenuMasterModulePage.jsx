import { useEffect, useState } from "react";

import { useModuleFilters } from "../../store/hooks";
import ModuleControls from "../shared/ModuleControls";
import ModulePageLayout from "../shared/ModulePageLayout";
import DynamicFilter from "../../components/dynamic-filter";
import ActionButton from "../../components/ui/ActionButton";
import Spinner from "../../components/ui/Spinner";
import useMenuPermissions from "@auth/utils/useMenuPermissions";

import MenuForm from "./components/MenuForm";
import MenuList from "./components/MenuList";
import { menuMasterSchema } from "./data/module.schema";
import { useMenuMasterFilters } from "./hooks/useMenuMasterFilters";
import { useMenuMasterModule } from "./hooks/useMenuMasterModule";

function MenuMasterModulePage({ menu_id }) {
  const resolvedMenuID = menu_id || menuMasterSchema.menu_id || null;
  const permissions = useMenuPermissions(resolvedMenuID);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);

  const {
    filterState,
    setSearchText,
    applyFilterPayload,
    clearFilters,
  } = useModuleFilters("menu-master");

  const {
    menuList,
    loading,
    deleting,
    savingSequence,
    sequenceDirty,
    getMenus,
    handleDeleteMenu,
    handleSortChange,
    handleSaveSequence,
  } = useMenuMasterModule({ filterState });

  const { resolvedFilterFields } = useMenuMasterFilters({ resolvedMenuID });

  useEffect(() => {
    getMenus();
  }, [
    filterState.searchText,
    filterState.order,
    filterState.order_by,
    JSON.stringify(filterState.filters),
  ]);

  const openCreateFlyout = () => {
    setSelectedMenu(null);
    setIsFlyoutOpen(true);
  };

  const openEditFlyout = (menu) => {
    setSelectedMenu(menu);
    setIsFlyoutOpen(true);
  };

  const closeFlyout = () => {
    setIsFlyoutOpen(false);
    setSelectedMenu(null);
  };

  return (
    <>
      <ModulePageLayout
        title={menuMasterSchema.title}
        description={menuMasterSchema.description}
        controls={
          <ModuleControls
            canCreate={permissions.canAdd}
            canDelete={permissions.canDelete}
            loading={loading}
            onRefresh={getMenus}
            onCreate={openCreateFlyout}
            onDeleteSelected={undefined}
            showDelete={false}
            deleteDisabled
            deleting={deleting}
            filter={
              <DynamicFilter
                fields={resolvedFilterFields}
                savedFilters={menuMasterSchema.savedFilters}
                onSearch={setSearchText}
                onApplyFilters={applyFilterPayload}
                onSaveFilter={() => {}}
                onDeleteFilter={() => {}}
                onSelectSavedFilter={() => {}}
                onClearFilters={clearFilters}
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
            onEdit={openEditFlyout}
            onDelete={handleDeleteMenu}
            onConfigure={openEditFlyout}
            onSortChange={handleSortChange}
          />
        }
      />

      <MenuForm
        isOpen={isFlyoutOpen}
        onClose={closeFlyout}
        selectedMenu={selectedMenu}
        menu_id={resolvedMenuID}
        onAfterSave={getMenus}
      />
    </>
  );
}

export default MenuMasterModulePage;
