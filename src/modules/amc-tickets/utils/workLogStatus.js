export function getWorkLogId(log = {}) {
  return log?.work_log_id || log?.workLogId || log?.id || log?._id || "";
}

export function getWorkLogStart(log = {}) {
  return log?.work_start_at || log?.start_time || log?.startTime || log?.started_at || "";
}

export function getWorkLogEnd(log = {}) {
  return log?.work_end_at || log?.end_time || log?.endTime || log?.ended_at || "";
}

export function isActiveWorkLog(log = {}) {
  const status = String(log?.work_status || log?.status || "").trim().toLowerCase();
  if (["completed", "complete", "ended", "closed", "done"].includes(status)) return false;
  if (["working", "started", "in_progress", "in-progress", "active"].includes(status)) return true;

  return Boolean(getWorkLogStart(log)) && !getWorkLogEnd(log);
}

export function findActiveWorkLog(logs = []) {
  return (Array.isArray(logs) ? logs : []).find(isActiveWorkLog) || null;
}
