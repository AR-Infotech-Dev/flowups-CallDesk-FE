import { useEffect, useState } from "react";
import { X } from "lucide-react";
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
    name: customer?.name || "",
    email: customer?.email || "",
    mobile_no: customer?.mobile_no || "",
    wa_no: customer?.wa_no || "",
    birth_date: customer?.birth_date ? new Date(customer.birth_date).toISOString().split("T")[0] : "",
    address: customer?.address || "",
    pan_number: customer?.pan_number || "",
    company_name: customer?.company_name || "",
    billing_name: customer?.billing_name || "",
    billing_address: customer?.billing_address || "",
    company_id: customer?.company_id || "",
    mailing_address: customer?.mailing_address || "",
  };
}

const EMPTY_INITIAL_VALUES = {};

function CustomerForm({ isOpen, onClose, selectedCustomer, initialValues = EMPTY_INITIAL_VALUES, onAfterSave }) {
  const [loading, setLoading] = useState(false);
  const [fetchingCustomer, setFetchingCustomer] = useState(false);
  const [formData, setFormData] = useState(customerModuleSchema.form.initialValues);
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
        setFormData(normalizeCustomerData(res?.data || selectedCustomer));
      } catch (error) {
        toast.error("Unable to fetch customer details");
        setFormData(normalizeCustomerData(selectedCustomer));
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
    setErrors({});
  }, [selectedCustomer, isOpen, customerId, initialValues]);

  if (!isOpen) {
    return null;
  }

  const handleClose = () => {
    setFormData(customerModuleSchema.form.initialValues);
    setErrors({});
    onClose();
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    const payload = {
      ...formData,
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
              />
            </div>
          )}
        </div>
      </div>
    </FlyoutPanel>
  );
}

export default CustomerForm;
