import { BriefcaseBusiness, ChartNoAxesCombined, UserCheck, UserX } from "lucide-react";

const cards = [
  { key: "presentToday", label: "Present Today", icon: UserCheck, tone: "green" },
  { key: "absentToday", label: "Absent Today", icon: UserX, tone: "red" },
  { key: "onLeave", label: "On Leave", icon: BriefcaseBusiness, tone: "amber" },
  { key: "attendanceRate", label: "Attendance Rate", icon: ChartNoAxesCombined, tone: "blue", suffix: "%" },
];

function AttendanceSummaryCards({ summary }) {
  return <div className="uwa-summary-cards">{cards.map(({ key, label, icon: Icon, tone, suffix = "" }) => (
    <article key={key} className={`uwa-summary-card tone-${tone}`}><span><Icon size={21} /></span><div><small>{label}</small><strong>{summary[key] ?? 0}{suffix}</strong></div></article>
  ))}</div>;
}

export default AttendanceSummaryCards;
