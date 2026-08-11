import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  getQuotationDetails,
  saveQuotation,
} from "../data/quotations.service";
import { quotationsModuleSchema } from "../data/module.schema";
import {
  calculateTotals,
  createInitialQuotation,
  emptyQuotationItem,
  getQuotationIdentifier,
  normalizeQuotationData,
} from "../utils/quotations.utils";

const getValidationErrors = (validationResult) => {
  const nextErrors = {};

  validationResult.error.issues.forEach((issue) => {
    if (issue.path[0] === "items" && Number.isInteger(issue.path[1])) {
      nextErrors[`item_${issue.path[1]}_${issue.path[2]}`] = issue.message;
      return;
    }

    nextErrors[issue.path[0] || "items"] = issue.message;
  });

  return nextErrors;
};

export const useQuotationForm = ({ isOpen, onClose, onAfterSave, selectedQuotation }) => {
  const [loading, setLoading] = useState(false);
  const [fetchingQuotation, setFetchingQuotation] = useState(false);
  const [formData, setFormData] = useState(createInitialQuotation);
  const [errors, setErrors] = useState({});
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [newLeadInitialValues, setNewLeadInitialValues] = useState({});
  const [selectedParty, setSelectedParty] = useState({});
  const [pendingPartySelect, setPendingPartySelect] = useState(null);

  const mode = selectedQuotation ? "edit" : "create";
  const quotationID = getQuotationIdentifier(selectedQuotation);
  const totals = useMemo(() => calculateTotals(formData.items), [formData.items]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setFetchingQuotation(true);
    setErrors({});

    (quotationID ? getQuotationDetails(quotationID) : Promise.resolve(null))
      .then((detailsResponse) => {
        if (!isMounted) return;

        const quotationData = detailsResponse?.success
          ? normalizeQuotationData(detailsResponse.data)
          : createInitialQuotation();
        setFormData(quotationData);
        const isLead = Boolean(quotationData.lead_id && !quotationData.customer_id);
        setFormData({
          ...quotationData,
          party_id: isLead ? `lead:${quotationData.lead_id}` : quotationData.customer_id || "",
        });
        setSelectedParty(isLead ? {
          entity_type: "lead",
          lead_id: quotationData.lead_id,
          name: quotationData.lead_name || quotationData.name || "",
        } : quotationData.customer_id ? {
          entity_type: "customer",
          customer_id: quotationData.customer_id,
          name: quotationData.customer_name || quotationData.name || "",
        } : {});
      })
      .catch((error) => {
        if (!isMounted) return;
        setFormData(createInitialQuotation());
        setSelectedParty({});
        toast.error(error.message || "Unable to load quotation details");
      })
      .finally(() => {
        if (isMounted) setFetchingQuotation(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, quotationID]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => {
      if (name !== "party_id") return { ...current, [name]: value };
      const leadMatch = String(value || "").match(/^lead:(\d+)$/);
      return {
        ...current,
        party_id: value,
        customer_id: leadMatch ? "" : value,
        lead_id: leadMatch ? Number(leadMatch[1]) : "",
      };
    });
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const changeItem = (index, key, value) => {
    setFormData((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        if (key === "product_id") {
          return {
            ...item,
            product_id: value,
            ...(!value ? { product_name: "", rate: 0, gst_rate: 0 } : {}),
          };
        }

        return { ...item, [key]: value };
      }),
    }));

    setErrors((current) => ({
      ...current,
      [`item_${index}_${key}`]: "",
    }));
  };

  const selectProductItem = (index, option = {}) => {
    const product = option?.original || option;

    setFormData((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        if (!option?.value && !product?.product_id) {
          return {
            ...item,
            product_id: "",
            product_name: "",
            rate: 0,
            gst_rate: 0,
          };
        }

        return {
          ...item,
          product_id: option?.value ?? product.product_id ?? "",
          product_name: product.product_name || product.label || option?.label || "",
          rate: product.rate ?? item.rate ?? 0,
          gst_rate: product.gst_rate ?? item.gst_rate ?? 0,
        };
      }),
    }));

    setErrors((current) => ({
      ...current,
      [`item_${index}_product_id`]: "",
      [`item_${index}_product_name`]: "",
    }));
  };

  const selectParty = (field, option = {}) => {
    if (field?.name !== "party_id") return;
    const party = option?.original || option || {};
    setSelectedParty(party);
    if (!option?.value && !party?.customer_id && !party?.lead_id) {
      setFormData((current) => ({ ...current, party_id: "", customer_id: "", lead_id: "" }));
    }
  };

  const addItem = () => {
    setFormData((current) => ({ ...current, items: [...current.items, emptyQuotationItem()] }));
  };

  const removeItem = (index) => {
    setFormData((current) => ({
      ...current,
      items: current.items.length > 1 ? current.items.filter((_, itemIndex) => itemIndex !== index) : current.items,
    }));
  };

  const handleClose = () => {
    setFormData(createInitialQuotation());
    setSelectedParty({});
    setIsLeadFormOpen(false);
    setNewLeadInitialValues({});
    setPendingPartySelect(null);
    setErrors({});
    onClose?.();
  };

  const handleSave = async (status) => {
    const payload = { ...formData, quotation_status: status || formData.quotation_status };
    const validationResult = quotationsModuleSchema.validationSchema.safeParse(payload);

    if (!validationResult.success) {
      setErrors(getValidationErrors(validationResult));
      return;
    }

    setLoading(true);
    const response = await saveQuotation({ mode, quotationID, formData: payload });
    setLoading(false);

    if (!response.success) {
      toast.error(response.message || "Unable to save quotation");
      return;
    }

    toast.success(`Quotation ${mode === "create" ? "created" : "updated"} successfully`);
    handleClose();
    onAfterSave?.();
  };

  const openLeadCreate = ({ searchText = "", selectOption } = {}) => {
    setNewLeadInitialValues(searchText ? { name: searchText } : {});
    setPendingPartySelect(() => selectOption);
    setIsLeadFormOpen(true);
  };
  const closeLeadForm = () => {
    setIsLeadFormOpen(false);
    setPendingPartySelect(null);
    setNewLeadInitialValues({});
  };

  const handleLeadSaved = async (res = {}, payload = {}) => {
    try {
      const responseLead = Array.isArray(res?.data) ? res.data[0] : res?.data;
      const leadId = responseLead?.lead_id || responseLead?.insertId || res?.lead_id || res?.insertId;
      if (!leadId) {
        toast.error("Lead saved, but lead id was not received");
        return;
      }
      const lead = { ...payload, ...(responseLead || {}), entity_type: "lead", lead_id: leadId };
      const option = {
        value: `lead:${leadId}`,
        label: lead.name || "Unnamed Lead",
        original: lead,
      };
      pendingPartySelect?.(option);
      setSelectedParty(lead);
      setFormData((current) => ({
        ...current,
        party_id: option.value,
        customer_id: "",
        lead_id: leadId,
      }));
    } catch (error) {
      toast.error(error.message || "Unable to select saved lead");
    } finally {
      setPendingPartySelect(null);
      setNewLeadInitialValues({});
    }
  };

  return {
    loading,
    fetchingQuotation,
    formData,
    errors,
    selectedParty,
    totals,
    isLeadFormOpen,
    newLeadInitialValues,
    openLeadCreate,
    closeLeadForm,
    handleLeadSaved,
    handleClose,
    handleChange,
    selectParty,
    handleSave,
    changeItem,
    selectProductItem,
    addItem,
    removeItem,
  };
};
