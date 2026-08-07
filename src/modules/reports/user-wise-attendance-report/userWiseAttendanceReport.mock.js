const EMPLOYEES = [
  [1, "John Doe", "john.doe"], [2, "Priya Sharma", "priya.sharma"],
  [3, "Rahul Mehta", "rahul.mehta"], [4, "Sneha Iyer", "sneha.iyer"],
  [5, "Amit Verma", "amit.verma"], [6, "Neha Singh", "neha.singh"],
  [7, "Pooja Nair", "pooja.nair"], [8, "Arjun Patel", "arjun.patel"],
  [9, "Rohan Kulkarni", "rohan.kulkarni"], [10, "Kavita Joshi", "kavita.joshi"],
  [11, "Sagar Patil", "sagar.patil"], [12, "Meera Shah", "meera.shah"],
];

const atTime = (dateKey, hour, minute) => `${dateKey}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;

export const buildMockAttendanceUsers = (dates = []) => EMPLOYEES.map(([user_id, user_name, username], employeeIndex) => ({
  user_id,
  user_name,
  username,
  email: `${username}@flowups.test`,
  attendance_days: dates.flatMap((date, dayIndex) => {
    if (date.isWeekend || date.isFuture) return [];
    if ((dayIndex + employeeIndex * 2) % 17 === 0) return [{ attendance_date: date.key, status: "leave" }];
    if ((dayIndex + employeeIndex * 3) % 23 === 0) return [{ attendance_date: date.key, status: "halfDay" }];
    if ((dayIndex + employeeIndex) % 11 === 0) return [];
    const isLate = (dayIndex + employeeIndex) % 7 === 0;
    const startHour = isLate ? 10 : 9;
    const startMinute = isLate ? 24 : 18 + (employeeIndex % 4) * 4;
    return [{
      attendance_date: date.key,
      sign_in_at: atTime(date.key, startHour, startMinute),
      sign_out_at: atTime(date.key, 18, 5 + (employeeIndex % 5) * 4),
      sign_in_location: employeeIndex % 3 === 0 ? "Client location" : "Office",
    }];
  }),
}));
