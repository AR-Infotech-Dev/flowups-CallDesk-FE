import { AlertTriangle, CheckCircle2, Clock, PackageSearch } from "lucide-react";

function ProductExpiryReportSummary({ summary = {} }) {
  const cards = [
    { label: "Total Products", value: summary.total || 0, icon: PackageSearch, tone: "neutral" },
    { label: "Expired", value: summary.expired || 0, icon: AlertTriangle, tone: "red" },
    { label: "Expiring Soon", value: summary.expiring_soon || 0, icon: Clock, tone: "amber" },
    { label: "Valid", value: summary.valid || 0, icon: CheckCircle2, tone: "green" },
  ];

  return (
    <div className="product-expiry-summary-grid">
      {cards.map((card) => (
        <SummaryCard key={card.label} {...card} />
      ))}
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, tone }) {
  return (
    <div className={`product-expiry-summary-card ${tone ? `is-${tone}` : ""}`}>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
      <Icon size={18} />
    </div>
  );
}

export default ProductExpiryReportSummary;
