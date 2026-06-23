import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { defaultSortConfig } from "@utils/sorting";
import {
  buildFilterFieldsFromStructure,
  buildTableColumnsFromStructure,
  getDefinitions,
} from "@utils/moduleStructure";
import { companyMasterFallbackColumns, companyMasterSchema } from "../data/module.schema";

export const useCompanyMasterTableConfig = ({ resolvedMenuID, filterState }) => {
  const [fields, setFields] = useState([]);

  const sortConfig = {
    key: filterState.order_by || defaultSortConfig.key,
    direction: String(filterState.order || defaultSortConfig.direction).toLowerCase(),
  };

  const columnOptions = {
    skipFields: companyMasterSchema.skipFields,
    columnMappings: companyMasterSchema.columnMappings,
    tableCellConfig: companyMasterSchema.tableCellConfig,
  };

  const resolvedColumns = useMemo(
    () => buildTableColumnsFromStructure(fields, companyMasterFallbackColumns, columnOptions),
    [fields]
  );

  const defaultVisibleColumnKeys = useMemo(
    () => companyMasterFallbackColumns.map((column) => column.key),
    []
  );

  const resolvedFilterFields = useMemo(
    () =>
      buildFilterFieldsFromStructure(
        fields,
        companyMasterSchema.defaultColumns.map((key) => ({
          label: companyMasterFallbackColumns.find((column) => column.key === key)?.label || key,
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

    toast.error(res?.message || "Error while fetching company fields");
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
