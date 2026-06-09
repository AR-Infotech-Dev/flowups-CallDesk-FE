import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "react-toastify";

import { makeRequest } from "../../../api/httpClient";
import FlyoutPanel from "../../../components/ui/FlyoutPanel";
import ActionButton from "../../../components/ui/ActionButton";
import Spinner from "../../../components/ui/Spinner";
import DynamicModuleForm from "../../../components/ui/DynamicModuleForm";
import { customerModuleSchema } from "../data/module.schema";

function getCustomerIdentifier(customer = {}) {
  return customer?.customer_id;
}

function normalizeCustomerData(customer = {}) {
  return {
    ...customerModuleSchema.form.initialValues,
    ...customer,
    name: customer?.name || null,
    email: customer?.email || null,
    mobile_no: customer?.mobile_no || null,
    wa_no: customer?.wa_no || null,
    birth_date: customer?.birth_date ? new Date(customer.birth_date).toISOString().split("T")[0] : null,
    address: customer?.address || null,
    pan_number: customer?.pan_number || null,
    company_name: customer?.company_name || null,
    billing_name: customer?.billing_name || null,
    billing_address: customer?.billing_address || null,
    company_id: customer?.company_id || null,
    mailing_address: customer?.mailing_address || null,
    is_amc: String(customer?.is_amc || "no").toLowerCase(),
    amc_term_period: customer?.amc_term_period || null,
    amc_start_date: customer?.amc_start_date ? new Date(customer.amc_start_date).toISOString().split("T")[0] : null,
    amc_end_date: customer?.amc_end_date ? new Date(customer.amc_end_date).toISOString().split("T")[0] : null,
  };
}

const EMPTY_INITIAL_VALUES = {};

const normalizeAddOns = (value = [], { keepEmpty = false } = {}) => {
  const finalize = (items) => keepEmpty ? items : items.filter(Boolean);

  if (Array.isArray(value)) {
    return finalize(value
      .map((item) => {
        if (typeof item === "object" && item !== null) {
          return String(item.name || item.add_on_name || item.label || "").trim();
        }

        return String(item || "").trim();
      }));
  }

  if (value === undefined || value === null) return [];

  return finalize(String(value)
    .split(",")
    .map((item) => item.trim())
  );
};

const normalizeCustomerProducts = (customer = {}) => {
  const rows = customer?.customer_products || customer?.products || [];
  if (!Array.isArray(rows)) return [];

  return rows.map((row) => ({
    product_id: row?.product_id || "",
    product_name: row?.product_name || "",
    serial_number: row?.serial_number || "",
    expiry_date: row?.expiry_date || "",
    add_ons: normalizeAddOns(row?.add_ons || row?.addons || row?.addOns),
  })).filter((row) => row.product_id || row.product_name || row.serial_number || row.expiry_date || row.add_ons.length);
};

