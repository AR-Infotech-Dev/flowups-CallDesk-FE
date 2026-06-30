import { Circle, Plus, Trash2 } from "lucide-react";

const CONTACT_FIELDS = [
  { key: "name", label: "Name", placeholder: "Contact name", span: "md:col-span-3" },
  { key: "designation", label: "Designation", placeholder: "Designation", span: "md:col-span-2" },
  { key: "mobile_no", label: "Mobile", placeholder: "Mobile no", span: "md:col-span-2" },
  { key: "email", label: "Email", placeholder: "Email", span: "md:col-span-3", type: "email" },
  { key: "department", label: "Department", placeholder: "Department", span: "md:col-span-2" },
];

function CustomerContactsEditor({
  contactRows,
  errors = {},
  onAddContactRow,
  onUpdateContactRow,
  onRemoveContactRow,
  onSetPrimaryContact,
}) {
  return (
    <>
      <div className="mt-5 mb-1 flex items-center justify-between text-md font-semibold">
        <div>
          <h4>Contact Persons</h4>
          <p className="text-[10px] font-light text-slate-400">
            Add multiple contacts for this customer.
          </p>
          {errors.customer_contacts ? (
            <p className="mt-1 text-[11px] font-medium text-red-500">{errors.customer_contacts}</p>
          ) : null}
        </div>
        <button
          type="button"
          className="inline-flex h-6 items-center gap-1 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700"
          onClick={onAddContactRow}
        >
          <Plus size={14} /> Add Contact
        </button>
      </div>

      <div className="py-0.5">
        {contactRows.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-400">
            No contact persons added
          </div>
        ) : null}

        <div className="space-y-3 py-0.5">
          {contactRows.map((row, index) => (
            <div key={row.contact_id || `customer-contact-${index}`} className="rounded-md border border-slate-100 bg-slate-50/60 p-2">
              <div className="mb-2 flex items-center justify-between text-xs">
                <button
                  
                  className={`inline-flex h-5 items-center gap-1 rounded px-2 font-light ${
                    row.is_primary === "y"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                  onClick={() => onSetPrimaryContact(index)}
                >
                  <Circle size={10} fill={row.is_primary === "y" ? "currentColor" : "none"} />
                  {row.is_primary === "y" ? "Primary" : "Set Primary"}
                </button>

                <button
                  type="button"
                  className="flex h-6 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600"
                  onClick={() => onRemoveContactRow(index)}
                  aria-label="Remove contact"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="grid grid-cols-12 gap-2">
                {CONTACT_FIELDS.map((field) => {
                  const fieldError = errors[`customer_contacts.${index}.${field.key}`];

                  return (
                    <div key={field.key} className={`col-span-12 ${field.span}`}>
                      <input
                        type={field.type || "text"}
                        value={row[field.key] || ""}
                        onChange={(event) => onUpdateContactRow(index, field.key, event.target.value)}
                        placeholder={field.placeholder}
                        aria-label={field.label}
                        className={`w-full rounded border px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 ${
                          fieldError
                            ? "border-red-200 bg-red-50 focus:ring-red-100"
                            : "border-gray-50 bg-gray-100 focus:ring-purple-100"
                        }`}
                      />
                      {fieldError ? (
                        <p className="mt-1 text-[11px] font-medium text-red-500">{fieldError}</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default CustomerContactsEditor;
