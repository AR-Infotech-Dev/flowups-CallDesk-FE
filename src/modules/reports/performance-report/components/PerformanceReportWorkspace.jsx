import { Eye, FileBarChart } from "lucide-react";
import ActivityTimeline from "./ActivityTimeline";
import PerformanceCards from "./PerformanceCards";
import PerformanceCharts from "./PerformanceCharts";
import PerformanceFilters from "./PerformanceFilters";
import PerformanceTable from "./PerformanceTable";

function PerformanceReportWorkspace({ filters, users, companies, statuses, loading, exporting, canExport, onFilterChange, onSearch, onReset, onExportExcel, onExportPdf, hasSelection, selectedUserName, report, searchText, sortConfig, onTicketSearchChange, onSortChange, onPageChange, onOpenDetail, }) {
  return (
    <div className="performance-workspace">
      <aside className="performance-filter-sidebar">
        <div className="performance-sidebar-head">
          <span>Filters</span>
          <strong>Performance Report</strong>
        </div>
        <PerformanceFilters
          filters={filters}
          users={users}
          companies={companies}
          statuses={statuses}
          loading={loading}
          exporting={exporting}
          canExport={canExport}
          onChange={onFilterChange}
          onSearch={onSearch}
          onReset={onReset}
          onExportExcel={onExportExcel}
          onExportPdf={onExportPdf}
        />
      </aside>

      <section className="performance-report-pane">
        {!hasSelection ? (
          <section className="performance-start-state">
            <FileBarChart size={30} />
            <h3>Select a user to view performance analytics</h3>
            <p>Choose filters from the left panel and run the report.</p>
          </section>
        ) : (
          <div className="performance-report-scroll">
            <div className="performance-report-actions">
              <div>
                <span>Selected user</span>
                <strong>{selectedUserName}</strong>
              </div>
              <button type="button" onClick={onOpenDetail}>
                <Eye size={14} />
                Detailed Report
              </button>
            </div>
            <PerformanceCards summary={report.summary} loading={loading} />
            <PerformanceCharts charts={report.charts} />
            <PerformanceTable
              rows={report.tickets}
              loading={loading}
              pagination={report.pagination}
              searchText={searchText}
              sortConfig={sortConfig}
              onSearchChange={onTicketSearchChange}
              onSortChange={onSortChange}
              onPageChange={onPageChange}
            />
            <ActivityTimeline activities={report.activities} loading={loading} />
          </div>
        )}
      </section>
    </div>
  );
}

export default PerformanceReportWorkspace;
