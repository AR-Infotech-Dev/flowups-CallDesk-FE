export const TEXT_CONDITIONS = [
    { label: "Is In", value: "is_in" },
    { label: "Start With", value: "start_with" },
    { label: "End With", value: "end_with" },
    { label: "Equal To", value: "equal_to" },
    { label: "Not Equal To", value: "not_equal_to" },
    { label: "Is Empty", value: "is_empty" },
    { label: "Is Not Empty", value: "is_not_empty" },
];

export const DATE_CONDITIONS = [
    { label: "Today", value: "today" },
    { label: "Tomorrow", value: "tomorrow" },
    { label: "Yesterday", value: "yesterday" },
    { label: "Exact Date", value: "exact_date" },
    { label: "This Month", value: "this_month" },
    { label: "This Week", value: "this_week" },
    { label: "Date Range", value: "date_range" },
    { label: "Is Empty", value: "is_empty" },
    { label: "Is Not Empty", value: "is_not_empty" },
];

export const SELECT_CONDITIONS = [
    { label: "Equal To", value: "equal_to" },
    { label: "Not Equal To", value: "not_equal_to" },
    { label: "Is Empty", value: "is_empty" },
    { label: "Is Not Empty", value: "is_not_empty" },
];

export const EMPTY_VALUE_CONDITIONS = ["is_empty", "is_not_empty"];

export const VALUELESS_DATE_CONDITIONS = [
    "today",
    "tomorrow",
    "yesterday",
    "this_month",
    "this_week",
];

export const DEFAULT_CONDITION_BY_TYPE = {
    text: "is_in",
    number: "equal_to",
    date: "exact_date",
    select: "equal_to",
    enum: "equal_to",
};
