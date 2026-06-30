import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { defaultSortConfig } from "@utils/sorting";
import {
  buildFilterFieldsFromStructure,
  buildTableColumnsFromStructure,
  getDefinitions,
} from "@utils/moduleStructure";
import { categoryFallbackColumns, categoryModuleSchema } from "../data/module.schema";

export const useCategoriesTableConfig = ({ resolvedMenuID, filterState }) => {
  const [fields, setFields] = useState([]);

  const sortConfig = {
    key: filterState.order_by || defaultSortConfig.key,
    direction: String(filterState.order || defaultSortConfig.direction).toLowerCase(),
  };

  const columnOptions = {
    skipFields: categoryModuleSchema.skipFields,
    columnMappings: categoryModuleSchema.columnMappings,
    tableCellConfig: categoryModuleSchema.tableCellConfig,
  };

  const resolvedColumns = useMemo(
    () => buildTableColumnsFromStructure(fields, categoryFallbackColumns, columnOptions),
    [fields]
  );

  const defaultVisibleColumnKeys = useMemo(
    () => categoryFallbackColumns.map((column) => column.key),
    []
  );

  const resolvedFilterFields = useMemo(
    () =>
      buildFilterFieldsFromStructure(
        fields,
        categoryModuleSchema.defaultColumns.map((key) => ({
          label: categoryFallbackColumns.find((column) => column.key === key)?.label || key,
          value: key,
          type: "text",
        })),
        columnOptions
      ),
    [fields]
  );

  const getColumnList = async () => {
    if (!resolvedMenuID) {
      setFields([]);
      return;
    }

    const res = await getDefinitions(resolvedMenuID);
    if (res?.success) {
      setFields(res.data || []);
      return;
    }

    toast.error(res?.message || "Error while fetching category fields");
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
