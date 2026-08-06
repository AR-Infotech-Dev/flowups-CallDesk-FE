import { useEffect } from "react";
import { getNextSortConfig } from "@utils/sorting";
import { useAppSelector, useModuleFilters } from "@store/hooks";
import DynamicFilter from "@components/dynamic-filter";
import ResizableTable from "@components/table/ResizableTable";
import ModuleControls from "@shared/ModuleControls";
import ModulePageLayout from "@shared/ModulePageLayout";
import ModulePagination from "@shared/ModulePagination";
import FeedbackCards from "./components/FeedbackCards";
import FeedbackTableRow from "./components/FeedbackTableRow";
import ReviewRatingCard from "./components/ReviewRatingCard";
import {
  selectFeedbacksRows,
  selectRatingsError,
  selectRatingsLoading,
  selectReviewRatings,
} from "./data/feedbacks.slice";
import { feedbacksModuleSchema } from "./data/module.schema";
import { useFeedbackModule } from "./hooks/useFeedbackModule";
import { useFeedbackTableConfig } from "./hooks/useFeedbackTableConfig";
import TicketForm from "../tickets/components/TicketForm";

function FeedbackModulePage({ menu_id }) {
  const resolvedMenuID = menu_id || feedbacksModuleSchema.menu_id || null;
  const feedbackList = useAppSelector(selectFeedbacksRows);
  const ratingSummary = useAppSelector(selectReviewRatings);
  const ratingLoading = useAppSelector(selectRatingsLoading);
  const ratingError = useAppSelector(selectRatingsError);
  const {
    filterState,
    setSearchText,
    applyFilterPayload,
    setSort,
    clearFilters,
  } = useModuleFilters("feedback-master", feedbackList);
  const {
    isFlyoutOpen,
    pagination,
    page,
    selectedTicket,
    loading,
    getReviewRatings,
    getFeedbackList,
    openEditFlyout,
    closeFlyout,
    handlePageChange,
  } = useFeedbackModule({ filterState });
  const {
    sortConfig,
    resolvedColumns,
    defaultVisibleColumnKeys,
    resolvedFilterFields,
  } = useFeedbackTableConfig({ resolvedMenuID, filterState });

  const handleSortChange = (columnKey) => {
    const nextSort = getNextSortConfig(sortConfig, columnKey);

    if (page !== 1) handlePageChange(1);
    setSort({
      order_by: nextSort.key,
      order: nextSort.direction.toUpperCase(),
    });
  };

  useEffect(() => {
    getFeedbackList();
  }, [page, filterState.searchText, filterState.order, filterState.order_by, JSON.stringify(filterState.filters)]);

  useEffect(() => {
    getReviewRatings();
  }, []);

  useEffect(() => {
    if (page !== 1) handlePageChange(1);
  }, [filterState.searchText, filterState.order, filterState.order_by, JSON.stringify(filterState.filters)]);

  return (
    <>
      <ModulePageLayout
        title={feedbacksModuleSchema.title}
        description={feedbacksModuleSchema.description}
        controls={
          <ModuleControls
            canCreate={false}
            canDelete={false}
            loading={loading || ratingLoading}
            onRefresh={() => {
              getFeedbackList();
              getReviewRatings();
            }}
            filter={
              <DynamicFilter
                filterState={filterState}
                fields={resolvedFilterFields}
                savedFilters={feedbacksModuleSchema.savedFilters}
                onSearch={setSearchText}
                onApplyFilters={applyFilterPayload}
                onClearFilters={clearFilters}
              />
            }
          />
        }
        cards={<FeedbackCards ratingSummary={ratingSummary} loading={ratingLoading} />}
        table={
          <div className="grid h-full min-h-0 w-full grid-cols-12 items-stretch gap-3 px-3 pb-3">
            <ReviewRatingCard
              ratingSummary={ratingSummary}
              loading={ratingLoading}
              error={ratingError}
              className="col-span-12 min-w-0 overflow-hidden xl:col-span-4 xl:h-full"
            />

            <section
              aria-label="Customer reviews"
              className="relative col-span-12 flex min-h-[360px] min-w-0 flex-col overflow-hidden rounded-sm border border-slate-200 bg-white xl:col-span-8 xl:h-full xl:min-h-0"
            >
              <ResizableTable
                loading={loading}
                menuId={resolvedMenuID}
                columns={resolvedColumns}
                onEditRow={openEditFlyout}
                rows={feedbackList}
                storageKey="feedbacks-module-column-widths"
                defaultVisibleColumnKeys={defaultVisibleColumnKeys}
                sortConfig={sortConfig}
                onSortChange={handleSortChange}
                allowSelection={false}
                showActions={false}
                renderRow={(row, index, columns, table) => (
                  <FeedbackTableRow row={row} index={index} columns={columns} table={table} />
                )}
              />
              <div className="shrink-0 border-t border-slate-100 bg-white px-2 py-2">
                <ModulePagination pagination={pagination} onPageChange={handlePageChange} />
              </div>
            </section>
          </div>
        }
      />
      <TicketForm
        isOpen={isFlyoutOpen}
        onClose={closeFlyout}
        selectedTicket={selectedTicket}
        menu_id={resolvedMenuID}
      />
    </>
  );
}

export default FeedbackModulePage;
