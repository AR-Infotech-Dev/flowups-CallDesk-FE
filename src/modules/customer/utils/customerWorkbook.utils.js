import * as XLSX from "xlsx";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";

export const CUSTOMER_DATA_SHEET = "Customer Data";

const CUSTOMER_HEADERS = [
  "Action", "Customer Code", "Customer ID", "Row Version", "Company ID",
  "Customer Name", "WhatsApp No", "PAN Number", "GST Number", "Company Name",
  "Billing Name", "Address", "Billing Address", "Mailing Address", "Is AMC",
  "AMC Term Period", "AMC Start Date", "AMC End Date", "Expected Call Count",
  "Responsible Person", "Status",
];

const CONTACT_HEADERS = [
  "Action", "Customer Code", "Customer ID", "Contact ID", "Contact Name",
  "Mobile Number", "Email", "Designation", "Department", "Is Primary",
];

const PRODUCT_HEADERS = [
  "Action", "Customer Code", "Customer ID", "Product Row Key", "Product ID",
  "Product Name", "Serial Number", "Expiry Date", "Add-ons",
];

const CUSTOMER_VISIBLE_HEADERS = CUSTOMER_HEADERS.filter((header) => !["Action", "Customer Code"].includes(header));

const CONTACT_LIST_COLUMNS = [
  ["Contact IDs", "Contact ID"],
  ["Contact Names", "Contact Name"],
  ["Contact Mobile Numbers", "Mobile Number"],
  ["Contact Emails", "Email"],
  ["Contact Designations", "Designation"],
  ["Contact Departments", "Department"],
  ["Contact Primary Flags", "Is Primary"],
];

const PRODUCT_LIST_COLUMNS = [
  ["Product Row Keys", "Product Row Key"],
  ["Product IDs", "Product ID"],
  ["Product Names", "Product Name"],
  ["Product Serial Numbers", "Serial Number"],
  ["Product Expiry Dates", "Expiry Date"],
  ["Product Add-ons", "Add-ons"],
];

export const SINGLE_SHEET_HEADERS = [
  ...CUSTOMER_VISIBLE_HEADERS,
  ...CONTACT_LIST_COLUMNS.map(([header]) => header),
  ...PRODUCT_LIST_COLUMNS.map(([header]) => header),
];

const INSTRUCTION_ROWS = [
  ["Customer Import / Export Instructions", ""],
  ["Purpose", "Export customers, edit existing customers or add new customers, and import the same workbook again."],
  ["Editable Sheet", "Make changes only in the 'Customer Data' sheet. Do not rename or delete columns."],
  ["Products Master", "Use the 'Products Master' sheet to find the correct company Product ID and Product Name. This sheet is for reference only."],
  ["One Customer Per Row", "Each customer must remain on exactly one row."],
  ["Automatic Add / Update", "No Action column is required. The system automatically updates rows with existing IDs and inserts rows whose IDs are blank."],
  ["Existing Customer", "Keep Customer ID and Row Version unchanged. The system will automatically update the customer."],
  ["New Customer", "Add a new row, leave Customer ID and Row Version blank, and the system will automatically create the customer."],
  ["Multiple Contacts", "Enter contact values separated by commas and keep the same order across Contact Names, Mobile Numbers, Emails, Designations and Primary Flags."],
  ["Contact Example", "Names: Rakesh, Suresh | Mobiles: 9876543210, 9876500000 | Primary Flags: y, n"],
  ["Blank Contact Value", "If an optional value is unavailable, keep its comma position blank so the remaining contact values stay aligned."],
  ["Multiple Products", "Enter product values separated by commas and keep the same order across Product Names, IDs, Serial Numbers and Expiry Dates."],
  ["Product Example", "Products: Tally Prime, TSS | Serial Numbers: SR-001, SR-002 | Expiry Dates: 2027-04-01, 2027-08-01"],
  ["Product Add-ons", "Separate different products with commas. Use + for multiple add-ons of one product, for example: Payroll+Agri, TSS."],
  ["Primary Contact", "Use y for exactly one primary contact and n for other contacts."],
  ["Date Format", "Use YYYY-MM-DD, for example 2027-04-01."],
  ["Before Import", "Save the workbook as .xlsx or .xls, upload it, review Preview Import, and then click Apply Changes."],
  ["Important", "Do not add commas inside an individual contact name, product name or serial number because commas separate multiple values."],
];

