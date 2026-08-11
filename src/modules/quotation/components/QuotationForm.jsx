import { useMemo } from "react";
import { X } from "lucide-react";
import DynamicModuleForm from "@components/ui/DynamicModuleForm";
import ActionButton from "@components/ui/ActionButton";
import FlyoutPanel from "@components/ui/FlyoutPanel";
import Spinner from "@components/ui/Spinner";
import { useQuotationForm } from "../hooks/useQuotationsForm";
import { quotationsModuleSchema } from "../data/module.schema";
import { calculateLine, formatMoney } from "../utils/quotations.utils";
import QuotationItemsSection from "./QuotationItemsSection";
import "../quotation.css";
import LeadForm from "@/modules/leads/components/LeadForm";

function QuotationForm({ isOpen, onClose, selectedQuotation, onAfterSave, menu_id }) {
  const form = useQuotationForm({ isOpen, onClose, selectedQuotation, onAfterSave });
  const sections = useMemo(
    () => quotationsModuleSchema.form.sections.map((section) => ({
      ...section,
      fields: section.fields.map((field) => field.name === "party_id" ? {
        ...field,
        config: {
          ...field.config,
          selectedOption: form.formData.party_id && form.selectedParty?.name ? {
            value: form.formData.party_id,
            label: form.selectedParty.name,
            original: form.selectedParty,
          } : null,
        },
      } : field),
    })),
    [form.formData.party_id, form.selectedParty]
  );

  if (!isOpen) return null;

  return (
    <>
      <FlyoutPanel
        isOpen={isOpen}
        onClose={form.handleClose}
        title={selectedQuotation ? `Edit Quotation ${selectedQuotation.quotation_no || ""}` : "Create Quotation"}
        panelClassName="quotation-flyout"
        closeButton={(
          <button className="flyout-close" onClick={form.handleClose} type="button">
            <X size={18} />
          </button>
        )}
        footer={(
          <div className="quotation-footer-actions">
            <ActionButton variant="flyoutSecondary" onClick={form.handleClose}>Cancel</ActionButton>
            <ActionButton variant="flyoutSecondary" disabled={form.loading} onClick={() => form.handleSave("draft")}>
              Save Draft
            </ActionButton>
            <ActionButton disabled={form.loading} onClick={() => form.handleSave("sent")}>
              {form.loading ? <Spinner /> : null} Save & Send
            </ActionButton>
          </div>
        )}
      >
        {form.fetchingQuotation ? (
          <div className="p-8 text-center"><Spinner /></div>
        ) : (
          <div className="quotation-form-layout">
            <main className="quotation-form-main">
              <DynamicModuleForm
                sections={[sections[0], sections[1]]}
                values={form.formData}
                addNewHandlers={{
                  party_id: form.openLeadCreate,
                }}
                onChange={form.handleChange}
                onObjectSelect={form.selectParty}
                errors={form.errors}
                menuId={menu_id}
              />

              <QuotationItemsSection
                items={form.formData.items}
                errors={form.errors}
                onAdd={form.addItem}
                onChange={form.changeItem}
                onProductSelect={form.selectProductItem}
                onRemove={form.removeItem}
              />

              <div className="quotation-notes">
                <DynamicModuleForm
                  sections={[sections[2]]}
                  values={form.formData}
                  onChange={form.handleChange}
                  errors={form.errors}
                  menuId={menu_id}
                />
              </div>
            </main>

            <aside className="quotation-preview">
              <h3>QUOTATION</h3>
              <p>{form.selectedParty?.name || "Select Customer / Lead"}</p>
              <div className="quotation-preview-lines">
                {form.formData.items.map((item, index) => (
                  <div key={`${item.product_id || "line"}-${index}`}>
                    <span>{item.product_name || `Product ${index + 1}`}</span>
                    <b>{formatMoney(calculateLine(item).total)}</b>
                  </div>
                ))}
              </div>
              <div className="quotation-totals">
                <div><span>Subtotal</span><b>{formatMoney(form.totals.subtotal)}</b></div>
                <div><span>Discount</span><b>- {formatMoney(form.totals.discount_total)}</b></div>
                <div><span>GST</span><b>{formatMoney(form.totals.tax_total)}</b></div>
                <div className="grand"><span>Grand Total</span><b>{formatMoney(form.totals.grand_total)}</b></div>
              </div>
            </aside>
          </div>
        )}
      </FlyoutPanel>
      <LeadForm
        isOpen={form.isLeadFormOpen}
        onClose={form.closeLeadForm}
        selectedLead={null}
        initialValues={form.newLeadInitialValues}
        onAfterSave={form.handleLeadSaved}
        menu_id={menu_id}
      />
    </>

  );
}

export default QuotationForm;
