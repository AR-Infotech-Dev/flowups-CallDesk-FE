import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { defaultSortConfig } from "@utils/sorting";
import { buildFilterFieldsFromStructure, buildTableColumnsFromStructure, getDefinitions } from "@utils/moduleStructure";
import { leadsFallbackColumns, leadsModuleSchema } from "../data/module.schema";

export const useLeadsTableConfig = ({ resolvedMenuID, filterState }) => {
  const [fields, setFields] = useState([]);
  const sortConfig = { key: filterState.order_by || defaultSortConfig.key, direction: String(filterState.order || defaultSortConfig.direction).toLowerCase() };
  const options = { skipFields: leadsModuleSchema.skipFields, columnMappings: leadsModuleSchema.columnMappings, tableCellConfig: leadsModuleSchema.tableCellConfig };
  const resolvedColumns = useMemo(() => buildTableColumnsFromStructure(fields, leadsFallbackColumns, options), [fields]);
  const defaultVisibleColumnKeys = useMemo(() => leadsFallbackColumns.map((column) => column.key), []);
  const resolvedFilterFields = useMemo(() => buildFilterFieldsFromStructure(fields, leadsModuleSchema.defaultColumns.map((key) => ({ label: leadsFallbackColumns.find((column) => column.key === key)?.label || key, value: key, type: "text" })), options), [fields]);

  useEffect(() => {
    if (!resolvedMenuID) { setFields([]); return; }
    getDefinitions(resolvedMenuID).then((res) => res?.success ? setFields(res.data || []) : toast.error(res?.message || "Unable to fetch lead fields"));
  }, [resolvedMenuID]);

  return { sortConfig, resolvedColumns, defaultVisibleColumnKeys, resolvedFilterFields };
};
