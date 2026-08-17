import { useEffect, useRef, useState } from "react";
import { CalendarClock, CheckCircle2, Download, RefreshCcw, Send, X, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import FlyoutPanel from "@components/ui/FlyoutPanel";
import ActionButton from "@components/ui/ActionButton";
import Spinner from "@components/ui/Spinner";
import { getQuotationFollowups, getQuotationHistory, getQuotationPreview } from "../data/quotations.service";

function QuotationPreviewFlyout({ isOpen, quotation, onClose, onSend, onStatusChange, onRevise, onScheduleFollowup, onCompleteFollowup }) {
  const iframeRef = useRef(null);
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [followups, setFollowups] = useState([]);
  const [history, setHistory] = useState([]);

  const loadFollowups = async () => {
    if (!quotation?.quotation_id) return;
    const response = await getQuotationFollowups(quotation.quotation_id);
    if (response?.success) setFollowups(response.data || []);
  };

  const loadHistory = async () => {
    if (!quotation?.quotation_id) return;
    const response = await getQuotationHistory(quotation.quotation_id);
    if (response?.success) setHistory(response.data || []);
  };

  useEffect(() => {
    if (!isOpen || !quotation?.quotation_id) return;
    let active = true;
    setLoading(true);
    setHtml("");

    getQuotationPreview(quotation.quotation_id)
      .then((response) => {
        if (!active) return;
        if (!response?.success) {
          toast.error(response?.message || "Unable to load quotation preview");
          return;
        }
        setHtml(response?.data?.html || "");
      })
      .finally(() => active && setLoading(false));
    loadFollowups();
    loadHistory();

    return () => { active = false; };
  }, [isOpen, quotation?.quotation_id]);

  const printPreview = () => iframeRef.current?.contentWindow?.print();
  const status = String(quotation?.quotation_status || "draft").toLowerCase();

  const runAction = async (key, action) => {
    if (typeof action !== "function") return;
    setActionLoading(key);
    try {
      const completed = await action();
      if (completed) await Promise.all([loadFollowups(), loadHistory()]);
    } finally {
      setActionLoading("");
    }
  };

  return (
    <FlyoutPanel
      isOpen={isOpen}
      onClose={onClose}
      title={`Quotation Preview ${quotation?.quotation_no || ""}`}
      panelClassName="quotation-preview-flyout"
      closeButton={<button className="flyout-close" onClick={onClose} type="button"><X size={18} /></button>}
      footer={(
        <div className="quotation-footer-actions">
          <ActionButton variant="flyoutSecondary" onClick={onClose}>Close</ActionButton>
        </div>
      )}
    >
      <div className="quotation-preview-layout">
        <div className="quotation-preview-document">
          {loading ? (
            <div className="quotation-preview-loading"><Spinner /></div>
          ) : html ? (
            <iframe ref={iframeRef} srcDoc={html} title="Quotation preview" className="quotation-preview-frame shadow" />
          ) : (
            <div className="quotation-preview-loading">Preview is not available.</div>
          )}
        </div>

        <aside className="quotation-preview-actions">
          <h3>Actions</h3>

          {status === "draft" && (
            <button className="quotation-preview-action action-send" disabled={Boolean(actionLoading)} onClick={() => runAction("send", () => onSend?.(quotation))} type="button">
              <Send size={16} /> {actionLoading === "send" ? "Sending..." : "Send Quotation"}
            </button>
          )}

          {status === "sent" && (
            <>
              <button className="flex items-center p-2 pt-2.5 rounded-md text-white gap-1.5 justify-center text-sm font-bold bg-green-600" disabled={Boolean(actionLoading)} onClick={() => runAction("approve", () => onStatusChange?.(quotation, "approved"))} type="button">
                <CheckCircle2 size={16} /> Approve
              </button>
              <button className="flex items-center p-2 pt-2.5 rounded-md text-white gap-1.5 justify-center text-sm font-bold  bg-red-600" disabled={Boolean(actionLoading)} onClick={() => runAction("reject", () => onStatusChange?.(quotation, "rejected"))} type="button">
                <XCircle size={16} /> Reject
              </button>
            </>
          )}

          {["sent", "rejected", "revision_required"].includes(status) && (
            <button className="flex items-center p-2 pt-2.5 rounded-md text-white gap-1.5 justify-center text-sm font-bold bg-orange-500 action-revise" disabled={Boolean(actionLoading)} onClick={() => runAction("revise", () => onRevise?.(quotation))} type="button">
              <RefreshCcw size={16} /> Create Revision
            </button>
          )}

          {status === "sent" && (
            <button className="quotation-preview-action action-followup" disabled={Boolean(actionLoading)} onClick={() => runAction("followup", () => onScheduleFollowup?.(quotation))} type="button">
              <CalendarClock size={16} /> Schedule Follow-up
            </button>
          )}

          <button className="quotation-preview-action action-download" disabled={!html || loading} onClick={printPreview} type="button">
            <Download size={16} /> Print / Save PDF
          </button>

          <div className="quotation-followup-list">
            <h4>Follow-ups</h4>
            {followups.length ? followups.slice(0, 4).map((followup) => (
              <div className="quotation-followup-item" key={followup.followup_id}>
                <strong>{String(followup.followup_type || "call").replaceAll("_", " ")}</strong>
                <small>{new Date(followup.followup_date).toLocaleString("en-IN")}</small>
                <span className={`quotation-followup-status ${followup.followup_status}`}>{followup.followup_status}</span>
                {followup.followup_status === "pending" && (
                  <button type="button" onClick={() => runAction(`complete-${followup.followup_id}`, () => onCompleteFollowup?.(quotation, followup))}>Complete</button>
                )}
              </div>
            )) : <p>No follow-ups yet.</p>}
          </div>

          <div className="quotation-history-list">
            <h4>History</h4>
            {history.length ? history.map((entry) => (
              <div className="quotation-history-item" key={entry.history_id || `${entry.changed_date}-${entry.new_status}`}>
                <span className={`quotation-history-dot status-${entry.new_status || "draft"}`} />
                <div>
                  <strong>
                    {entry.old_status
                      ? `${String(entry.old_status).replaceAll("_", " ")} → ${String(entry.new_status).replaceAll("_", " ")}`
                      : String(entry.new_status || "created").replaceAll("_", " ")}
                  </strong>
                  {entry.remarks ? <p>{entry.remarks}</p> : null}
                  <small>{new Date(entry.changed_date).toLocaleString("en-IN")} · {entry.changed_by_name || "User"}</small>
                </div>
              </div>
            )) : <p>No history available.</p>}
          </div>
        </aside>
      </div>
    </FlyoutPanel>
  );
}

export default QuotationPreviewFlyout;
