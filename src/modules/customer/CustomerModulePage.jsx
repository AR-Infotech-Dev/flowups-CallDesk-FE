import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { BarChart3, Upload } from "lucide-react";
import { useModuleFilters } from "../../store/hooks";

import { getNextSortConfig } from "../../utils/sorting";
import { useLocation, useNavigate } from "react-router-dom";

import ModuleControls from "../shared/ModuleControls";
import ModulePageLayout from "../shared/ModulePageLayout";
import ModulePagination from "../shared/ModulePagination";

import DynamicFilter from "../../components/dynamic-filter";
import ResizableTable from "../../components/table/ResizableTable";
import useMenuPermissions from "@auth/utils/useMenuPermissions";
import ActionButton from "../../components/ui/ActionButton";
import { useAuth } from "@auth/components/AuthProvider";
import CustomerForm from "./components/CustomerForm";
import CustomerImportFlyout from "./components/CustomerImportFlyout";
import CustomerTableRow from "./components/CustomerTableRow";
import { customerModuleSchema } from "./data/module.schema";

import { useAppSelector } from "@store/hooks";
import { useCustomersModule } from "./hooks/useCustomersModule";
import { useCustomerTableConfig } from "./hooks/useCustomerTableConfig";

import { selectCustomersRows } from "./data/customer.slice";

function CustomerModulePage({ menu_id }) {

  const navigate = useNavigate();
  const location = useLocation();
  const { authSession } = useAuth();
  const role_slug = authSession?.user?.role_slug;
  const resolvedMenuID = menu_id || customerModuleSchema.menu_id || null;
  const permissions = useMenuPermissions(resolvedMenuID);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);

  const [isImportFlyoutOpen, setIsImportFlyoutOpen] = useState(false);
  const [getBackTo, setGetBackTo] = useState(null);


  const customerList = useAppSelector(selectCustomersRows);
  const { filterState, setSearchText, applyFilterPayload, setSort, clearFilters } = useModuleFilters("customer", customerList);
  const { pagination, page, loading, deleting, selectedRowIds, getCustomersList, handlePageChange, handleToggleRow, handleToggleAllRows, handleDeleteSelected, handleDeleteRow, } = useCustomersModule({ filterState });
  const { sortConfig, resolvedColumns, defaultVisibleColumnKeys, resolvedFilterFields, } = useCustomerTableConfig({ resolvedMenuID, filterState });

  const handleReport = (customer) => {
    const customerId = customer?.customer_id ?? customer?.id;
    if (!customerId) {
      toast.error("Customer id not found.");
      return;
    }
    navigate(`/customer/report/${customerId}`, { state: { customer } });
  };
  const handleProductsFlyout = () => {

  }
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
    const customer = location.state?.openCustomer;
    if (customer?.customer_id) {
      setSelectedCustomer(customer);
      setIsFlyoutOpen(true);
    }
    if (customer?.getBackTo) {
      setGetBackTo(customer.getBackTo);
    }
  }, [location.state]);

  useEffect(() => {
    getCustomersList();
  }, [page, filterState.searchText, filterState.order, filterState.order_by, JSON.stringify(filterState.filters)]);

  useEffect(() => {
    if (page !== 1) {
      handlePageChange(1);
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
            onRefresh={getCustomersList}
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
            onSortChange={handleSortChange}
            editRow={permissions.canEdit ? (customer) => {
              setSelectedCustomer(customer);
              setIsFlyoutOpen(true);
            } : undefined}
            onDeleteRow={permissions.canDelete ? handleDeleteRow : undefined}
            allowSelection={permissions.canDelete}
            selectedRowIds={selectedRowIds}
            onToggleRow={handleToggleRow}
            onToggleAllRows={handleToggleAllRows}
            renderRow={(row, index, columns, table) => (
              <CustomerTableRow
                row={row}
                index={index}
                columns={columns}
                table={table}
              />
            )}
            rowActions={[
              {
                key: "report",
                label: "Report",
                icon: BarChart3,
                className: "table-action-edit",
                onClick: handleReport,
              },
            ]}
          />
        }
        footer={<ModulePagination pagination={pagination} onPageChange={handlePageChange} />}
      />

      <CustomerForm
        isOpen={isFlyoutOpen}
        onClose={() => {
          setIsFlyoutOpen(false);
          setSelectedCustomer(null);
          getBackTo ? navigate(getBackTo) : null;
        }}
        selectedCustomer={selectedCustomer}
        onAfterSave={getCustomersList}
        menu_id={resolvedMenuID}
      />
      <CustomerImportFlyout
        isOpen={isImportFlyoutOpen}
        onClose={() => setIsImportFlyoutOpen(false)}
        onImported={getCustomersList}
      />
    </>
  );
}

export default CustomerModulePage;
