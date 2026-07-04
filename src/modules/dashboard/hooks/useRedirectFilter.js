import { useAppSelector, useModuleFilters } from "@store/hooks";
import { selectTicketsDefaultFilters } from "@modules/tickets/data/tickets.slice";
export const useRedirectFilter = () => {
    const ticketDefaultFilters = useAppSelector(selectTicketsDefaultFilters);
    const { setSearchText, applyFilterPayload } = useModuleFilters("tickets", [], ticketDefaultFilters);

    const applyTicketRedirectFilter = (label = '') => {
        switch (label) {
            case "Open Tickets":
                applyFilterPayload({
                    searchText: "Open",
                    filters: [],
                });
                break
            case "High Priority":
                applyFilterPayload({
                    searchText: "high",
                    filters: [],
                });
                break;
            case "Due Today":
                applyFilterPayload({
                    searchText: "",
                    filters: [
                        {
                            condition: "today",
                            field: "due_date",
                            type: "date",
                            value: ""
                        }
                    ],
                });
                break;
            case "New Today":
                applyFilterPayload({
                    searchText: "",
                    filters: [
                        {
                            field: "created_date",
                            condition: "today",
                            type: "date",
                            value: ""
                        }
                    ],
                });
                break;
            case "Resolved":
                applyFilterPayload({
                    searchText: "",
                    filters: [
                        {
                            field: "ticket_status",
                            condition: "equal_to",
                            type: "select",
                            value: "208"
                        },
                        {
                            field: "modified_date",
                            condition: "today",
                            type: "select",
                            value: ""
                        }
                    ],
                });
                break;
            default:
                break;
        }
    }
    return {
        applyTicketRedirectFilter
    };
};