const normalizeHeader = (value) => String(value ?? "").trim();
const normalizeKey = (value) => String(value ?? "").trim();

const rowsFromSheet = (sheet) => sheet
  ? XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false })
  : [];

const isBlank = (value) => String(value ?? "").trim() === "";
const isBlankRow = (row) => !Object.values(row || {}).some((value) => !isBlank(value));

const splitList = (value) => {
  if (value === null || value === undefined || value === "") return [];
  return String(value).split(",").map((item) => item.trim());
};

const joinList = (values) => {
  const normalized = values.map((value) => String(value ?? "").trim());
  while (normalized.length && !normalized[normalized.length - 1]) normalized.pop();
  return normalized.join(", ");
};

const resolveAction = (action, id) => {
  const normalized = String(action ?? "").trim().toUpperCase();
  if (normalized) return normalized;
  return isBlank(id) ? "INSERT" : "UPDATE";
};

const getCustomerKey = (row) => normalizeKey(row?.["Customer ID"]) || normalizeKey(row?.["Customer Code"]);

const customerForChild = (child, customersByKey) => {
  const idKey = normalizeKey(child?.["Customer ID"]);
  const codeKey = normalizeKey(child?.["Customer Code"]);
  return customersByKey.get(idKey) || customersByKey.get(codeKey) || null;
};

function appendChildLists(target, childRows, columns) {
  columns.forEach(([targetHeader, childHeader]) => {
    target[targetHeader] = joinList(childRows.map((row) => row?.[childHeader]));
  });
}

function createSingleSheet(rows) {
  const sheet = XLSX.utils.json_to_sheet(rows, { header: SINGLE_SHEET_HEADERS, skipHeader: false });
  sheet["!cols"] = SINGLE_SHEET_HEADERS.map((header) => ({
    wch: Math.min(Math.max(header.length + 3, 14), ["Address", "Billing Address", "Mailing Address", "Contact Names", "Product Names"].includes(header) ? 34 : 26),
  }));
  sheet["!autofilter"] = { ref: `A1:${XLSX.utils.encode_col(SINGLE_SHEET_HEADERS.length - 1)}1` };
  sheet["!freeze"] = { xSplit: 0, ySplit: 1, topLeftCell: "A2", activePane: "bottomLeft", state: "frozen" };

  SINGLE_SHEET_HEADERS.forEach((header, index) => {
    const cell = sheet[XLSX.utils.encode_cell({ r: 0, c: index })];
    if (!cell) return;
    cell.s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "1F4E78" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
    };
  });
  return sheet;
}

function createInstructionsSheet() {
  const sheet = XLSX.utils.aoa_to_sheet(INSTRUCTION_ROWS);
  sheet["!cols"] = [{ wch: 24 }, { wch: 110 }];
  sheet["!rows"] = [{ hpt: 28 }];
  sheet["!merges"] = [XLSX.utils.decode_range("A1:B1")];

  const title = sheet.A1;
  if (title) {
    title.s = {
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 16 },
      fill: { fgColor: { rgb: "1F4E78" } },
      alignment: { horizontal: "center", vertical: "center" },
    };
  }

  for (let row = 1; row < INSTRUCTION_ROWS.length; row += 1) {
    const label = sheet[XLSX.utils.encode_cell({ r: row, c: 0 })];
    const detail = sheet[XLSX.utils.encode_cell({ r: row, c: 1 })];
    if (label) label.s = { font: { bold: true, color: { rgb: "1F4E78" } }, fill: { fgColor: { rgb: "D9EAF7" } }, alignment: { vertical: "top", wrapText: true } };
    if (detail) detail.s = { alignment: { vertical: "top", wrapText: true } };
  }
  return sheet;
}

