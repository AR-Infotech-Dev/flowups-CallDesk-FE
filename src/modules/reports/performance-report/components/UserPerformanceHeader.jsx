import { ArrowLeft, Download, FileText } from "lucide-react";

export function UserPerformanceToolbar({ loading, canExport, onBack, onExportExcel, onExportPdf }) {
  return (
    <div className="performance-detail-toolbar">
      <button type="button" className="performance-button" onClick={onBack}>
        <ArrowLeft size={14} />
        Back
      </button>
      <div className="performance-detail-export">
        <button
          type="button"
          className="performance-button"
          disabled={!canExport || loading}
          onClick={onExportExcel}
        >
          <Download size={14} />
          Export Excel
        </button>
        {/* <button
          type="button"
          className="performance-button"
          disabled={!canExport || loading}
          onClick={onExportPdf}
        >
          <FileText size={14} />
          Export PDF
        </button> */}
      </div>
    </div>
  );
}
