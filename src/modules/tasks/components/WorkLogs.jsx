import { useEffect, useMemo, useState } from "react";
import { AlarmClock, Clock, Hourglass, Play, Square, Timer, X } from "lucide-react";
import { toast } from "react-toastify";
import { makeRequest } from "../../../api/httpClient";
import FlyoutPanel from "../../../components/ui/FlyoutPanel";
import ActionButton from "../../../components/ui/ActionButton";
import Spinner from "../../../components/ui/Spinner";
import { findActiveWorkLog, getWorkLogEnd, getWorkLogId, getWorkLogStart } from "../utils/workLogStatus";

function formatMinutes(value = 0) {
  const minutes = Number(value || 0);
  if (!minutes) return "0m";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return [hours ? `${hours}h` : "", mins ? `${mins}m` : ""].filter(Boolean).join(" ");
}

function toLocalDateTimeInputValue(date = new Date()) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function toDateTimeInputValue(value = "") {
  if (!value) return "";
  return String(value).replace(" ", "T").slice(0, 16);
}

function toMysqlDateTime(value = "") {
  if (!value) return "";
  return value.replace("T", " ") + ":00";
}

function calculateSpentMinutes(startValue = "", endValue = "") {
  const start = new Date(String(startValue).replace(" ", "T"));
  const end = new Date(String(endValue).replace(" ", "T"));
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
}

