import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { leadsModuleSchema } from "../data/module.schema";
import { getLeadDetails, saveLead } from "../data/leads.service";
import { getLeadIdentifier, normalizeLeadData, normalizeLeadPayload } from "../utils/leads.utils";

export const useLeadForm = ({ isOpen, onClose, selectedLead, initialValues = {}, onAfterSave }) => {
  const [loading, setLoading] = useState(false);
  const [fetchingLead, setFetchingLead] = useState(false);
  const [formData, setFormData] = useState(leadsModuleSchema.form.initialValues);
  const [errors, setErrors] = useState({});
  const mode = selectedLead ? "edit" : "create";
  const leadId = getLeadIdentifier(selectedLead);

  useEffect(() => {
    if (!isOpen) return;
    if (!leadId) {
      setFormData({ ...leadsModuleSchema.form.initialValues, ...initialValues });
      setErrors({});
      return;
    }

    let active = true;
    setFetchingLead(true);
    getLeadDetails(leadId)
      .then((res) => active && setFormData(normalizeLeadData(res?.data || selectedLead)))
      .catch(() => active && setFormData(normalizeLeadData(selectedLead)))
      .finally(() => active && setFetchingLead(false));
    return () => { active = false; };
  }, [isOpen, leadId, selectedLead, initialValues]);

  const handleChange = ({ target: { name, value } }) => {
    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleCustomerSelect = (field, option = {}) => {
    if (field?.name !== "customer_id") return;
    const customer = option.original || option;
    if (!customer?.customer_id) return;
    setFormData((current) => ({
      ...current,
      customer_id: customer.customer_id,
      name: customer.name || current.name,
      company_name: customer.company_name || current.company_name,
      contact_person: customer.contact_person || current.contact_person,
      mobile_no: customer.mobile_no || current.mobile_no,
      email: customer.email || current.email,
    }));
  };

  const handleClose = () => {
    setFormData({ ...leadsModuleSchema.form.initialValues });
    setErrors({});
    onClose?.();
  };

  const handleSave = async () => {
    const payload = normalizeLeadPayload(formData);
    const result = leadsModuleSchema.validationSchema.safeParse(payload);
    if (!result.success) {
      const nextErrors = {};
      result.error.issues.forEach((issue) => { nextErrors[issue.path[0]] = issue.message; });
      setErrors(nextErrors);
      return;
    }

    try {
      setLoading(true);
      const res = await saveLead({ mode, leadId, payload: result.data });
      if (!res.success) {
        toast.error(res.message || "Unable to save lead");
        return;
      }
      toast.success(res.message || `Lead ${mode === "create" ? "created" : "updated"} successfully`);
      handleClose();
      onAfterSave?.(res, result.data);
    } catch (error) {
      toast.error(error.message || "Unable to save lead");
    } finally {
      setLoading(false);
    }
  };

  return { loading, fetchingLead, formData, errors, handleChange, handleCustomerSelect, handleClose, handleSave };
};
