import { toast } from "react-toastify";
import { useMemo, useState, useEffect } from "react";
import { defaultSortConfig } from "@utils/sorting";
import { getDefinitions, buildFilterFieldsFromStructure, buildTableColumnsFromStructure, } from "@utils/moduleStructure";
import { productsFallbackColumns, productsModuleSchema } from "../data/module.schema";

export const useProductsTableConfig = ({ resolvedMenuID, filterState }) => {

    const [fields, setFields] = useState([]);

    const sortConfig = {
        key: filterState.order_by || defaultSortConfig.key,
        direction: String(filterState.order || defaultSortConfig.direction).toLowerCase(),
    };

    const columnOptions = {
        skipFields: productsModuleSchema.skipFields,
        columnMappings: productsModuleSchema.columnMappings,
        tableCellConfig: productsModuleSchema.tableCellConfig,
    };

    const resolvedColumns = useMemo(
        () => buildTableColumnsFromStructure(fields, productsFallbackColumns, columnOptions),
        [fields]
    );

    const defaultVisibleColumnKeys = useMemo(
        () => productsFallbackColumns.map((column) => column.key),
        []
    );

    const resolvedFilterFields = useMemo(() =>
        buildFilterFieldsFromStructure(
            fields,
            productsModuleSchema.defaultColumns.map((key) => ({
                label:
                    productsFallbackColumns.find((column) => column.key === key)?.label || key,
                value: key,
                type: "text",
            })),
            columnOptions
        ),
        [fields]
    );
    const getColumnList = async () => {
        const res = await getDefinitions(resolvedMenuID);
        if (res.success) {
            setFields(res.data || []);
            return;
        }
        toast.error(res?.message || "Error while fetching model fields");
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
}