import { Building2 } from "lucide-react";
import { formatWorkMinutes } from "../utils/workReport.utils";

export function WorkReportSummary({ summaryCards = [], companySummary = [] }) {
  return (
    <>
      <div className="work-report-summary-grid">
        {summaryCards.map((card) => (
          <SummaryCard key={card.label} {...card} />
        ))}
      </div>

      {companySummary.length ? (
        <div className="work-report-panel">
          <div className="work-report-panel-title">
            <Building2 size={15} />
            Company Summary
          </div>
          <div className="work-report-company-grid">
            {companySummary.map((item) => (
              <div key={item.company_id || item.company_name} className="work-report-company-card">
                <p>{item.company_name || "-"}</p>
                <strong>{formatWorkMinutes(item.total_minutes)} <span>({item.total_logs} logs)</span></strong>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

function SummaryCard({ label, value, icon: Icon }) {
  return (
    <div className="work-report-summary-card">
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
      <Icon size={17} />
    </div>
  );
}
