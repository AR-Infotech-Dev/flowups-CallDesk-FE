import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { customerModuleSchema } from "../data/module.schema";
import {
  getCustomerIdentifier,
  normalizeAddOns,
  normalizeCustomerData,
  normalizeCustomerProducts,
} from "../utils/customer.utils";
import {
  getCustomerDetails,
  getCustomerProductOptions,
  saveCustomer,
} from "../data/customers.service";

export const useCustomerForm = ({
  isOpen,
  onClose,
  selectedCustomer,
  initialValues = {},
  onAfterSave,
}) => {
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
      if (!isOpen || !customerId) return;

      try {
        setFetchingCustomer(true);
        const res = await getCustomerDetails(customerId);
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
        const res = await getCustomerProductOptions();
        setProductOptions(res?.success ? res.data || [] : []);
      } catch {
        setProductOptions([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [isOpen]);

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
        [name]: value === "" ? null : value,
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
      { product_id: "", product_name: "", serial_number: "", expiry_date: "", add_ons: [] },
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
      const res = await saveCustomer({ mode, customerId, payload });

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

  return {
    loading,
    fetchingCustomer,
    formData,
    productOptions,
    productRows,
    loadingProducts,
    errors,
    handleClose,
    handleChange,
    handleSave,
    addProductRow,
    updateProductRow,
    removeProductRow,
    addProductAddon,
    updateProductAddon,
    removeProductAddon,
  };
};
