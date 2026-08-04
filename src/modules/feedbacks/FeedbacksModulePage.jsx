import { useCallback, useEffect, useState } from "react";

import { feedbacksModuleSchema } from "./data/module.schema";
import { useFeedbacksTableConfig } from "./hooks/useFeedbacksTableConfig";
import { useFeedbacksModule } from "./hooks/useFeedbackModule";
import { fetchReviewRatings } from "./data/feedbacks.service";
import { selectFeedbacksRows } from "./data/feedbacks.slice";

import {
  useModuleFilters,
  useAppSelector,
} from "@store/hooks";

import ModuleControls from "@shared/ModuleControls";
import ModulePageLayout from "@shared/ModulePageLayout";
import DynamicFilter from "@components/dynamic-filter";
import useMenuPermissions from "@auth/utils/useMenuPermissions";

import FeedbackCards from "./components/FeedbackCards";
import ReviewRatingCard from "./components/ReviewRatingCard";
import FeedbackTable from "./components/FeedbackTable";
// import { FeedbackCardsSkeleton, ReviewRatingSkeleton, FeedbackTableSkeleton, } from "./components/FeedbackPageSkeleton";

function FeedbacksModulePage({ menu_id }) {
  const resolvedMenuID =
    menu_id || feedbacksModuleSchema.menu_id || null;

  const permissions = useMenuPermissions(resolvedMenuID);

  // Review rating states
  const [ratingSummary, setRatingSummary] = useState({});
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingError, setRatingError] = useState("");

  // Feedback table rows from Redux
  const feedbackList =
    useAppSelector(selectFeedbacksRows) ?? [];

  const {
    filterState,
    setSearchText,
    applyFilterPayload,
    clearFilters,
  } = useModuleFilters(
    "feedback-master",
    feedbackList
  );

  const {
    page,
    loading,
    deleting,
    selectedRowIds,
    getFeedbackList,
    handlePageChange,
    handleDeleteSelected,
  } = useFeedbacksModule({
    filterState,
  });

  const {
    resolvedFilterFields,
  } = useFeedbacksTableConfig({
    resolvedMenuID,
    filterState,
  });

  /*
   * Review rating API call
   */ 
  const getReviewRatingData = useCallback(async () => {
    try {
      setRatingLoading(true);
      setRatingError("");

      const response = await fetchReviewRatings();

       

      /*
       * Axios response:
       * response.data.data[0]
       *
       * makeRequest direct backend response:
       * response.data[0]
       */
      const responseData =
        response?.data?.data ??
        response?.data ??
        response ??
        [];

      const summary = Array.isArray(responseData)
        ? responseData[0] ?? {}
        : responseData ?? {};

      console.log(
        "Review Rating Summary:",
        summary
      );

      // Backend object direct store केला आहे.
      // formattedRatings ReviewRatingCard मध्ये तयार होईल.
      setRatingSummary(summary);
    } catch (error) {
      console.error(
        "Review Rating API Error:",
        error
      );

      setRatingError(
        error?.response?.data?.message ||
        error?.response?.data?.msg ||
        error?.message ||
        "Review ratings fetch failed"
      );

      setRatingSummary({});
    } finally {
      setRatingLoading(false);
    }
  }, []);

  /*
   * Refresh feedback table and ratings
   */
  const handleRefresh = async () => {
    await Promise.all([
      getFeedbackList(),
      getReviewRatingData(),
    ]);
  };

  /*
   * Feedback list fetch
   */
  useEffect(() => {
    getFeedbackList();
  }, [
    page,
    filterState.searchText,
    filterState.order,
    filterState.order_by,
    JSON.stringify(filterState.filters),
  ]);

  
  useEffect(() => {
    if (page !== 1) {
      handlePageChange(1);
    }
  }, [
    filterState.searchText,
    filterState.order,
    filterState.order_by,
    JSON.stringify(filterState.filters),
  ]);

  
  useEffect(() => {
    getReviewRatingData();
  }, [getReviewRatingData]);

  // sceletan add
  // const isPageLoading = loading || ratingLoading;



  return (
    <ModulePageLayout
      title={feedbacksModuleSchema.title}
      description={feedbacksModuleSchema.description}
      controls={
        <ModuleControls
          canCreate={permissions.canAdd}
          canDelete={permissions.canDelete}
          loading={loading}
          onRefresh={handleRefresh}
          onCreate={() => {
            // Feedback form open logic येथे add कर
          }}
          onDeleteSelected={handleDeleteSelected}
          showDelete={selectedRowIds.length > 0}
          deleteDisabled={
            deleting ||
            loading ||
            selectedRowIds.length === 0
          }
          deleteLabel={`Delete Selected${selectedRowIds.length
            ? ` (${selectedRowIds.length})`
            : ""
            }`}
          deleting={deleting}
          filter={
            <DynamicFilter
              filterState={filterState}
              fields={resolvedFilterFields}
              savedFilters={
                feedbacksModuleSchema.savedFilters
              }
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
      cards={
        <FeedbackCards
          ratingSummary={ratingSummary}
          loading={ratingLoading}
        />
      }
      table={
        <div className="grid w-full grid-cols-12 gap-4 px-5">
          {/* Review Rating */}
          <ReviewRatingCard
            ratingSummary={ratingSummary}
            loading={ratingLoading}
            error={ratingError}
            className="col-span-12 w-full min-w-0 xl:col-span-4"
          />
          {/* Feedback Table */}


          <FeedbackTable
            rows={feedbackList}
            loading={loading}
            className="col-span-12 w-full min-w-0 xl:col-span-8"
          />

        </div>
      }
    />
  );
}

export default FeedbacksModulePage;