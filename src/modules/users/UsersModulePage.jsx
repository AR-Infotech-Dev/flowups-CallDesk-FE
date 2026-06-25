import { useEffect, useState } from "react";
import { usersModuleSchema } from "./data/module.schema";
import { useUsersTableConfig } from "./hooks/useUsersTableConfig";
import { useUsersModule } from "./hooks/useUsersModule";
import { getNextSortConfig } from "@utils/sorting";
import { useModuleFilters, useAppSelector } from "@store/hooks";
import { selectUsersRows } from "./data/users.slice";

import ModuleControls from "@shared/ModuleControls";
import ModulePageLayout from "@shared/ModulePageLayout";
import ModulePagination from "@shared/ModulePagination";
import DynamicFilter from "@components/DynamicFilter";
import ResizableTable from "@components/table/ResizableTable";
import useMenuPermissions from "@auth/utils/useMenuPermissions";
import UserForm from "./components/UserForm";
import UserTableRow from "./components/UserTableRow";

function UsersModulePage({ menu_id }) {

  const resolvedMenuID = menu_id || usersModuleSchema.menu_id || null;
  const permissions = useMenuPermissions(resolvedMenuID);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);
  const userList = useAppSelector(selectUsersRows);
  const { filterState, setSearchText, applyFilterPayload, setSort, clearFilters, } = useModuleFilters("user-master", userList);
  const { pagination, page, loading, deleting, selectedRowIds, getUserList, handlePageChange, handleToggleRow, handleToggleAllRows, handleDeleteSelected, handleDeleteRow, } = useUsersModule({ filterState });
  const { sortConfig, resolvedColumns, defaultVisibleColumnKeys, resolvedFilterFields, } = useUsersTableConfig({ resolvedMenuID, filterState });

  const handleSortChange = (columnKey) => {
    const nextSort = getNextSortConfig(sortConfig, columnKey);

    if (page !== 1) {
      handlePageChange(1);
    }

    setSort({
      order_by: nextSort.key,
      order: nextSort.direction.toUpperCase(),
    });
  };

  useEffect(() => {
    getUserList();
  }, [page, filterState.searchText, filterState.order, filterState.order_by, JSON.stringify(filterState.filters)]);

  useEffect(() => {
    if (page !== 1) {
      handlePageChange(1)
    }
  }, [filterState.searchText, filterState.order, filterState.order_by, JSON.stringify(filterState.filters)]);

  return (
    <>
      <ModulePageLayout
        title={usersModuleSchema.title}
        description={usersModuleSchema.description}
        controls={
          <ModuleControls
            canCreate={permissions.canAdd}
            canDelete={permissions.canDelete}
            loading={loading}
            onRefresh={getUserList}
            onCreate={() => {
              setSelectedUser(null);
              setIsFlyoutOpen(true);
            }}
            onDeleteSelected={handleDeleteSelected}
            showDelete={selectedRowIds.length !== 0}
            deleteDisabled={deleting || loading || selectedRowIds.length === 0}
            deleteLabel={`Delete Selected${selectedRowIds.length ? ` (${selectedRowIds.length})` : ""}`}
            deleting={deleting}
            filter={
              <DynamicFilter
                fields={resolvedFilterFields}
                savedFilters={usersModuleSchema.savedFilters}
                onSearch={setSearchText}
                onApplyFilters={applyFilterPayload}
                onSaveFilter={() => { }}
                onDeleteFilter={() => { }}
                onSelectSavedFilter={() => { }}
                onClearFilters={clearFilters}
              />
            }
          />
        }
        table={
          <ResizableTable
            loading={loading}
            menuId={resolvedMenuID}
            columns={resolvedColumns}
            rows={userList}
            storageKey="users-module-column-widths"
            defaultVisibleColumnKeys={defaultVisibleColumnKeys}
            sortConfig={sortConfig}
            onSortChange={handleSortChange}
            editRow={permissions.canEdit ? (user) => {
              setSelectedUser(user);
              setIsFlyoutOpen(true);
            } : undefined}
            onDeleteRow={permissions.canDelete ? handleDeleteRow : undefined}
            allowSelection={permissions.canDelete}
            selectedRowIds={selectedRowIds}
            onToggleRow={handleToggleRow}
            onToggleAllRows={handleToggleAllRows}
            renderRow={(row, index, columns, table) => (
              <UserTableRow
                row={row}
                index={index}
                columns={columns}
                table={table}
              />
            )}
          />
        }
        footer={<ModulePagination pagination={pagination} onPageChange={handlePageChange} />}
      />
      <UserForm
        isOpen={isFlyoutOpen}
        onClose={() => setIsFlyoutOpen(false)}
        selectedUser={selectedUser}
        onAfterSave={getUserList}
        menu_id={resolvedMenuID}
      />
    </>
  );
}

export default UsersModulePage;