function normalizeProductOptions(productOptions = []) {
  const seen = new Set();
  return productOptions.reduce((rows, product) => {
    const productId = product?.product_id ?? product?.["Product ID"] ?? null;
    const productName = product?.product_name ?? product?.name ?? product?.["Product Name"] ?? "";
    const key = `${productId ?? ""}|${productName}`;
    if ((!productId && !productName) || seen.has(key)) return rows;
    seen.add(key);
    rows.push({ "Product ID": productId, "Product Name": productName });
    return rows;
  }, []);
}

function createProductMasterSheet(productOptions = []) {
  const rows = normalizeProductOptions(productOptions);
  const sheet = XLSX.utils.json_to_sheet(rows, { header: ["Product ID", "Product Name"] });
  sheet["!cols"] = [{ wch: 16 }, { wch: 42 }];
  sheet["!autofilter"] = { ref: `A1:B${Math.max(rows.length + 1, 1)}` };
  ["A1", "B1"].forEach((address) => {
    if (!sheet[address]) return;
    sheet[address].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "1F4E78" } },
      alignment: { horizontal: "center", vertical: "center" },
    };
  });
  return sheet;
}

function buildUserWorkbook(rows, productOptions = []) {
  const output = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(output, createInstructionsSheet(), "Instructions");
  XLSX.utils.book_append_sheet(output, createProductMasterSheet(productOptions), "Products Master");
  XLSX.utils.book_append_sheet(output, createSingleSheet(rows), CUSTOMER_DATA_SHEET);
  return output;
}

function writeUserWorkbook(workbook) {
  const workbookBytes = new Uint8Array(XLSX.write(workbook, { type: "array", bookType: "xlsx", cellStyles: true }));
  const files = unzipSync(workbookBytes);
  const customerSheetPath = "xl/worksheets/sheet3.xml";
  const customerSheet = files[customerSheetPath];

  if (customerSheet) {
    const xml = strFromU8(customerSheet);
    const frozenView = '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews>';
    const patchedXml = xml.replace(/<sheetViews>[\s\S]*?<\/sheetViews>/, frozenView);
    files[customerSheetPath] = strToU8(patchedXml);
  }

  return zipSync(files, { level: 6 });
}

