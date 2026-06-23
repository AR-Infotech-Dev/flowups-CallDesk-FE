import { Clock, FileText, Ticket, Users } from "lucide-react";

export const formatWorkMinutes = (value = 0) => {
  const minutes = Number(value || 0);
  if (!minutes) return "0m";

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return [hours ? `${hours}h` : "", mins ? `${mins}m` : ""].filter(Boolean).join(" ");
};

export const getNextWorkReportSort = (currentSort, key) => ({
  key,
  direction: currentSort.key === key && currentSort.direction === "ASC" ? "DESC" : "ASC",
});

export const buildWorkReportSummaryCards = (summary = {}) => [
  { label: "Total Logs", value: summary.total_logs || 0, icon: FileText },
  { label: "Total Time", value: formatWorkMinutes(summary.total_minutes), icon: Clock },
  { label: "Employees", value: summary.employee_count || 0, icon: Users },
  { label: "Tickets", value: summary.ticket_count || 0, icon: Ticket },
];

export const workReportTableHeaders = [
  ["work_start_at", "Date / Time"],
  ["employee_name", "Employee"],
  ["ticket_no", "Ticket"],
  ["client_name", "Client"],
  ["company_name", "Company"],
  ["spent_minutes", "Spent"],
  ["work_details", "Work Details"],
];
