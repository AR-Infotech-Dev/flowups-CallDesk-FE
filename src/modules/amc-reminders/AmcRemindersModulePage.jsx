import { useEffect, useMemo, useState } from "react";
import { Mail, X } from "lucide-react";
import { toast } from "react-toastify";

import { fetchAmcReminderCustomers, sendAmcReminder } from "../../api/amcReminderController";
import useMenuPermissions from "../../auth/useMenuPermissions";
import ActionButton from "../../components/ui/ActionButton";
import DynamicFilter from "../../components/DynamicFilter";
import ResizableTable from "../../components/table/ResizableTable";
import Spinner from "../../components/ui/Spinner";
import { useModuleFilters } from "../../store/hooks";
import { defaultSortConfig, getNextSortConfig } from "../../utils/sorting";
import ModuleControls from "../shared/ModuleControls";
import ModulePageLayout from "../shared/ModulePageLayout";
import ModulePagination from "../shared/ModulePagination";
import { amcReminderFallbackColumns, amcReminderModuleSchema } from "./data/module.schema";

const filterFields = [
  { label: "Customer", value: "name", type: "text" },
  { label: "Email", value: "email", type: "text" },
  { label: "Mobile No", value: "mobile_no", type: "text" },
  { label: "Company", value: "company_name", type: "text" },
  { label: "AMC Expiry", value: "amc_end_date", type: "date" },
];