function CustomerForm({ isOpen, onClose, selectedCustomer, initialValues = EMPTY_INITIAL_VALUES, onAfterSave, menu_id }) {
  const [loading, setLoading] = useState(false);
  const [fetchingCustomer, setFetchingCustomer] = useState(false);
  const [formData, setFormData] = useState(customerModuleSchema.form.initialValues);
  const [productOptions, setProductOptions] = useState([]);
  const [productRows, setProductRows] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [errors, setErrors] = useState({});
  const mode = selectedCustomer ? "edit" : "create";
  const customerId = getCustomerIdentifier(selectedCustomer);

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      if (!isOpen || !customerId) {
        return;
      }

      try {
        setFetchingCustomer(true);
        const res = await makeRequest(`${customerModuleSchema.api.edit}/${customerId}`, {
          method: "GET",
        });
        const customerData = res?.data || selectedCustomer;
        setFormData(normalizeCustomerData(customerData));
        setProductRows(normalizeCustomerProducts(customerData));
      } catch (error) {
        toast.error("Unable to fetch customer details");
        setFormData(normalizeCustomerData(selectedCustomer));
        setProductRows(normalizeCustomerProducts(selectedCustomer));
      } finally {
        setFetchingCustomer(false);
      }
    };

    if (selectedCustomer && isOpen) {
      fetchCustomerDetails();
      return;
    }

    setFormData({
      ...customerModuleSchema.form.initialValues,
      ...initialValues,
    });
    setProductRows(normalizeCustomerProducts(initialValues));
    setErrors({});
  }, [selectedCustomer, isOpen, customerId, initialValues]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!isOpen) return;

      try {
        setLoadingProducts(true);
        const res = await makeRequest("/system/searchList", {
          method: "POST",
          body: {
            text: "",
            system: "new",
            tableName: "products",
            wherec: "product_name",
            status: false,
            list: "product_id,product_name",
            isCompanyWise:true,
            curpage: 0,
          },
        });
        setProductOptions(res?.success ? res.data || [] : []);
      } catch {
        setProductOptions([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleClose = () => {
    setFormData(customerModuleSchema.form.initialValues);
    setProductRows([]);
    setErrors({});
    onClose();
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => {
      const nextState = {
        ...current,
        [name]: value == "" ? null : value,
      };

      if (name === "is_amc" && value !== "yes") {
        nextState.amc_term_period = null;
        nextState.amc_start_date = null;
        nextState.amc_end_date = null;
      }

      return nextState;
    });
  };

  const addProductRow = () => {
    setProductRows((current) => [
      ...current,
      { product_id: "", product_name: "", serial_number: "",expiry_date: "", add_ons: [] },
    ]);
  };

  const updateProductRow = (index, key, value) => {
    setProductRows((current) =>
      current.map((row, rowIndex) => {
        if (rowIndex !== index) return row;

        if (key === "product_id") {
          const product = productOptions.find((item) => String(item.product_id) === String(value));

          return {
            ...row,
            product_id: value,
            product_name: product?.product_name || "",
          };
        }

        return { ...row, [key]: value };
      })
    );
  };

  const addProductAddon = (index) => {
    setProductRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index
          ? { ...row, add_ons: [...normalizeAddOns(row.add_ons), ""] }
          : row
      )
    );
  };

  const updateProductAddon = (productIndex, addonIndex, value) => {
    setProductRows((current) =>
      current.map((row, rowIndex) => {
        if (rowIndex !== productIndex) return row;

        const addOns = normalizeAddOns(row.add_ons, { keepEmpty: true });
        addOns[addonIndex] = value;

        return {
          ...row,
          add_ons: addOns,
        };
      })
    );
  };

  const removeProductAddon = (productIndex, addonIndex) => {
    setProductRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === productIndex
          ? { ...row, add_ons: normalizeAddOns(row.add_ons).filter((_, index) => index !== addonIndex) }
          : row
      )
    );
  };

  const removeProductRow = (index) => {
    setProductRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
  };

  const handleSave = async () => {
    const normalizedAmcData = formData.is_amc === "yes"
      ? {
        amc_term_period: formData.amc_term_period || null,
        amc_start_date: formData.amc_start_date || null,
        amc_end_date: formData.amc_end_date || null,
        
      }
      : {
        amc_term_period: null,
        amc_start_date: null,
        amc_end_date: null,
      };

    const payload = {
      ...formData,
      ...normalizedAmcData,
      customer_products: productRows
        .filter((row) => row.product_id)
        .map((row) => ({
          product_id: row.product_id,
          product_name: row.product_name || "",
          serial_number: row.serial_number || "",
          expiry_date: row.expiry_date || "",
          add_ons: normalizeAddOns(row.add_ons),
        })),
    };
    const result = customerModuleSchema.validationSchema.safeParse(payload);
    if (!result.success) {
      const nextErrors = {};
      result.error.issues.forEach((issue) => {
        nextErrors[issue.path[0]] = issue.message;
      });
      setErrors(nextErrors);
      return;
    }

    try {
      setErrors({});
      setLoading(true);

      const saveUrl =
        mode === "create"
          ? customerModuleSchema.api.create
          : `${customerModuleSchema.api.edit}/${customerId}`;

      const method = mode === "create" ? "PUT" : "POST";

      const res = await makeRequest(saveUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.success) {
        toast.success(res?.message || `Customer ${mode === "create" ? "created" : "updated"} successfully`);
        setFormData(customerModuleSchema.form.initialValues);
        onAfterSave?.(res, payload);
        onClose();
        return;
      }

      toast.error(res?.msg || res?.message || "Something went wrong");
    } catch (error) {
      toast.error(error.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FlyoutPanel
      isOpen={isOpen}
      onClose={handleClose}
      title={selectedCustomer ? "Edit Customer" : "Create Customer"}
      panelClassName="!w-[640px] max-w-full"
      closeButton={
        <button className="flyout-close" onClick={handleClose} aria-label="Close panel">
          <X size={18} />
        </button>
      }
      footer={
        <div className="flex w-full items-center justify-end gap-3">
          <ActionButton disabled={loading || fetchingCustomer} variant="flyoutSecondary" onClick={handleClose}>
            Cancel
          </ActionButton>
          <ActionButton
            className={loading ? "bg-purple-200 cursor-not-allowed" : ""}
            disabled={loading || fetchingCustomer}
            variant="flyoutSecondary"
            onClick={handleSave}
          >
            {loading || fetchingCustomer ? <Spinner /> : null} Save
          </ActionButton>
        </div>
      }
    >
      <div className="flyout-form-shell">
        <div className="ws-main-container">
          {fetchingCustomer ? (
            <div className="p-5 text-center">
              <Spinner />
            </div>
          ) : (
            <div className="rounded-xl bg-white px-4 py-3">
              <DynamicModuleForm
                sections={customerModuleSchema.form.sections}
                values={formData}
                onChange={handleChange}
                errors={errors}
                menuId={menu_id}
              />
              <div className={`mt-5 flex text-md font-semibold items-center justify-between mb-1 "mt-4"`}  >
                <div>
                  <h4 className="">Products</h4>
                  <p className="text-[10px] font-light text-slate-400">Assign products and serial numbers for this customer.</p>
                </div>
                <button
                  type="button"
                  className="inline-flex h-6 items-center gap-1 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700"
                  onClick={addProductRow}
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
                          onChange={(event) => updateProductRow(index, "product_id", event.target.value)}
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
                          onChange={(event) => updateProductRow(index, "serial_number", event.target.value)}
                          placeholder="Serial number"
                          className="col-span-10 rounded border border-gray-50 bg-gray-100 px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-100 md:col-span-3"
                        />
                        <input
                          type="date"
                          value={row.expiry_date || ""}
                          onChange={(event) => updateProductRow(index, "expiry_date", event.target.value)}
                          placeholder="Expiry Date"
                          className="col-span-10 rounded border border-gray-50 bg-gray-100 px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-100 md:col-span-3"
                        />
                        <button
                          type="button"
                          className="col-span-2 flex items-center justify-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600 md:col-span-1"
                          onClick={() => removeProductRow(index)}
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
                            onClick={() => addProductAddon(index)}
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
                                  onChange={(event) => updateProductAddon(index, addonIndex, event.target.value)}
                                  placeholder="Add-on name"
                                  className="col-span-10 rounded border border-gray-50 bg-gray-100 px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-100 md:col-span-11"
                                />
                                <button
                                  type="button"
                                  className="col-span-2 flex items-center justify-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600 md:col-span-1"
                                  onClick={() => removeProductAddon(index, addonIndex)}
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
            </div>
          )}
        </div>
      </div>
    </FlyoutPanel>
  );
}

export default CustomerForm;
