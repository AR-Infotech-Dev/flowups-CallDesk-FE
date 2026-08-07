const DAY_MS = 24 * 60 * 60 * 1000;

export const ATTENDANCE_STATUS = {
  present: { code: "P", label: "Present" },
  absent: { code: "A", label: "Absent" },
  leave: { code: "L", label: "Leave" },
  halfDay: { code: "HD", label: "Half Day" },
  late: { code: "LT", label: "Late" },
  weekend: { code: "W", label: "Weekend" },
  unavailable: { code: "–", label: "Not Available" },
};

export const toDateKey = (value) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getMonthRange = (date = new Date()) => ({
  from_date: toDateKey(new Date(date.getFullYear(), date.getMonth(), 1)),
  to_date: toDateKey(new Date(date.getFullYear(), date.getMonth() + 1, 0)),
});

export const shiftMonthRange = (dateKey, amount) => {
  const current = new Date(`${dateKey}T00:00:00`);
  return getMonthRange(new Date(current.getFullYear(), current.getMonth() + amount, 1));
};

export const buildDateColumns = (fromDate, toDate) => {
  if (!fromDate || !toDate) return [];
  const start = new Date(`${fromDate}T00:00:00`);
  const end = new Date(`${toDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return [];

  const days = [];
  for (let cursor = start; cursor <= end && days.length < 62; cursor = new Date(cursor.getTime() + DAY_MS)) {
    days.push({
      key: toDateKey(cursor),
      day: cursor.getDate(),
      weekday: cursor.toLocaleDateString("en-IN", { weekday: "short" }),
      isWeekend: cursor.getDay() === 0 ,
      isToday: toDateKey(cursor) === toDateKey(new Date()),
      isFuture: cursor > new Date(new Date().setHours(23, 59, 59, 999)),
    });
  }
  return days;
};

export const getInitials = (name = "") =>
  name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U";

export const formatMonthLabel = (dateKey) => {
  const date = new Date(`${dateKey}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
};

const timeMinutes = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.getHours() * 60 + date.getMinutes();
};

const durationHours = (start, end) => {
  if (!start || !end) return 0;
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return diff > 0 ? diff / 3600000 : 0;
};

export const buildAttendanceRows = (users = [], dates = []) => users.map((user) => {
  const records = new Map((user.attendance_days || []).map((record) => [String(record.attendance_date).slice(0, 10), record]));
  const totals = { present: 0, absent: 0, leave: 0, late: 0, hours: 0 };

  const days = dates.map((date) => {
    const record = records.get(date.key);
    let status = "unavailable";
    if (record?.sign_in_at) status = "present";
    else if (record?.status && ATTENDANCE_STATUS[record.status]) status = record.status;
    else if (date.isWeekend) status = "weekend";
    else if (!date.isFuture) status = "absent";

    if (status === "present") totals.present += 1;
    if (status === "late") totals.late += 1;
    if (status === "absent") totals.absent += 1;
    if (status === "leave") totals.leave += 1;
    totals.hours += durationHours(record?.sign_in_at, record?.sign_out_at);

    return { ...date, status, record };
  });

  const workingDays = totals.present + totals.absent + totals.leave;
  totals.rate = workingDays ? Math.round((totals.present / workingDays) * 100) : 0;

  return { ...user, days, totals };
});

export const buildMatrixSummary = (rows = []) => {
  const todayKey = toDateKey(new Date());
  let presentToday = 0;
  let absentToday = 0;
  let onLeave = 0;
  rows.forEach((row) => {
    const status = row.days.find((day) => day.key === todayKey)?.status;
    if (status === "present") presentToday += 1;
    if (status === "absent") absentToday += 1;
    if (status === "leave") onLeave += 1;
  });
  const attendanceRate = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.totals.rate, 0) / rows.length) : 0;
  return { presentToday, absentToday, onLeave, attendanceRate };
};