function getRowIdentifier(row, index) {
  return row?.customer_id || row?.id || row?.client_id || `amc-reminder-${index}`;
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function renderDaysLeft(value) {
  if (value === null || value === undefined || value === "") return "-";

  const days = Number(value);
  const className =
    days < 0
      ? "amc-expiry-chip expired"
      : days <= 15
        ? "amc-expiry-chip urgent"
        : days <= 30
          ? "amc-expiry-chip warning"
          : "amc-expiry-chip";

  return (
    <span className={className}>
      {days < 0 ? `${Math.abs(days)} overdue` : `${days} days`}
    </span>
  );
}

function renderCell(column, row, onOpenReminder, sendingCustomerId) {
  const value = row?.[column.key];

  if (column.key === "actions") {
    const customerId = row?.customer_id;
    const isSending = String(sendingCustomerId || "") === String(customerId || "");
    const sentToday = Boolean(Number(row?.sent_today || 0));

    return (
      <ActionButton
        type="button"
        variant="ghostPrimary"
        className="amc-reminder-send-button"
        onClick={() => onOpenReminder(row)}
        disabled={!customerId || isSending || sentToday}
        title={sentToday ? "Reminder already sent today" : "Send AMC reminder"}
      >
        {isSending ? <Spinner /> : <Mail size={14} />}
        {sentToday ? "Sent Today" : "Send Reminder"}
      </ActionButton>
    );
  }

  if (column.key === "name") {
    return (
      <div className="person-cell">
        <span className="person-avatar avatar-2">{String(value || "?").charAt(0)}</span>
        <span className="text-overflow">{value || "-"}</span>
        <span className="table-amc-chip">AMC</span>
      </div>
    );
  }

  if (column.key === "email") {
    return <div className="text-overflow table-text-clip">{value || "-"}</div>;
  }

  if (column.key === "company_name") {
    return <span className="tag lilac text-overflow">{value || "-"}</span>;
  }

  if (column.key === "amc_start_date" || column.key === "amc_end_date" || column.key === "last_reminder_sent_at") {
    return formatDate(value);
  }

  if (column.key === "days_until_expiry") {
    return renderDaysLeft(value);
  }

  if (column.key === "support_call_count" || column.key === "reminder_count") {
    return Number(value || 0).toLocaleString("en-IN");
  }

  return value ?? "-";
}

function ReminderConfirmModal({
  customer,
  includeReport,
  sending,
  onIncludeReportChange,
  onClose,
  onConfirm,
}) {
  if (!customer) return null;

  return (
    <div className="amc-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="amc-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="amc-reminder-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="amc-modal-header">
          <div>
            <h3 id="amc-reminder-modal-title">Send AMC Reminder</h3>
            <p>{customer.name || "Selected customer"}</p>
          </div>
          <button type="button" className="amc-modal-close" onClick={onClose} disabled={sending}>
            <X size={16} />
          </button>
        </div>

        <div className="amc-modal-body">
          <div className="amc-summary-grid">
            <div>
              <span>Email</span>
              <strong>{customer.email || "-"}</strong>
            </div>
            <div>
              <span>AMC Expiry</span>
              <strong>{formatDate(customer.amc_end_date)}</strong>
            </div>
            <div>
              <span>Support Calls</span>
              <strong>{Number(customer.support_call_count || 0).toLocaleString("en-IN")}</strong>
            </div>
            <div>
              <span>Previous Reminders</span>
              <strong>{Number(customer.reminder_count || 0).toLocaleString("en-IN")}</strong>
            </div>
          </div>

          <label className="amc-report-toggle">
            <input
              type="checkbox"
              checked={includeReport}
              onChange={(event) => onIncludeReportChange(event.target.checked)}
              disabled={sending}
            />
            <span>
              <strong>Include report</strong>
              <small>Attach Excel support-call report for this AMC period.</small>
            </span>
          </label>
        </div>

        <div className="amc-modal-actions">
          <ActionButton type="button" onClick={onClose} disabled={sending}>
            Cancel
          </ActionButton>
          <ActionButton type="button" variant="primary" onClick={onConfirm} disabled={sending || !customer.email}>
            {sending ? <Spinner /> : <Mail size={15} />}
            Send Reminder
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

function AmcRemindersModulePage({ menu_id }) {
  const resolvedMenuID = menu_id || amcReminderModuleSchema.menu_id || null;
  const permissions = useMenuPermissions(resolvedMenuID);
  const canSendReminder = permissions.canAdd || permissions.canEdit;

  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [includeReport, setIncludeReport] = useState(false);
  const [sendingCustomerId, setSendingCustomerId] = useState(null);

  const { filterState, setSearchText, applyFilterPayload, setSort, clearFilters } = useModuleFilters(
    "amc-reminders",
    customers
  );

  const sortConfig = {
    key: filterState.order_by || "amc_end_date",
    direction: String(filterState.order || defaultSortConfig.direction).toLowerCase(),
  };

  const defaultVisibleColumnKeys = useMemo(
    () => amcReminderFallbackColumns.map((column) => column.key),
    []
  );

  const getReminderList = async () => {
    setLoading(true);

    const response = await fetchAmcReminderCustomers({
      page,
      searchText: filterState.searchText,
      filters: filterState.filters,
      order: filterState.order || "ASC",
      order_by: filterState.order_by || "amc_end_date",
    });

    setLoading(false);

    if (response?.success) {
      setCustomers(response.data || []);
      setPagination(response.pagination || {});
      return;
    }

    toast.error(response?.message || "Error while fetching AMC reminders");
  };

  const openReminderModal = (customer) => {
    if (!canSendReminder) {
      toast.error("You do not have permission to send reminders.");
      return;
    }

    if (!customer?.email) {
      toast.error("Customer email is required before sending reminder.");
      return;
    }

    if (Number(customer?.sent_today || 0)) {
      toast.error("Reminder already sent today for this customer.");
      return;
    }

    setSelectedCustomer(customer);
    setIncludeReport(false);
  };

  const closeReminderModal = () => {
    if (sendingCustomerId) return;

    setSelectedCustomer(null);
    setIncludeReport(false);
  };

  const handleSendReminder = async () => {
    const customerId = selectedCustomer?.customer_id;
    if (!customerId) {
      toast.error("Customer id is missing.");
      return;
    }

    setSendingCustomerId(customerId);

    const response = await sendAmcReminder({
      customerId,
      includeReport,
    });

    setSendingCustomerId(null);

    if (response?.success) {
      toast.success(response?.message || "AMC reminder sent successfully.");
      setSelectedCustomer(null);
      setIncludeReport(false);
      await getReminderList();
      return;
    }

    toast.error(response?.message || "Unable to send AMC reminder.");
  };

  useEffect(() => {
    getReminderList();
  }, [page, filterState.searchText, filterState.order, filterState.order_by, JSON.stringify(filterState.filters)]);

  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
  }, [filterState.searchText, filterState.order, filterState.order_by, JSON.stringify(filterState.filters)]);

  return (
    <>
      <ModulePageLayout
        title={amcReminderModuleSchema.title}
        description={amcReminderModuleSchema.description}
        controls={
          <ModuleControls
            loading={loading}
            onRefresh={getReminderList}
            showTraditional
            canCreate={false}
            canDelete={false}
            filter={
              <DynamicFilter
                fields={filterFields}
                savedFilters={amcReminderModuleSchema.savedFilters}
                onSearch={setSearchText}
                onApplyFilters={applyFilterPayload}
                onSaveFilter={() => { }}
                onDeleteFilter={() => { }}
                onSelectSavedFilter={() => { }}
                onClearFilters={clearFilters}
              />
            }
          />
        }
        table={
          <ResizableTable
            loading={loading}
            menuId={resolvedMenuID}
            columns={amcReminderFallbackColumns}
            rows={customers}
            storageKey="amc-reminders-module-column-widths"
            defaultVisibleColumnKeys={defaultVisibleColumnKeys}
            allowSelection={false}
            sortConfig={sortConfig}
            onSortChange={(columnKey) => {
              if (columnKey === "actions") return;

              const nextSort = getNextSortConfig(sortConfig, columnKey);
              if (page !== 1) {
                setPage(1);
              }
              setSort({
                order_by: nextSort.key,
                order: nextSort.direction.toUpperCase(),
              });
            }}
            renderRow={(row, index, columns) => (
              <tr key={getRowIdentifier(row, index)} className="group table-row-amc-active">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={column.key === "actions" ? "amc-action-cell" : column.className || ""}
                    style={{
                      width: column.currentWidth,
                      minWidth: column.currentWidth,
                      maxWidth: column.currentWidth,
                    }}
                  >
                    {renderCell(column, row, openReminderModal, sendingCustomerId)}
                  </td>
                ))}
              </tr>
            )}
          />
        }
        footer={<ModulePagination pagination={pagination} onPageChange={setPage} />}
      />

      <ReminderConfirmModal
        customer={selectedCustomer}
        includeReport={includeReport}
        sending={Boolean(sendingCustomerId)}
        onIncludeReportChange={setIncludeReport}
        onClose={closeReminderModal}
        onConfirm={handleSendReminder}
      />
    </>
  );
}

export default AmcRemindersModulePage;
