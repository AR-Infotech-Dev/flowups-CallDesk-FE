import { toast } from "react-toastify";
import { useMemo, useState, useEffect } from "react";
import { defaultSortConfig } from "@utils/sorting";
import { getDefinitions, buildFilterFieldsFromStructure, buildTableColumnsFromStructure, } from "@utils/moduleStructure";
import { usersFallbackColumns, usersModuleSchema } from "../data/module.schema";

export const useUsersTableConfig = ({ resolvedMenuID, filterState }) => {

    const [fields, setFields] = useState([]);

    const sortConfig = {
        key: filterState.order_by || defaultSortConfig.key,
        direction: String(filterState.order || defaultSortConfig.direction).toLowerCase(),
    };

    const columnOptions = {
        skipFields: usersModuleSchema.skipFields,
        columnMappings: usersModuleSchema.columnMappings,
        tableCellConfig: usersModuleSchema.tableCellConfig,
    };

    const resolvedColumns = useMemo(
        () => buildTableColumnsFromStructure(fields, usersFallbackColumns, columnOptions),
        [fields]
    );

    const defaultVisibleColumnKeys = useMemo(
        () => usersFallbackColumns.map((column) => column.key),
        []
    );

    const resolvedFilterFields = useMemo(() =>
        buildFilterFieldsFromStructure(
            fields,
            usersModuleSchema.defaultColumns.map((key) => ({
                label:
                    usersFallbackColumns.find((column) => column.key === key)?.label || key,
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