import { toast } from "react-toastify";
import { useEffect, useMemo, useState } from "react";
import { BarChart3, Upload } from "lucide-react";
import { makeRequest } from "../../api/httpClient";
import { useModuleFilters } from "../../store/hooks";
import { defaultSortConfig, getNextSortConfig } from "../../utils/sorting";
import {
  buildFilterFieldsFromStructure,
  buildTableColumnsFromStructure,
  getDefinitions,
} from "../../utils/moduleStructure";
import { useLocation,useNavigate } from "react-router-dom";

import ModuleControls from "../shared/ModuleControls";
import ModulePageLayout from "../shared/ModulePageLayout";
import ModulePagination from "../shared/ModulePagination";

import DynamicFilter from "../../components/DynamicFilter";
import ResizableTable from "../../components/table/ResizableTable";
import useMenuPermissions from "../../auth/useMenuPermissions";
import ActionButton from "../../components/ui/ActionButton";
import { useAuth } from "../../auth/AuthProvider";
import CustomerForm from "./components/CustomerForm";
import CustomerImportFlyout from "./components/CustomerImportFlyout";
import { customerFallbackColumns, customerModuleSchema } from "./data/module.schema";

function CustomerModulePage({ menu_id }) {
  const navigate = useNavigate();
  const { authSession } = useAuth();
  const role_slug = authSession?.user?.role_slug;
  const resolvedMenuID = menu_id || customerModuleSchema.menu_id || null;
  const permissions = useMenuPermissions(resolvedMenuID);

  const [fields, setFields] = useState([]);
  const [customerList, setCustomerList] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);
  const [getBackTo, setGetBackTo] = useState(null);
  const [isImportFlyoutOpen, setIsImportFlyoutOpen] = useState(false);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [deleting, setDeleting] = useState(false);

  const { filterState, setSearchText, applyFilterPayload, setSort, clearFilters } = useModuleFilters(
    "customer",
    customerList
  );

  const sortConfig = {
    key: filterState.order_by || defaultSortConfig.key,
    direction: String(filterState.order || defaultSortConfig.direction).toLowerCase(),
  };

  const columnOptions = {
    skipFields: customerModuleSchema.skipFields,
    columnMappings: customerModuleSchema.columnMappings,
    tableCellConfig: customerModuleSchema.tableCellConfig,
  };

  const resolvedColumns = useMemo(
    () => buildTableColumnsFromStructure(fields, customerFallbackColumns, columnOptions),
    [fields]
  );

  const defaultVisibleColumnKeys = useMemo(
    () => customerFallbackColumns.map((column) => column.key),
    []
  );

  const resolvedFilterFields = useMemo(
    () =>
      buildFilterFieldsFromStructure(
        fields,
        customerModuleSchema.defaultColumns.map((key) => ({
          label: customerFallbackColumns.find((column) => column.key === key)?.label || key,
          value: key,
          type: "text",
        })),
        columnOptions
      ),
    [fields]
  );

  const getCustomerList = async () => {
    setLoading(true);

    const res = await makeRequest(customerModuleSchema.api.list, {
      method: "POST",
      body: {
        page,
        searchText: filterState.searchText,
        filters: filterState.filters,
        order: filterState.order,
        order_by: filterState.order_by,
      },
    });

    setLoading(false);

    if (res.success) {
      setCustomerList(res.data || []);
      setPagination(res.pagination || {});
      setSelectedRowIds([]);
      return;
    }

    toast.error(res?.message || "Error while fetching customers");
  };

  const getColumnList = async () => {
    if (!resolvedMenuID) {
      setFields([]);
      return;
    }

    const res = await getDefinitions(resolvedMenuID);
    if (res?.success) {
      setFields(res.data || []);
    }
  };

  const handleToggleRow = (rowId, checked) => {
    setSelectedRowIds((current) =>
      checked ? [...new Set([...current, rowId])] : current.filter((item) => item !== rowId)
    );
  };

  const handleReport = (customer) => {
    const customerId = customer?.customer_id ?? customer?.id;
    if (!customerId) {
      toast.error("Customer id not found.");
      return;
    }
    navigate(`/customer/report/${customerId}`, { state: { customer } });
  };

  const handleToggleAllRows = (checked) => {
    if (!checked) {
      setSelectedRowIds([]);
      return;
    }

    setSelectedRowIds(customerList.map((row) => row.customer_id).filter(Boolean));
  };

  const handleDeleteSelected = async () => {
    if (!selectedRowIds.length) {
      toast.error("Please select at least one customer.");
      return;
    }

    setDeleting(true);

    const res = await makeRequest(customerModuleSchema.api.delete, {
      method: "POST",
      body: {
        action: "delete",
        ids: selectedRowIds,
      },
    });

    setDeleting(false);

    if (res.success) {
      toast.success(res?.message || "Customers deleted successfully.");
      await getCustomerList();
      return;
    }

    toast.error(res?.message || "Error while deleting customers");
  };

  const handleDeleteRow = async (row) => {
    const rowId = row?.customer_id ?? row?.id;
    if (!rowId) {
      toast.error("Customer id not found.");
      return;
    }

    if (!window.confirm("Delete this customer?")) return;

    setDeleting(true);
    const res = await makeRequest(customerModuleSchema.api.delete, {
      method: "POST",
      body: {
        action: "delete",
        ids: [rowId],
      },
    });
    setDeleting(false);

    if (res.success) {
      toast.success(res?.message || "Customer deleted successfully.");
      await getCustomerList();
      return;
    }

    toast.error(res?.message || "Error while deleting customer");
  };

  const location = useLocation();

  useEffect(() => {
    const customer = location.state?.openCustomer;
    console.log(customer);
    
    if (customer?.customer_id) {
      setSelectedCustomer(customer);
      setIsFlyoutOpen(true);
    }
    if (customer?.getBackTo) {
      setGetBackTo(customer.getBackTo);
    }
  }, [location.state]);

  useEffect(() => {
    getColumnList();
  }, [resolvedMenuID]);

  useEffect(() => {
    getCustomerList();
  }, [page, filterState.searchText, filterState.order, filterState.order_by, JSON.stringify(filterState.filters)]);

  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
  }, [filterState.searchText, filterState.order, filterState.order_by, JSON.stringify(filterState.filters)]);

  return (
    <>
      <ModulePageLayout
        title={customerModuleSchema.title}
        description={customerModuleSchema.description}
        controls={
          <ModuleControls
            canCreate={permissions.canAdd}
            canDelete={permissions.canDelete}
            loading={loading}
            onRefresh={getCustomerList}
            onCreate={() => {
              setSelectedCustomer(null);
              setIsFlyoutOpen(true);
            }}
            onDeleteSelected={handleDeleteSelected}
            showDelete={selectedRowIds.length > 0}
            deleteDisabled={deleting || loading || selectedRowIds.length === 0}
            deleting={deleting}
            createLabel="Add Customer"
            filter={
              <DynamicFilter
                fields={resolvedFilterFields}
                savedFilters={customerModuleSchema.savedFilters}
                onSearch={setSearchText}
                onApplyFilters={applyFilterPayload}
                onSaveFilter={() => { }}
                onDeleteFilter={() => { }}
                onSelectSavedFilter={() => { }}
                onClearFilters={clearFilters}
              />
            }
          >
            {(role_slug == "admin" || role_slug == "super_admin") && permissions.canAdd && (
              <ActionButton onClick={() => setIsImportFlyoutOpen(true)}>
                <Upload size={15} />
                Import Data
              </ActionButton>
            )}
          </ModuleControls>
        }
        table={
          <ResizableTable
            loading={loading}
            menuId={resolvedMenuID}
            columns={resolvedColumns}
            rows={customerList}
            storageKey="customer-module-column-widths"
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
            editRow={permissions.canEdit ? (customer) => {
              setSelectedCustomer(customer);
              setIsFlyoutOpen(true);
            } : undefined}
            onDeleteRow={permissions.canDelete ? handleDeleteRow : undefined}
            allowSelection={permissions.canDelete}
            selectedRowIds={selectedRowIds}
            onToggleRow={handleToggleRow}
            onToggleAllRows={handleToggleAllRows}
            rowActions={[
              {
                key: "report",
                label: "Report",
                icon: BarChart3,
                className: "table-action-edit",
                onClick: handleReport,
              }
            ]}
          />
        }
        footer={<ModulePagination pagination={pagination} onPageChange={setPage} />}
      />

      <CustomerForm
        isOpen={isFlyoutOpen}
        onClose={() => {
          setIsFlyoutOpen(false);
          setSelectedCustomer(null);
          console.log('getBackTo :',getBackTo);
          
          getBackTo ? navigate(getBackTo) : null ;
        }}
        selectedCustomer={selectedCustomer}
        onAfterSave={getCustomerList}
        menu_id={resolvedMenuID}
      />

      <CustomerImportFlyout
        isOpen={isImportFlyoutOpen}
        onClose={() => setIsImportFlyoutOpen(false)}
        onImported={getCustomerList}
      />
    </>
  );
}

export default CustomerModulePage;
