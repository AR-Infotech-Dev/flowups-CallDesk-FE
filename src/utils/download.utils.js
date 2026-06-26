const getFileNameFromDisposition = (contentDisposition = "", fallback = "download") => {
  const match = String(contentDisposition || "").match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
  if (!match?.[1]) return fallback;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
};

export const downloadBlobResponse = (response, fallbackFileName = "download.xls") => {
  const blob = response?.data;
  if (!blob) return false;

  const fileName = getFileNameFromDisposition(response?.headers?.["content-disposition"], fallbackFileName);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
};
