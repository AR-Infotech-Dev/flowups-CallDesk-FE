const COLORS = [
  "#2563EB",
  "#7C3AED",
  "#DC2626",
  "#059669",
  "#EA580C",
  "#0891B2",
  "#BE123C",
  "#4F46E5",
  "#16A34A",
  "#9333EA",
];

export const getRandomAvatarColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];
export const getAvatarColor = (value = "") => {
  const text = String(value);
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
  }
  return COLORS[Math.abs(hash) % COLORS.length];
};
export const getInitials = (name = "") => name.split(" ").map((n) => n[0]).join("").toUpperCase();

export const formatDate = (dateString, type = "full") => {
  if (!dateString) return "";

  const date = new Date(dateString);

  const day = date.getDate().toString().padStart(2, "0");
  const shortMonth = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12 || 12;

  // 18 Jan 2025, 3:21 pm
  if (type === "full") {
    return `${day} ${shortMonth} ${year}, ${hours}:${minutes} ${ampm}`;
  }

  // Jan 12, 2021
  if (type === "short") {
    return `${shortMonth} ${day}, ${year}`;
  }

  return "";
};

export const formatRelativeTime = (dateString) => {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}hr${hours > 1 ? "s" : ""} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(days / 365);
  return `${years}yr${years > 1 ? "s" : ""} ago`;
};


