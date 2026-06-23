import { toast } from "react-toastify";
import { useMemo, useState, useEffect } from "react";
import { defaultSortConfig } from "@utils/sorting";
import { getDefinitions, buildFilterFieldsFromStructure, buildTableColumnsFromStructure, } from "@utils/moduleStructure";
import { customerFallbackColumns, customerModuleSchema } from "../data/module.schema";

export const useCustomerTableConfig = ({ resolvedMenuID, filterState }) => {
    const [fields, setFields] = useState([]);

    const sortConfig = {
        key: filterState.order_by || defaultSortConfig.key,
        direction: String(filterState.order || defaultSortConfig.direction).toLowerCase(),
    };

    const columnOptions = {
        skipFields: customerModuleSchema.skipFields,
        columnMappings: customerModuleSchema.columnMappings,
        tableCellConfig: customerModuleSchema.tableCellConfig,
    };

    const resolvedColumns = useMemo(
        () => buildTableColumnsFromStructure(fields, customerFallbackColumns, columnOptions),
        [fields]
    );

    const defaultVisibleColumnKeys = useMemo(
        () => customerFallbackColumns.map((column) => column.key),
        []
    );

    const resolvedFilterFields = useMemo(
        () =>
            buildFilterFieldsFromStructure(
                fields,
                customerModuleSchema.defaultColumns.map((key) => ({
                    label: customerFallbackColumns.find((column) => column.key === key)?.label || key,
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
        toast.error(res?.message || "Error while fetching customer fields");
    };
    useEffect(() => {
        getColumnList();
    }, [resolvedMenuID]);

    return {
        sortConfig,
        resolvedColumns,
        defaultVisibleColumnKeys,
        resolvedFilterFields,
    }
}
