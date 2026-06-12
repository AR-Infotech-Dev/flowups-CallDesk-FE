import { useEffect, useState } from "react";
import { CalendarPlus, CheckCircle2, Clock, MapPin, X } from "lucide-react";
import { toast } from "react-toastify";
import { makeRequest } from "../../../api/httpClient";
import FlyoutPanel from "../../../components/ui/FlyoutPanel";
import ActionButton from "../../../components/ui/ActionButton";
import Spinner from "../../../components/ui/Spinner";

function toLocalDateTimeInputValue(date = new Date()) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function toMysqlDateTime(value = "") {
  if (!value) return "";
  return value.replace("T", " ") + ":00";
}

function formatDateTime(value = "") {
  if (!value) return "-";
  const date = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isPastScheduledTime(value = "") {
  if (!value) return false;
  const date = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return false;
  return new Date() >= date;
}

function Visits({ ticket = {}, ticket_id }) {
  const resolvedTicketId = ticket_id || ticket?.ticket_id;
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    visit_scheduled_at: toLocalDateTimeInputValue(),
    visit_details: "",
  });

  const fetchVisits = async () => {
    if (!resolvedTicketId) return;

    try {
      setLoading(true);
      const res = await makeRequest("tickets/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_id: resolvedTicketId }),
      });

      if (res?.success) {
        setVisits(res?.data || []);
        return;
      }

      setVisits([]);
    } catch {
      setVisits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, [resolvedTicketId]);

  const openSchedule = () => {
    setFormData({
      visit_scheduled_at: toLocalDateTimeInputValue(),
      visit_details: "",
    });
    setIsOpen(true);
  };

  const handleSchedule = async () => {
    if (!resolvedTicketId) return;

    if (!formData.visit_scheduled_at) {
      toast.error("Visit date and time is required");
      return;
    }
    if (!formData.visit_details) {
      toast.error("Visit details is required");
      return;
    }

    try {
      setSaving(true);
      const res = await makeRequest("tickets/visits/create", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_id: resolvedTicketId,
          employee_id: ticket?.assignee || null,
          visit_scheduled_at: toMysqlDateTime(formData.visit_scheduled_at),
          visit_details: formData.visit_details,
        }),
      });

      if (res?.success) {
        toast.success(res?.message || "Visit scheduled");
        setIsOpen(false);
        await fetchVisits();
        return;
      }

      toast.error(res?.message || res?.msg || "Unable to schedule visit");
    } catch (error) {
      toast.error(error.message || "Unable to schedule visit");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkVisited = async (visit) => {
    if (!resolvedTicketId || !visit?.visit_id) return;

    try {
      setSaving(true);
      const res = await makeRequest("tickets/visits/visited", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_id: resolvedTicketId,
          visit_id: visit.visit_id,
          visit_details: visit.visit_details || "",
        }),
      });

      if (res?.success) {
        toast.success(res?.message || "Visit marked as visited");
        await fetchVisits();
        return;
      }

      toast.error(res?.message || res?.msg || "Unable to update visit");
    } catch (error) {
      toast.error(error.message || "Unable to update visit");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-600">Visits ({visits.length})</h3>
          <button
            type="button"
            onClick={openSchedule}
            disabled={saving}
            className="inline-flex items-center gap-1 rounded-md bg-blue-700 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <CalendarPlus size={13} />
            Schedule Visit
          </button>
        </div>

        {loading ? (
          <div className="rounded-md border border-slate-200 bg-white p-4 text-center text-sm text-slate-500">Loading visits...</div>
        ) : null}

        {!loading && !visits.length ? (
          <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            No visits scheduled yet
          </div>
        ) : null}

        <div className="space-y-2">
          {visits.map((visit) => {
            const isVisited = String(visit.visit_status || "").toLowerCase() === "visited";
            const canMarkVisited = isPastScheduledTime(visit.visit_scheduled_at);
            const visit_details_array = (visit.visit_details).split('\n');
            // console.log('visit_details_array');
            
            return (
              <div key={visit.visit_id} className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700">{visit.employee_name || "Employee"}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                      <Clock size={12} />
                      {formatDateTime(visit.visit_scheduled_at)}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${isVisited ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    {isVisited ? "Visited" : "Scheduled"}
                  </span>
                </div>

                {visit.visited_at ? (
                  <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 size={12} />
                    Visited at {formatDateTime(visit.visited_at)}
                  </p>
                ) : null}

                <p className="mt-2 flex items-center gap-1 text-sm leading-6 text-slate-600">
                  <MapPin size={14} className="shrink-0 text-slate-400" />
                  <span>{visit.visit_details || "Visit scheduled. Details not added yet."}</span>
                </p>

                {/* {!isVisited ? (
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleMarkVisited(visit)}
                      disabled={saving || !canMarkVisited}
                      title={canMarkVisited ? "Mark visit as completed" : "Visit can be marked after scheduled time"}
                      className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      <CheckCircle2 size={13} />
                      Mark Visited
                    </button>
                  </div>
                ) : null} */}
              </div>
            );
          })}
        </div>
      </div>

      <FlyoutPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Schedule Visit"
        closeButton={
          <button className="flyout-close" onClick={() => setIsOpen(false)} aria-label="Close panel">
            <X size={18} />
          </button>
        }
        footer={
          <div className="flex w-full justify-end gap-3">
            <ActionButton variant="flyoutSecondary" onClick={() => setIsOpen(false)} disabled={saving}>Cancel</ActionButton>
            <ActionButton variant="flyoutSecondary" onClick={handleSchedule} disabled={saving}>
              {saving ? <Spinner /> : null} Schedule
            </ActionButton>
          </div>
        }
      >
        <div className="flyout-form-shell px-4 py-3">
          <div className="grid grid-cols-12 gap-4">
            <label className="col-span-12 flex flex-col gap-1 text-sm font-medium text-slate-600">
              Visit Date & Time
              <input
                type="datetime-local"
                value={formData.visit_scheduled_at}
                onChange={(event) => setFormData((current) => ({ ...current, visit_scheduled_at: event.target.value }))}
                className="rounded bg-gray-100 px-3 py-2 text-sm text-slate-600 outline-none"
              />
            </label>
            <label className="col-span-12 flex flex-col gap-1 text-sm font-medium text-slate-600">
              Visit Details
              <textarea
                value={formData.visit_details}
                onChange={(event) => setFormData((current) => ({ ...current, visit_details: event.target.value }))}
                placeholder="Enter visit details"
                className="min-h-[120px] w-full resize-none rounded bg-gray-100 px-3 py-2 text-sm text-slate-600 outline-none"
              />
            </label>
          </div>
        </div>
      </FlyoutPanel>
    </>
  );
}

export default Visits;
