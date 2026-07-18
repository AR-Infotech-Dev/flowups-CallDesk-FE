import { useEffect, useState } from "react";
import { subscriptionsModuleSchema } from "./data/module.schema";
import { useSubscriptionsTableConfig } from "./hooks/useSubscriptionsTableConfig";
import { useSubscriptionsModule } from "./hooks/useSubscriptionsModule";
import { getNextSortConfig } from "@utils/sorting";
import { useModuleFilters, useAppSelector } from "@store/hooks";
import { selectSubscriptionsRows } from "./data/subscriptions.slice";

import ModuleControls from "@shared/ModuleControls";
import ModulePageLayout from "@shared/ModulePageLayout";
import ModulePagination from "@shared/ModulePagination";
import useMenuPermissions from "@auth/utils/useMenuPermissions";
import SubscriptionForm from "./components/SubscriptionsForm";
import PlanCarousel from "./components/PlanCarousel";
function SubscriptionsModulePage({ menu_id }) {

  const resolvedMenuID = menu_id || subscriptionsModuleSchema.menu_id || null;
  const permissions = useMenuPermissions(resolvedMenuID);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);
  const subscriptionList = useAppSelector(selectSubscriptionsRows);
  const { filterState, setSearchText, applyFilterPayload, setSort, clearFilters, } = useModuleFilters("subscription-master", subscriptionList);
  const { pagination, page, loading, deleting, selectedRowIds, getSubscriptionList, handlePageChange, handleToggleRow, handleToggleAllRows, handleDeleteSelected, handleDeleteRow, } = useSubscriptionsModule({ filterState });
  const { sortConfig, resolvedColumns, defaultVisibleColumnKeys, resolvedFilterFields, } = useSubscriptionsTableConfig({ resolvedMenuID, filterState });

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
    getSubscriptionList();
  }, [page, filterState.searchText, filterState.order, filterState.order_by, JSON.stringify(filterState.filters)]);

  useEffect(() => {
    if (page !== 1) {
      handlePageChange(1)
    }
  }, [filterState.searchText, filterState.order, filterState.order_by, JSON.stringify(filterState.filters)]);

  return (
    <>
      <ModulePageLayout
        title={subscriptionsModuleSchema.title}
        description={subscriptionsModuleSchema.description}
        controls={
          <ModuleControls
            // canCreate={permissions.canAdd}
            canCreate={false}
            canDelete={permissions.canDelete}
            loading={loading}
            onRefresh={getSubscriptionList}
            onCreate={() => {
              setSelectedSubscription(null);
              setIsFlyoutOpen(true);
            }}
            onDeleteSelected={handleDeleteSelected}
            showDelete={selectedRowIds.length !== 0}
            deleteDisabled={deleting || loading || selectedRowIds.length === 0}
            deleteLabel={`Delete Selected${selectedRowIds.length ? ` (${selectedRowIds.length})` : ""}`}
            deleting={deleting}
            filter={
              null // <DynamicFilter filterState={filterState} fields={resolvedFilterFields} savedFilters={subscriptionsModuleSchema.savedFilters} onSearch={setSearchText} onApplyFilters={applyFilterPayload} onSaveFilter={() => { }} onDeleteFilter={() => { }} onSelectSavedFilter={() => { }} onClearFilters={clearFilters} />
            }
          />
        }
        footer={<ModulePagination pagination={pagination} onPageChange={handlePageChange} />}
      >
        <PlanCarousel plans={subscriptionList} onSelectPlan={(plan) => console.log(plan)} />
      </ModulePageLayout>
      <SubscriptionForm
        isOpen={isFlyoutOpen}
        onClose={() => setIsFlyoutOpen(false)}
        selectedSubscription={selectedSubscription}
        onAfterSave={getSubscriptionList}
        menu_id={resolvedMenuID}
      />
    </>
  );
}

export default SubscriptionsModulePage;