function WorkLogs({ ticket = {}, ticket_id }) {
  const authId = localStorage.getItem("_auth_id");
  const resolvedTicketId = ticket_id || ticket?.ticket_id;
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({});
  const [activeLog, setActiveLog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    work_end_at: toLocalDateTimeInputValue(),
    spent_minutes: 0,
    work_details: "",
  });

  const canAddLog = useMemo(() => {
    if (summary?.can_add_log) return summary.can_add_log === "Y";
    return Number(ticket?.assignee || 0) === Number(authId || 0);
  }, [summary?.can_add_log, ticket?.assignee, authId]);

  const fetchLogs = async () => {
    if (!resolvedTicketId) return;

    try {
      setLoading(true);
      const res = await makeRequest("tickets/work-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_id: resolvedTicketId }),
      });

      if (res?.success) {
        const nextLogs = res?.data || [];
        setLogs(nextLogs);
        setSummary(res?.summary || {});
        setActiveLog(res?.summary?.active_work_log || findActiveWorkLog(nextLogs));
        return;
      }

      setLogs([]);
      setSummary({});
      setActiveLog(null);
    } catch {
      setLogs([]);
      setSummary({});
      setActiveLog(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [resolvedTicketId]);

  const handleStartWork = async () => {
    if (!canAddLog || !resolvedTicketId) return;
    if (activeLog) {
      toast.error("Work already started. Please end current work first.");
      return;
    }

    try {
      setSaving(true);
      const res = await makeRequest("tickets/work-logs/create", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_id: resolvedTicketId,
          work_status: "working",
        }),
      });

      if (res?.success) {
        toast.success("Work started");
        await fetchLogs();
        return;
      }

      toast.error(res?.message || res?.msg || "Unable to start work");
    } catch (error) {
      toast.error(error.message || "Unable to start work");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEndWork = () => {
    if (!activeLog) {
      toast.error("Please start work first");
      return;
    }

    const nextEndAt = toLocalDateTimeInputValue();
    setFormData({
      work_end_at: nextEndAt,
      spent_minutes: calculateSpentMinutes(getWorkLogStart(activeLog), nextEndAt),
      work_details: activeLog?.work_details || "",
    });
    setIsOpen(true);
  };

  const handleEndAtChange = (value) => {
    setFormData((current) => ({
      ...current,
      work_end_at: value,
      spent_minutes: calculateSpentMinutes(getWorkLogStart(activeLog), value),
    }));
  };

  const handleEndWork = async () => {
    if (!activeLog) {
      toast.error("No active work log found");
      return;
    }

    if (!formData.work_end_at || !formData.work_details.trim()) {
      toast.error("End time and work details required");
      return;
    }

    const spentMinutes = calculateSpentMinutes(getWorkLogStart(activeLog), formData.work_end_at);
    if (!spentMinutes) {
      toast.error("End time must be after start time");
      return;
    }

    try {
      setSaving(true);
      const res = await makeRequest("tickets/work-logs/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          work_log_id: getWorkLogId(activeLog),
          ticket_id: resolvedTicketId,
          work_details: formData.work_details,
          work_status: "completed",
        }),
      });

      if (res?.success) {
        toast.success("Work ended");
        setIsOpen(false);
        await fetchLogs();
        return;
      }

      toast.error(res?.message || res?.msg || "Unable to end work");
    } catch (error) {
      toast.error(error.message || "Unable to end work");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <SummaryCard icon={Clock} label="Expected" value={formatMinutes(summary.expected_minutes || ticket.expected_minutes)} />
          <SummaryCard icon={Timer} label="Logged" value={formatMinutes(summary.logged_minutes)} />
          <SummaryCard icon={Hourglass} label="Remaining" value={formatMinutes(summary.remaining_minutes)} tone="slate" />
          <SummaryCard icon={AlarmClock} label="Over Time" value={formatMinutes(summary.overtime_minutes)} tone={Number(summary.overtime_minutes || 0) > 0 ? "warning" : "slate"} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-600">Work Logs ({logs.length})</h3>
          {activeLog ? (
            <button
              type="button"
              onClick={handleOpenEndWork}
              disabled={!canAddLog || saving}
              className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Square size={13} />
              End Work
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartWork}
              disabled={!canAddLog || saving}
              className="inline-flex items-center gap-1 rounded-md bg-blue-700 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Play size={13} />
              Start Work
            </button>
          )}
        </div>

        {activeLog ? (
          <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
            Work started at {toDateTimeInputValue(getWorkLogStart(activeLog)).replace("T", " ") || "-"}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-md border border-slate-200 bg-white p-4 text-center text-sm text-slate-500">Loading work logs...</div>
        ) : null}

        {!loading && !logs.length ? (
          <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            No work logs yet
          </div>
        ) : null}

        <div className="space-y-2">
          {logs.map((log) => (
            <div key={getWorkLogId(log)} className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">{log.employee_name || "Employee"}</p>
                  <p className="text-xs text-slate-400">{log.work_date || "-"} · {log.work_time || "-"}</p>
                </div>
                <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                  {getWorkLogEnd(log) ? formatMinutes(log.spent_minutes) : "In progress"}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {log.work_details || "Work started. Details will be added when work is ended."}
              </p>
            </div>
          ))}
        </div>
      </div>

      <FlyoutPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="End Work"
        closeButton={
          <button className="flyout-close" onClick={() => setIsOpen(false)} aria-label="Close panel">
            <X size={18} />
          </button>
        }
        footer={
          <div className="flex w-full justify-end gap-3">
            <ActionButton variant="flyoutSecondary" onClick={() => setIsOpen(false)} disabled={saving}>Cancel</ActionButton>
            <ActionButton variant="flyoutSecondary" onClick={handleEndWork} disabled={saving}>
              {saving ? <Spinner /> : null} End Work
            </ActionButton>
          </div>
        }
      >
        <div className="flyout-form-shell px-4 py-3">
          <div className="grid grid-cols-12 gap-4">
            <FieldWrap label="Work Details" span={12}>
              <textarea
                value={formData.work_details}
                onChange={(event) => setFormData((current) => ({ ...current, work_details: event.target.value }))}
                placeholder="Enter work details"
                className="min-h-[120px] w-full resize-none rounded bg-gray-100 px-3 py-2 text-sm text-slate-600 outline-none"
              />
            </FieldWrap>
          </div>
        </div>
      </FlyoutPanel>
    </>
  );
}

function SummaryCard({ icon: Icon, label, value, tone = "slate" }) {
  const toneMap = {
    warning: {
      card: "border-slate-200 bg-white",
      icon: "text-amber-500",
      value: "text-amber-800",
    },
    slate: {
      card: "border-slate-200 bg-white",
      icon: "text-slate-400",
      value: "text-slate-700",
    },
  };
  const styles = toneMap[tone] || toneMap.slate;

  return (
    <div className={`min-h-[58px] min-w-0 rounded-md border px-2.5 py-2 shadow-sm ${styles.card}`}>
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold text-slate-500">{label}</p>
          <p className={`mt-1 break-words text-[15px] font-bold leading-none ${styles.value}`}>{value}</p>
        </div>
        <span className={`flex h-5 w-5 shrink-0 items-center justify-center ${styles.icon}`}>
          <Icon size={14} />
        </span>
      </div>
    </div>
  );
}

function FieldWrap({ label, span = 12, children }) {
  return (
    <label className={`col-span-12 md:col-span-${span} flex flex-col gap-1 text-sm font-medium text-slate-600`}>
      {label}
      {children}
    </label>
  );
}

export default WorkLogs;
