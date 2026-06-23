import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  buildFilterFieldsFromStructure,
  getDefinitions,
} from "@utils/moduleStructure";
import { menuMasterFallbackColumns, menuMasterSchema } from "../data/module.schema";

export const useMenuMasterFilters = ({ resolvedMenuID }) => {
  const [fields, setFields] = useState([]);

  const columnOptions = {
    skipFields: menuMasterSchema.skipFields,
    columnMappings: menuMasterSchema.columnMappings,
    tableCellConfig: menuMasterSchema.tableCellConfig,
  };

  const resolvedFilterFields = useMemo(
    () =>
      buildFilterFieldsFromStructure(
        fields,
        menuMasterSchema.defaultColumns.map((key) => ({
          label: menuMasterFallbackColumns.find((column) => column.key === key)?.label || key,
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

    if (res.success) {
      setFields(res.data || []);
      return;
    }

    toast.error(res?.message || "Error while fetching module fields");
  };

  useEffect(() => {
    getColumnList();
  }, [resolvedMenuID]);

  return {
    resolvedFilterFields,
  };
};
