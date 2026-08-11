import { leadsModuleSchema } from "../data/module.schema";

export const getLeadIdentifier = (lead) => lead?.lead_id || lead?.id || null;

export const normalizeLeadData = (lead = {}) => ({
  ...leadsModuleSchema.form.initialValues,
  ...(lead || {}),
  customer_id: lead?.customer_id || "",
  next_followup_date: lead?.next_followup_date ? String(lead.next_followup_date).replace(" ", "T").slice(0, 16) : "",
});

export const normalizeLeadPayload = (data = {}) => ({
  ...data,
  customer_id: data.customer_id || null,
  assigned_to: data.assigned_to || null,
  next_followup_date: data.next_followup_date || null,
  email: data.email || null,
  lost_reason: data.lead_status === "lost" ? data.lost_reason : null,
});