export async function convertLegacyWorkbookBlobToSingleSheet(blob, productOptions = []) {
  const buffer = await blob.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellStyles: true, cellDates: true });

  if (workbook.SheetNames.includes(CUSTOMER_DATA_SHEET)) {
    const rows = rowsFromSheet(workbook.Sheets[CUSTOMER_DATA_SHEET]).filter((row) => !isBlankRow(row));
    const existingProducts = rowsFromSheet(workbook.Sheets["Products Master"]);
    const output = buildUserWorkbook(rows, productOptions.length ? productOptions : existingProducts);
    return new Blob([writeUserWorkbook(output)], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  }

  const customers = rowsFromSheet(workbook.Sheets.Customers).filter((row) => !isBlankRow(row));
  const contacts = rowsFromSheet(workbook.Sheets.Contacts).filter((row) => !isBlankRow(row));
  const products = rowsFromSheet(workbook.Sheets.Products).filter((row) => !isBlankRow(row));
  if (!customers.length) throw new Error("Customer workbook does not contain customer data.");

  const customersByKey = new Map();
  const outputRows = customers.map((customer, index) => {
    const output = {};
    CUSTOMER_VISIBLE_HEADERS.forEach((header) => { output[header] = customer?.[header] ?? null; });
    const fallbackKey = `ROW-${index + 2}`;
    const idKey = normalizeKey(customer?.["Customer ID"]);
    const codeKey = normalizeKey(customer?.["Customer Code"]);
    customersByKey.set(idKey || fallbackKey, output);
    if (codeKey) customersByKey.set(codeKey, output);
    output.__key = idKey || codeKey || fallbackKey;
    return output;
  });

  const contactsByCustomer = new Map(outputRows.map((row) => [row.__key, []]));
  contacts.forEach((contact) => {
    const customer = customerForChild(contact, customersByKey);
    if (!customer) return;
    contactsByCustomer.get(customer.__key).push({
      ...contact,
      Action: resolveAction(contact?.Action, contact?.["Contact ID"]),
    });
  });

  const productsByCustomer = new Map(outputRows.map((row) => [row.__key, []]));
  products.forEach((product) => {
    const customer = customerForChild(product, customersByKey);
    if (!customer) return;
    productsByCustomer.get(customer.__key).push({
      ...product,
      Action: resolveAction(product?.Action, product?.["Product Row Key"]),
    });
  });

  outputRows.forEach((row) => {
    appendChildLists(row, contactsByCustomer.get(row.__key) || [], CONTACT_LIST_COLUMNS);
    appendChildLists(row, productsByCustomer.get(row.__key) || [], PRODUCT_LIST_COLUMNS);
    delete row.__key;
  });

  const output = buildUserWorkbook(outputRows, productOptions.length ? productOptions : products);
  return new Blob([writeUserWorkbook(output)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

function buildChildRows(row, rowNumber, columns, idHeader, meaningfulHeaders) {
  const lists = Object.fromEntries(columns.map(([singleHeader, legacyHeader]) => [legacyHeader, splitList(row?.[singleHeader])]));
  const rowCount = Math.max(0, ...Object.values(lists).map((items) => items.length));
  const customerId = row?.["Customer ID"] ?? null;
  const internalCustomerCode = `ROW-${rowNumber}`;
  const result = [];

  for (let index = 0; index < rowCount; index += 1) {
    const child = {
      "Customer Code": internalCustomerCode,
      "Customer ID": customerId,
    };
    Object.entries(lists).forEach(([legacyHeader, values]) => { child[legacyHeader] = values[index] || null; });
    if (!meaningfulHeaders.some((header) => !isBlank(child[header]))) continue;
    child.Action = resolveAction(child.Action, child[idHeader]);
    result.push(child);
  }
  return result;
}

export async function prepareCustomerWorkbookForImport(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });

  if (!workbook.SheetNames.includes(CUSTOMER_DATA_SHEET)) {
    const hasLegacySheets = ["Customers", "Contacts", "Products"].every((name) => workbook.SheetNames.includes(name));
    if (hasLegacySheets) return file;
    throw new Error(`Workbook must contain a '${CUSTOMER_DATA_SHEET}' sheet.`);
  }

  const sheet = workbook.Sheets[CUSTOMER_DATA_SHEET];
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: false });
  const headers = (matrix[0] || []).map(normalizeHeader);
  const missingHeaders = ["Customer ID", "Customer Name"].filter((header) => !headers.includes(header));
  if (missingHeaders.length) throw new Error(`Missing required column(s): ${missingHeaders.join(", ")}.`);

  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false }).filter((row) => !isBlankRow(row));
  if (!rows.length) throw new Error("At least one customer row is required.");

  const customers = [];
  const contacts = [];
  const products = [];
  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const customer = {};
    CUSTOMER_HEADERS.forEach((header) => { customer[header] = row?.[header] ?? null; });
    customer["Customer Code"] = `ROW-${rowNumber}`;
    customer.Action = resolveAction(customer.Action, customer["Customer ID"]);
    customers.push(customer);

    contacts.push(...buildChildRows(
      row,
      rowNumber,
      CONTACT_LIST_COLUMNS,
      "Contact ID",
      ["Contact ID", "Contact Name", "Mobile Number", "Email"],
    ));
    products.push(...buildChildRows(
      row,
      rowNumber,
      PRODUCT_LIST_COLUMNS,
      "Product Row Key",
      ["Product Row Key", "Product ID", "Product Name", "Serial Number"],
    ));
  });

  const output = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(output, XLSX.utils.json_to_sheet(customers, { header: CUSTOMER_HEADERS }), "Customers");
  XLSX.utils.book_append_sheet(output, XLSX.utils.json_to_sheet(contacts, { header: CONTACT_HEADERS }), "Contacts");
  XLSX.utils.book_append_sheet(output, XLSX.utils.json_to_sheet(products, { header: PRODUCT_HEADERS }), "Products");
  const legacyBuffer = XLSX.write(output, { type: "array", bookType: "xlsx" });
  return new File([legacyBuffer], file.name.replace(/\.(xlsx?|csv)$/i, "-prepared.xlsx"), {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
