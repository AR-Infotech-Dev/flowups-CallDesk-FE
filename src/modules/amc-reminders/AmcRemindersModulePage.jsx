import { useEffect } from "react";
import useMenuPermissions from "@auth/utils/useMenuPermissions";
import DynamicFilter from "@components/DynamicFilter";
import ResizableTable from "@components/table/ResizableTable";
import ModuleControls from "@shared/ModuleControls";
import ModulePageLayout from "@shared/ModulePageLayout";
import ModulePagination from "@shared/ModulePagination";
import { useAppSelector, useModuleFilters } from "@store/hooks";
import { defaultSortConfig } from "@utils/sorting";
import ActivityModal from "./components/ActivityModal";
import AmcReminderTableRow from "./components/AmcReminderTableRow";
import ReminderConfirmModal from "./components/ReminderConfirmModal";
import VisitScheduleModal from "./components/VisitScheduleModal";
import { AMC_REMINDER_FILTER_FIELDS } from "./data/amcReminder.constants";
import { selectAmcRows } from "./data/amcReminder.slice";
import { amcReminderFallbackColumns, amcReminderModuleSchema } from "./data/module.schema";
import { useAmcReminderTableConfig } from "./hooks/useAmcReminderTableConfig";
import { useAmcRemindersModule } from "./hooks/useAmcRemindersModule";

function AmcRemindersModulePage({ menu_id }) {
  const resolvedMenuID = menu_id || amcReminderModuleSchema.menu_id || null;
  const permissions = useMenuPermissions(resolvedMenuID);
  const canSendReminder = permissions.canAdd || permissions.canEdit;
  const amcRows = useAppSelector(selectAmcRows);

  const {
    filterState,
    setSearchText,
    applyFilterPayload,
    setSort,
    clearFilters,
  } = useModuleFilters("amc-reminders", amcRows);

  const effectiveOrderBy =
    !filterState.order_by || filterState.order_by === defaultSortConfig.key
      ? "remaining_call_count"
      : filterState.order_by;

  const effectiveOrder =
    !filterState.order_by || filterState.order_by === defaultSortConfig.key
      ? "DESC"
      : filterState.order || "DESC";

  const {
    page,
    customers,
    pagination,
    loading,
    selectedCustomer,
    includeReport,
    sendingCustomerId,
    callingCustomerId,
    visitCustomer,
    schedulingVisitCustomerId,
    activityCustomer,
    activityData,
    activityTab,
    activityLoadingCustomerId,
    visitFormData,
    setIncludeReport,
    setActivityTab,
    handlePageChange,
    getReminderList,
    openReminderModal,
    closeReminderModal,
    handleSendReminder,
    handleMakeCall,
    handleAddVisit,
    closeVisitModal,
    handleVisitFieldChange,
    handleScheduleVisit,
    handleOpenActivity,
    refreshActivity,
    closeActivityModal,
  } = useAmcRemindersModule({
    filterState,
    effectiveOrder,
    effectiveOrderBy,
    canSendReminder,
  });

  const { sortConfig, defaultVisibleColumnKeys, handleSortChange, } = useAmcReminderTableConfig({ filterState, setSort, page, handlePageChange, });

  useEffect(() => {
    getReminderList();
  }, [page, filterState.searchText, filterState.order, filterState.order_by, JSON.stringify(filterState.filters)]);

  useEffect(() => {
    if (page !== 1) {
      handlePageChange(1);
    }
  }, [filterState.searchText, filterState.order, filterState.order_by, JSON.stringify(filterState.filters)]);

  return (
    <>
      <ModulePageLayout
        title={amcReminderModuleSchema.title}
        description={amcReminderModuleSchema.description}
        controls={
          <ModuleControls
            loading={loading}
            onRefresh={getReminderList}
            showTraditional
            canCreate={false}
            canDelete={false}
            filter={
              <DynamicFilter
                fields={AMC_REMINDER_FILTER_FIELDS}
                savedFilters={amcReminderModuleSchema.savedFilters}
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
            columns={amcReminderFallbackColumns}
            rows={customers}
            storageKey="amc-reminders-module-column-widths-v2"
            defaultVisibleColumnKeys={defaultVisibleColumnKeys}
            allowSelection={false}
            sortConfig={sortConfig}
            onSortChange={handleSortChange}
            renderRow={(row, index, columns) => (
              <AmcReminderTableRow
                row={row}
                index={index}
                columns={columns}
                actions={{
                  onOpenReminder: openReminderModal,
                  onMakeCall: handleMakeCall,
                  onAddVisit: handleAddVisit,
                  onOpenActivity: handleOpenActivity,
                  sendingCustomerId,
                  callingCustomerId,
                  activityLoadingCustomerId,
                }}
              />
            )}
          />
        }
        footer={<ModulePagination pagination={pagination} onPageChange={handlePageChange} />}
      />

      <ReminderConfirmModal
        customer={selectedCustomer}
        includeReport={includeReport}
        sending={Boolean(sendingCustomerId)}
        onIncludeReportChange={setIncludeReport}
        onClose={closeReminderModal}
        onConfirm={handleSendReminder}
      />
      <VisitScheduleModal
        customer={visitCustomer}
        formData={visitFormData}
        scheduling={Boolean(schedulingVisitCustomerId)}
        onChange={handleVisitFieldChange}
        onClose={closeVisitModal}
        onConfirm={handleScheduleVisit}
      />
      <ActivityModal
        onRefresh={refreshActivity}
        customer={activityCustomer}
        activity={activityData}
        activeTab={activityTab}
        onTabChange={setActivityTab}
        onClose={closeActivityModal}
      />
    </>
  );
}

export default AmcRemindersModulePage;
