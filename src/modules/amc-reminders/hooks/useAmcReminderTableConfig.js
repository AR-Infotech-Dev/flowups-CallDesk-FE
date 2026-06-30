import { useMemo } from "react";
import { defaultSortConfig, getNextSortConfig } from "@utils/sorting";
import { amcReminderFallbackColumns } from "../data/module.schema";

export function useAmcReminderTableConfig({
  filterState,
  setSort,
  page,
  handlePageChange,
}) {
  const effectiveOrderBy =
    !filterState.order_by || filterState.order_by === defaultSortConfig.key
      ? "remaining_call_count"
      : filterState.order_by;

  const effectiveOrder =
    !filterState.order_by || filterState.order_by === defaultSortConfig.key
      ? "DESC"
      : filterState.order || "DESC";

  const sortConfig = {
    key: effectiveOrderBy,
    direction: String(effectiveOrder).toLowerCase(),
  };

  const defaultVisibleColumnKeys = useMemo(
    () => amcReminderFallbackColumns.map((column) => column.key),
    []
  );

  const handleSortChange = (columnKey) => {
    if (columnKey === "actions") return;

    const nextSort = getNextSortConfig(sortConfig, columnKey);
    if (page !== 1) {
      handlePageChange(1);
    }

    setSort({
      order_by: nextSort.key,
      order: nextSort.direction.toUpperCase(),
    });
  };

  return {
    effectiveOrderBy,
    effectiveOrder,
    sortConfig,
    defaultVisibleColumnKeys,
    handleSortChange,
  };
}
