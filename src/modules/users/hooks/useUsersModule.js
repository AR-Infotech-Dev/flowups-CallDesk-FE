import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
    fetchUsers,
    deleteUsers,
    selectUsersPagination,
    selectUsersPage,
    selectUsersLoading,
    selectUsersDeleting,
    selectUsersSelectedRowIds,
    selectUsersRows,
} from "../data/users.slice";
import * as usersActions from "../data/users.slice";

export const useUsersModule = ({ filterState }) => {
    const dispatch = useAppDispatch();

    const selectedRowIds = useAppSelector(selectUsersSelectedRowIds);
    const pagination = useAppSelector(selectUsersPagination);
    const loading = useAppSelector(selectUsersLoading);
    const deleting = useAppSelector(selectUsersDeleting);
    const page = useAppSelector(selectUsersPage);
    const userList = useAppSelector(selectUsersRows);

    const getUserList = async () => {
        const action = await dispatch(fetchUsers({ filterState, page }));

        if (fetchUsers.rejected.match(action)) {
            toast.error(action.payload || "Error while fetching users");
        }
    };

    const handlePageChange = (pageNumber) => {
        dispatch(usersActions.setUsersPage(pageNumber));
    }

    const handleToggleRow = (rowId, checked) => {
        const currentSelectedRowIds = Array.isArray(selectedRowIds) ? selectedRowIds : [];
        const nextSelectedRowIds = checked
            ? [...new Set([...currentSelectedRowIds, rowId])]
            : currentSelectedRowIds.filter((item) => item !== rowId);
        dispatch(usersActions.setUsersSelection(nextSelectedRowIds));
    };

    const handleToggleAllRows = (checked) => {
        if (!checked) {
            dispatch(usersActions.clearUsersSelection());
            return;
        }

        dispatch(usersActions.setUsersSelection(
            userList.map((row) => row?._id ?? row?.id ?? row?.adminID).filter(Boolean)
        ))
    };

    const handleDeleteSelected = async () => {
        if (!selectedRowIds.length) {
            toast.error("Please select at least one user to delete.");
            return;
        }
        const action = await dispatch(deleteUsers(selectedRowIds));

        if (deleteUsers.fulfilled.match(action)) {
            toast.success(action.payload.message);
            await getUserList();
        }
        if (deleteUsers.rejected.match(action)) {
            toast.error(action.payload);
        }
    };

    const handleDeleteRow = async (row) => {
        const rowId = row?._id ?? row?.id ?? row?.adminID;
        if (!rowId) { toast.error("User id not found."); return; }
        if (!window.confirm("Delete this user?")) return;

        const action = await dispatch(deleteUsers([rowId]));

        if (deleteUsers.fulfilled.match(action)) {
            toast.success(action.payload.message);
            await getUserList();
        }
        if (deleteUsers.rejected.match(action)) {
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
        getUserList,
        handleToggleRow,
        handleToggleAllRows,
        handleDeleteSelected,
        handleDeleteRow,
    }
}