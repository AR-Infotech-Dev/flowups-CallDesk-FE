import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import ModulePageLayout from "@/modules/shared/ModulePageLayout";
import ModulePagination from "@/modules/shared/ModulePagination";
import AttendanceLegend from "./components/AttendanceLegend";
import AttendanceMatrix from "./components/AttendanceMatrix";
import AttendanceMatrixControls from "./components/AttendanceMatrixControls";
import AttendanceSummaryCards from "./components/AttendanceSummaryCards";
import { downloadUserWiseAttendanceReport, fetchUserWiseAttendanceReport } from "./userWiseAttendanceReport.service";
import { buildAttendanceRows, buildDateColumns, buildMatrixSummary, formatMonthLabel, getMonthRange, shiftMonthRange } from "./userWiseAttendanceReport.utils";
import "./user-wise-attendance-report.css";

const getDefaultFilters = () => ({ ...getMonthRange(), searchText: "", company_id: "" });

function UserWiseAttendanceReport() {
  const [filters, setFilters] = useState(getDefaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(getDefaultFilters);
  const [report, setReport] = useState({ attendance: [], pagination: {}, summary: {}, company: {} });
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const dates = useMemo(() => buildDateColumns(filters.from_date, filters.to_date), [filters.from_date, filters.to_date]);
  const rows = useMemo(() => buildAttendanceRows(report.attendance, dates), [report.attendance, dates]);
  const summary = useMemo(() => buildMatrixSummary(rows), [rows]);

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  const loadReport = async (nextFilters = appliedFilters, page = 1) => {
    setLoading(true);
    const response = await fetchUserWiseAttendanceReport(nextFilters, page);
    setLoading(false);

    if (!response.success) {
      toast.error(response.message);
      return;
    }

    setReport(response);
  };

  const generateReport = () => {
    setAppliedFilters(filters);
    loadReport(filters, 1);
  };

  const changeMonth = (amount) => {
    const nextFilters = { ...filters, ...shiftMonthRange(filters.from_date, amount) };
    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
    loadReport(nextFilters, 1);
  };

  const exportReport = async () => {
    setExporting(true);
    const response = await downloadUserWiseAttendanceReport(appliedFilters);
    setExporting(false);
    if (!response.success) toast.error(response.message);
  };

  useEffect(() => {
    const initialFilters = getDefaultFilters();
    setAppliedFilters(initialFilters);
    loadReport(initialFilters, 1);
  }, []);

  const matrix = (
    <div className="uwa-matrix-panel">
      <AttendanceMatrix dates={dates} rows={rows} loading={loading} />
      <AttendanceLegend />
      <div className="uwa-matrix-footer">
        <ModulePagination pagination={report.pagination} onPageChange={(nextPage) => loadReport(appliedFilters, nextPage)} />
      </div>
    </div>
  );

  return (
    <ModulePageLayout
      title="Employee Attendance Matrix"
      description="Track employee attendance day by day for the selected month."
      controls={<AttendanceMatrixControls filters={filters} companies={[]} isSuperAdmin={false} loading={loading} monthLabel={formatMonthLabel(filters.from_date)} onChange={updateFilter} onMonthChange={changeMonth} onGenerate={generateReport} onExport={exportReport} exportDisabled={loading || exporting || !rows.length} />}
      cards={<AttendanceSummaryCards summary={summary} />}
      table={matrix}
    />
  );
}

export default UserWiseAttendanceReport;
