import { useEffect, useMemo, useState } from "react";
import { defaultSortConfig } from "@utils/sorting";
import {
  buildFilterFieldsFromStructure,
  buildTableColumnsFromStructure,
  getDefinitions,
} from "@utils/moduleStructure";
import { ticketsFallbackColumns, ticketsModuleSchema } from "../data/module.schema";
import { TICKET_VISIBILITY_COLUMN } from "../utils/tickets.utils";

export const useTicketsTableConfig = ({ resolvedMenuID, filterState, role_slug }) => {
  const [fields, setFields] = useState([]);

  const sortConfig = {
    key: filterState.order_by || "created_date",
    direction: String(filterState.order || defaultSortConfig.direction).toLowerCase(),
  };

  const columnOptions = {
    skipFields: ticketsModuleSchema.skipFields,
    columnMappings: ticketsModuleSchema.columnMappings,
    tableCellConfig: ticketsModuleSchema.tableCellConfig,
    filterFieldOptions: ticketsModuleSchema.filterFieldOptions,
  };

  const resolvedColumns = useMemo(() => {
    const columns = buildTableColumnsFromStructure(fields, ticketsFallbackColumns, columnOptions);
    const hasVisibilityColumn = columns.some((column) => column.key === TICKET_VISIBILITY_COLUMN.key);

    return hasVisibilityColumn ? columns : [...columns, TICKET_VISIBILITY_COLUMN];
  }, [fields]);

  const defaultVisibleColumnKeys = useMemo(
    () => [...ticketsFallbackColumns.map((column) => column.key), TICKET_VISIBILITY_COLUMN.key],
    []
  );

  const resolvedFilterFields = useMemo(() => {
    const filterFields = buildFilterFieldsFromStructure(
      fields,
      ticketsModuleSchema.defaultColumns.map((key) => ({
        label: ticketsFallbackColumns.find((column) => column.key === key)?.label || key,
        value: key,
        type: "text",
      })),
      columnOptions
    );
    return role_slug === "super_admin"
      ? filterFields
      : filterFields.filter(
        (field) => field.value !== "company_id"
      );
  }, [fields, role_slug]);

  const getColumnList = async () => {
    if (!resolvedMenuID) {
      setFields([]);
      return;
    }

    const res = await getDefinitions(resolvedMenuID);
    if (res.success) {
      setFields(res.data || []);
    }
  };

  useEffect(() => {
    getColumnList();
  }, [resolvedMenuID]);

  return {
    sortConfig,
    resolvedColumns,
    defaultVisibleColumnKeys,
    resolvedFilterFields,
  };
};
