import ModulePageLayout from "../shared/ModulePageLayout";
import ModulePagination from "../shared/ModulePagination";
import { WorkReportFilters } from "./components/WorkReportFilters";
import { WorkReportSummary } from "./components/WorkReportSummary";
import { WorkReportTable } from "./components/WorkReportTable";
import { useWorkReport } from "./hooks/useWorkReport";
import "./work-report.css";

function WorkReportModulePage() {
  const {
    filters,
    users,
    companies,
    rows,
    companySummary,
    pagination,
    loading,
    searchText,
    sortConfig,
    summaryCards,
    setPage,
    handleFilterChange,
    handleSearchChange,
    handleSearch,
    handleReset,
    handleSort,
  } = useWorkReport();

  return (
    <ModulePageLayout
      title="Work Report"
      description="View company-wise ticket work logs and employee effort."
      table={
        <div className="work-report-page">
          <WorkReportFilters
            filters={filters}
            users={users}
            companies={companies}
            searchText={searchText}
            onFilterChange={handleFilterChange}
            onSearchChange={handleSearchChange}
            onSearch={handleSearch}
            onReset={handleReset}
          />

          <WorkReportSummary
            summaryCards={summaryCards}
            companySummary={companySummary}
          />

          <WorkReportTable
            rows={rows}
            loading={loading}
            sortConfig={sortConfig}
            onSort={handleSort}
          />

          <ModulePagination pagination={pagination} onPageChange={setPage} />
        </div>
      }
    />
  );
}

export default WorkReportModulePage;
