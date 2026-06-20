import { toast } from "react-toastify";
import { useEffect, useMemo, useState } from "react";
import { makeRequest } from "../../api/httpClient";
import { useModuleFilters } from "../../store/hooks";
import { defaultSortConfig, getNextSortConfig } from "../../utils/sorting";
import {
  buildFilterFieldsFromStructure,
  buildTableColumnsFromStructure,
  getDefinitions
} from "../../utils/moduleStructure";
import ModuleControls from "../shared/ModuleControls";
import ModulePageLayout from "../shared/ModulePageLayout";
import ModulePagination from "../shared/ModulePagination";
import DynamicFilter from "../../components/DynamicFilter";
import UserForm from "./components/UserForm";
import ResizableTable from "../../components/table/ResizableTable";
import { usersFallbackColumns, usersModuleSchema } from "./data/module.schema";
import useMenuPermissions from "@auth/utils/useMenuPermissions";

function UsersModulePage({ menu_id }) {
  const resolvedMenuID = menu_id || usersModuleSchema.menu_id || null;
  const permissions = useMenuPermissions(resolvedMenuID);
  const [fields, setFields] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const {
    filterState,
    setSearchText,
    applyFilterPayload,
    setSort,
    clearFilters,
  } = useModuleFilters("user-master", userList);

  const sortConfig = {
    key: filterState.order_by || defaultSortConfig.key,
    direction: String(filterState.order || defaultSortConfig.direction).toLowerCase(),
  };

  const columnOptions = {
    skipFields: usersModuleSchema.skipFields,
    columnMappings: usersModuleSchema.columnMappings,
    tableCellConfig: usersModuleSchema.tableCellConfig,
  };

  const resolvedColumns = useMemo(
    () => buildTableColumnsFromStructure(fields, usersFallbackColumns, columnOptions),
    [fields]
  );

  const defaultVisibleColumnKeys = useMemo(
    () => usersFallbackColumns.map((column) => column.key),
    []
  );

  const resolvedFilterFields = useMemo(
    () =>
      buildFilterFieldsFromStructure(
        fields,
        usersModuleSchema.defaultColumns.map((key) => ({
          label:
            usersFallbackColumns.find((column) => column.key === key)?.label || key,
          value: key,
          type: "text",
        })),
        columnOptions
      ),
    [fields]
  );

  const getUserList = async () => {
    setLoading(true);
    const res = await makeRequest(usersModuleSchema.api.list, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        status: "active",
        page,
        searchText: filterState.searchText,
        filters: filterState.filters,
        order: filterState.order,
        order_by: filterState.order_by,
      },
    });
    setLoading(false);

    if (res.success) {
      setSelectedUser(null);
      setUserList(res.data || []);
      setPagination(res.pagination || {});
      setSelectedRowIds([]);
      return;
    }

    toast.error(res?.message || "Error while fetching users");
  };

  const handleToggleRow = (rowId, checked) => {
    setSelectedRowIds((current) =>
      checked ? [...new Set([...current, rowId])] : current.filter((item) => item !== rowId)
    );
  };

  const handleToggleAllRows = (checked) => {
    if (!checked) {
      setSelectedRowIds([]);
      return;
    }

    setSelectedRowIds(userList.map((row) => row?._id ?? row?.id ?? row?.adminID).filter(Boolean));
  };

  const handleDeleteSelected = async () => {
    if (!selectedRowIds.length) {
      toast.error("Please select at least one user to delete.");
      return;
    }

    setDeleting(true);
    const res = await makeRequest(usersModuleSchema.api.delete, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        action:'delete',
        ids: selectedRowIds,
      },
    });
    setDeleting(false);

    if (res.success) {
      toast.success(res?.message || "Selected users deleted successfully.");
      await getUserList();
      return;
    }

    toast.error(res?.message || "Error while deleting users");
  };

  const handleDeleteRow = async (row) => {
    const rowId = row?._id ?? row?.id ?? row?.adminID;
    if (!rowId) {
      toast.error("User id not found.");
      return;
    }

    if (!window.confirm("Delete this user?")) return;

    setDeleting(true);
    const res = await makeRequest(usersModuleSchema.api.delete, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        action: "delete",
        ids: [rowId],
      },
    });
    setDeleting(false);

    if (res.success) {
      toast.success(res?.message || "User deleted successfully.");
      await getUserList();
      return;
    }

    toast.error(res?.message || "Error while deleting user");
  };

  const getColumnList = async () => {
    const res = await getDefinitions(resolvedMenuID);
    if (res.success) {
      setFields(res.data || []);
      return;
    }
    toast.error(res?.message || "Error while fetching model fields");
  };

  useEffect(() => {
    getColumnList();
  }, [resolvedMenuID]);

  useEffect(() => {
    getUserList();
  }, [page, filterState.searchText, filterState.order, filterState.order_by, JSON.stringify(filterState.filters)]);

  useEffect(() => {
    if (page !== 1) {
      setPage(1);
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
            onSortChange={(columnKey) => {
              const nextSort = getNextSortConfig(sortConfig, columnKey);
              if (page !== 1) {
                setPage(1);
              }
              setSort({
                order_by: nextSort.key,
                order: nextSort.direction.toUpperCase(),
              });
            }}
            editRow={permissions.canEdit ? (user) => {
              setSelectedUser(user);
              setIsFlyoutOpen(true);
            } : undefined}
            onDeleteRow={permissions.canDelete ? handleDeleteRow : undefined}
            allowSelection={permissions.canDelete}
            selectedRowIds={selectedRowIds}
            onToggleRow={handleToggleRow}
            onToggleAllRows={handleToggleAllRows}
          />
        }
        footer={<ModulePagination pagination={pagination} onPageChange={setPage} />}
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
