import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
    fetchProducts,
    deleteProducts,
    selectProductsPagination,
    selectProductsPage,
    selectProductsLoading,
    selectProductsDeleting,
    selectProductsSelectedRowIds,
    selectProductsRows,
} from "../data/products.slice";
import * as productsActions from "../data/products.slice";

export const useProductsModule = ({ filterState }) => {
    const dispatch = useAppDispatch();

    const selectedRowIds = useAppSelector(selectProductsSelectedRowIds);
    const pagination = useAppSelector(selectProductsPagination);
    const loading = useAppSelector(selectProductsLoading);
    const deleting = useAppSelector(selectProductsDeleting);
    const page = useAppSelector(selectProductsPage);
    const productList = useAppSelector(selectProductsRows);

    const getProductList = async () => {
        const action = await dispatch(fetchProducts({ filterState, page }));

        if (fetchProducts.rejected.match(action)) {
            toast.error(action.payload || "Error while fetching products");
        }
    };

    const handlePageChange = (pageNumber) => {
        dispatch(productsActions.setProductsPage(pageNumber));
    }

    const handleToggleRow = (rowId, checked) => {
        const currentSelectedRowIds = Array.isArray(selectedRowIds) ? selectedRowIds : [];
        const nextSelectedRowIds = checked
            ? [...new Set([...currentSelectedRowIds, rowId])]
            : currentSelectedRowIds.filter((item) => item !== rowId);
        dispatch(productsActions.setProductsSelection(nextSelectedRowIds));
    };

    const handleToggleAllRows = (checked) => {
        if (!checked) {
            dispatch(productsActions.clearProductsSelection());
            return;
        }

        dispatch(productsActions.setProductsSelection(
            productList.map((row) => row?.product_id ?? row?._id ?? row?.id).filter(Boolean)
        ))
    };

    const handleDeleteSelected = async () => {
        if (!selectedRowIds.length) {
            toast.error("Please select at least one product to delete.");
            return;
        }
        const action = await dispatch(deleteProducts(selectedRowIds));

        if (deleteProducts.fulfilled.match(action)) {
            toast.success(action.payload.message);
            await getProductList();
        }
        if (deleteProducts.rejected.match(action)) {
            toast.error(action.payload);
        }
    };

    const handleDeleteRow = async (row) => {
        const rowId = row?.product_id ?? row?._id ?? row?.id;
        if (!rowId) { toast.error("Product id not found."); return; }
        if (!window.confirm("Delete this product?")) return;

        const action = await dispatch(deleteProducts([rowId]));

        if (deleteProducts.fulfilled.match(action)) {
            toast.success(action.payload.message);
            await getProductList();
        }
        if (deleteProducts.rejected.match(action)) {
            toast.error(action.payload);
        }
    };

    return {
        pagination,
        page,
        loading,
        deleting,
        selectedRowIds,
        handlePageChange,
        getProductList,
        handleToggleRow,
        handleToggleAllRows,
        handleDeleteSelected,
        handleDeleteRow,
    }
}
