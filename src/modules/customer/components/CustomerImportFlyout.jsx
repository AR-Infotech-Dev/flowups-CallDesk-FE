import { useMemo, useRef, useState } from "react";
import { Download, FileSpreadsheet, Upload, X } from "lucide-react";
import { toast } from "react-toastify";
import { makeRequest } from "../../../api/httpClient";
import ActionButton from "../../../components/ui/ActionButton";
import FlyoutPanel from "../../../components/ui/FlyoutPanel";
import Spinner from "../../../components/ui/Spinner";

const templateColumns = [
  { label: "Customer Name", key: "name", required: true, sample: "ABC Traders" },
  { label: "Contact Person", key: "contact_person", sample: "Rakesh Dhumal" },
  { label: "Mobile No", key: "mobile_no", required: true, sample: "9876543210" },
  { label: "Email", key: "email", sample: "customer@example.com" },
  { label: "WhatsApp No", key: "wa_no", sample: "9876543210" },
  { label: "PAN Number", key: "pan_number", sample: "ABCDE1234F" },
  { label: "GST Number", key: "gst_number", sample: "27ABCDE1234F1Z5" },
  { label: "Company Name", key: "company_name", sample: "ABC Inc" },
  { label: "Billing Name", key: "billing_name", sample: "ABC Inc" },
  { label: "Address", key: "address", sample: "Pune, Maharashtra" },
  { label: "Billing Address", key: "billing_address", sample: "Pune, Maharashtra" },
  { label: "Mailing Address", key: "mailing_address", sample: "Pune, Maharashtra" },
  { label: "Is AMC", key: "is_amc", sample: "yes" },
  { label: "AMC Term Period", key: "amc_term_period", sample: "yearly" },
  { label: "AMC Start Date", key: "amc_start_date", sample: "2026-04-02" },
  { label: "AMC End Date", key: "amc_end_date", sample: "2027-04-01" },
  { label: "Product IDs", key: "product_ids", sample: "1,2" },
  { label: "Product Names", key: "product_names", sample: "CRM Basic,CRM Premium" },
  { label: "Serial Numbers", key: "serial_numbers", sample: "SR-001,SR-002" },
  { label: "Product Expiry Dates", key: "product_expiry_dates", sample: "2027-04-01,2028-04-01" },
];

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function downloadCustomerTemplate() {
  const headerCells = templateColumns
    .map((column) => `<th>${escapeHtml(column.label)}${column.required ? " *" : ""}</th>`)
    .join("");
  const keyCells = templateColumns.map((column) => `<td>${escapeHtml(column.key)}</td>`).join("");
  const sampleCells = templateColumns.map((column) => `<td>${escapeHtml(column.sample || "")}</td>`).join("");

  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Calibri, Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          .title { background: #174d80; color: #ffffff; font-size: 20px; font-weight: 700; text-align: center; }
          .note { background: #eff6ff; color: #31537a; font-weight: 700; }
          th { background: #143a63; color: #ffffff; border: 1px solid #9fb7cc; padding: 8px; text-align: center; }
          td { border: 1px solid #d9e2ec; padding: 7px; mso-number-format: "\\@"; }
          .keys td { background: #f8fafc; color: #64748b; font-weight: 700; }
          .sample td { background: #ffffff; }
        </style>
      </head>
      <body>
        <table>
          <tr><td class="title" colspan="${templateColumns.length}">Customer Import Template</td></tr>
          <tr><td class="note" colspan="${templateColumns.length}">Fill customer data below. Required columns are marked with *.</td></tr>
          <tr>${headerCells}</tr>
          <tr class="keys">${keyCells}</tr>
          <tr class="sample">${sampleCells}</tr>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "customer-import-template.xls";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function CustomerImportFlyout({ isOpen, onClose, onImported }) {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importStage, setImportStage] = useState("");
  const [result, setResult] = useState(null);

  const fileName = useMemo(() => file?.name || "No file selected", [file]);

  const handleClose = () => {
    if (importing) return;
    setFile(null);
    setUploadProgress(0);
    setImportStage("");
    setResult(null);
    onClose?.();
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select customer Excel file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setImporting(true);
    setUploadProgress(0);
    setImportStage("Uploading file...");
    const res = await makeRequest("/customers/import", {
      method: "POST",
      body: formData,
      timeout: 300000,
      onUploadProgress: (progressEvent) => {
        if (!progressEvent.total) return;
        const nextProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(Math.min(nextProgress, 100));
        if (nextProgress >= 100) {
          setImportStage("Processing file...");
        }
      },
    });
    setImporting(false);

    if (!res.success) {
      setImportStage("");
      toast.error(res.message || "Unable to import customers.");
      return;
    }

    setUploadProgress(100);
    setImportStage("Import complete");
    setResult(res);
    toast.success(res.message || "Customers imported successfully.");
    onImported?.();
  };

  return (
    <FlyoutPanel
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Customer Data"
      subtitle="Download the Excel template, fill customer data, then upload it here."
      closeButton={
        <button className="flyout-close" onClick={handleClose} aria-label="Close import panel">
          <X size={18} />
        </button>
      }
      footer={
        <>
          <ActionButton disabled={importing} variant="flyoutSecondary" onClick={handleClose}>
            Cancel
          </ActionButton>
          <ActionButton disabled={importing || !file} variant="flyoutPrimary" onClick={handleImport}>
            {importing ? <Spinner /> : <Upload size={16} />}
            Import Data
          </ActionButton>
        </>
      }
    >
      <div className="customer-import-shell">
        <section className="customer-import-card customer-import-template-card">
          <span className="customer-import-icon">
            <FileSpreadsheet size={20} />
          </span>
          <div>
            <h3>Customer Excel Template</h3>
            <p>Use this exact format for importing customers into database.</p>
          </div>
          <ActionButton variant="ghostPrimary" onClick={downloadCustomerTemplate}>
            <Download size={15} />
            Download
          </ActionButton>
        </section>

        <section className="customer-import-card">
          <div className="customer-import-upload-head">
            <div>
              <h3>Upload Filled Excel</h3>
              <p>Accepted file types: .xlsx, .xls, .csv</p>
            </div>
          </div>

          <button type="button" className="customer-import-dropzone" onClick={() => fileInputRef.current?.click()}>
            <Upload size={22} />
            <strong>{fileName}</strong>
            <span>Click to choose the customer import file</span>
          </button>

          <input
            ref={fileInputRef}
            className="sr-only"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(event) => {
              setFile(event.target.files?.[0] || null);
              setUploadProgress(0);
              setImportStage("");
              setResult(null);
            }}
          />
        </section>

        {(importing || uploadProgress > 0) && (
          <section className="customer-import-progress" aria-live="polite">
            <div className="customer-import-progress-head">
              <span>{importStage || "Preparing import..."}</span>
              <strong>{uploadProgress}%</strong>
            </div>
            <div className="customer-import-progress-track">
              <span style={{ width: `${uploadProgress}%` }} />
            </div>
          </section>
        )}

        <section className="customer-import-columns">
          <h3>Template Columns</h3>
          <div>
            {templateColumns.map((column) => (
              <span key={column.key} className={column.required ? "required" : ""}>
                {column.label}
              </span>
            ))}
          </div>
        </section>

        {result && (
          <section className="customer-import-result">
            <div>
              <span>Inserted</span>
              <strong>{result.inserted || 0}</strong>
            </div>
            <div>
              <span>Skipped</span>
              <strong>{result.skipped || 0}</strong>
            </div>
            {!!result.errors?.length && (
              <ul>
                {result.errors.slice(0, 5).map((error, index) => (
                  <li key={`${error.row || index}-${error.message}`}>Row {error.row}: {error.message}</li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </FlyoutPanel>
  );
}

export default CustomerImportFlyout;
