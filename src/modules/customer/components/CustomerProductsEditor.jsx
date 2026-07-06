import { Plus, Trash2 } from "lucide-react";
import { normalizeAddOns } from "../utils/customer.utils";

function CustomerProductsEditor({ productRows, productOptions, loadingProducts, onAddProductRow, onUpdateProductRow, onRemoveProductRow, onAddProductAddon, onUpdateProductAddon, onRemoveProductAddon, }) {
  return (
    <>
      <div className={`mt-5 flex text-md font-semibold items-center justify-between mb-1 "mt-4"`}>
        <div>
          <h4 className="">Products</h4>
          <p className="text-[10px] font-light text-slate-400">
            Assign products and serial numbers for this customer.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex h-6 items-center gap-1 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700"
          onClick={onAddProductRow}
        >
          <Plus size={14} /> Add Product
        </button>
      </div>

      <div className="py-2">
        {productRows.length === 0 && (
          <div className="rounded-md border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-400">
            No products added
          </div>
        )}

        <div className="py-2">
          {productRows.map((row, index) => (
            <div key={`customer-product-${index}`} className="mb-3 rounded-md border border-slate-100 bg-slate-50/60 p-2">
              <div className="grid grid-cols-12 gap-2">
                <select
                  value={row.product_id || ""}
                  onChange={(event) => onUpdateProductRow(index, "product_id", event.target.value)}
                  className="col-span-12 rounded border border-gray-50 bg-gray-100 px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-100 md:col-span-4"
                >
                  <option value="">{loadingProducts ? "Loading products..." : "Select product"}</option>
                  {productOptions.map((product) => (
                    <option key={product.product_id} value={product.product_id}>
                      {product.product_name}
                    </option>
                  ))}
                </select>
                <input
                  value={row.serial_number || ""}
                  onChange={(event) => onUpdateProductRow(index, "serial_number", event.target.value)}
                  placeholder="Serial number"
                  className="col-span-10 rounded border border-gray-50 bg-gray-100 px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-100 md:col-span-3"
                />
                <input
                  type="date"
                  value={row.expiry_date || ""}
                  onChange={(event) => onUpdateProductRow(index, "expiry_date", event.target.value)}
                  placeholder="Expiry Date"
                  className="col-span-10 rounded border border-gray-50 bg-gray-100 px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-100 md:col-span-3"
                />
                <button
                  type="button"
                  className="col-span-2 flex items-center justify-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600 md:col-span-1"
                  onClick={() => onRemoveProductRow(index)}
                  aria-label="Remove product"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="mt-2 rounded border border-dashed border-slate-200 bg-white px-2 py-2">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-slate-500">Add-ons</span>
                  <button
                    type="button"
                    className="inline-flex h-6 items-center gap-1 rounded bg-slate-100 px-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-200"
                    onClick={() => onAddProductAddon(index)}
                  >
                    <Plus size={12} /> Add-on
                  </button>
                </div>

                {normalizeAddOns(row.add_ons, { keepEmpty: true }).length === 0 ? (
                  <div className="text-[11px] text-slate-400">No add-ons added</div>
                ) : (
                  <div className="space-y-2">
                    {normalizeAddOns(row.add_ons, { keepEmpty: true }).map((addon, addonIndex) => (
                      <div key={`customer-product-${index}-addon-${addonIndex}`} className="grid grid-cols-12 gap-2">
                        <input
                          value={addon}
                          onChange={(event) => onUpdateProductAddon(index, addonIndex, event.target.value)}
                          placeholder="Add-on name"
                          className="col-span-10 rounded border border-gray-50 bg-gray-100 px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-100 md:col-span-11"
                        />
                        <button
                          type="button"
                          className="col-span-2 flex items-center justify-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600 md:col-span-1"
                          onClick={() => onRemoveProductAddon(index, addonIndex)}
                          aria-label="Remove add-on"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default CustomerProductsEditor;
