import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useLocation, useNavigate } from "react-router-dom";
import { quotationsModuleSchema } from "./data/module.schema";
import { useQuotationsTableConfig } from "./hooks/useQuotationsTableConfig";
import { useQuotationsModule } from "./hooks/useQuotationsModule";
import { getNextSortConfig } from "@utils/sorting";
import { useModuleFilters, useAppSelector } from "@store/hooks";
import { selectQuotationsRows } from "./data/quotations.slice";

import ModuleControls from "@shared/ModuleControls";
import ModulePageLayout from "@shared/ModulePageLayout";
import ModulePagination from "@shared/ModulePagination";
import DynamicFilter from "@components/dynamic-filter";
import ResizableTable from "@components/table/ResizableTable";
import useMenuPermissions from "@auth/utils/useMenuPermissions";
import QuotationForm from "./components/QuotationForm";
import QuotationTableRow from "./components/QuotationTableRow";
import QuotationPreviewFlyout from "./components/QuotationPreviewFlyout";
import { changeQuotationStatus, reviseQuotation, sendQuotation, scheduleQuotationFollowup, completeQuotationFollowup, getQuotationDetails } from "./data/quotations.service";

const QUOTATION_SWAL_OPTIONS = {
  width: 380,
  padding: "0",
  customClass: {
    popup: "quotation-swal-popup",
    title: "quotation-swal-title",
    htmlContainer: "quotation-swal-content",
    input: "quotation-swal-input",
    actions: "quotation-swal-actions",
    confirmButton: "quotation-swal-confirm",
    cancelButton: "quotation-swal-cancel",
  },
};

function QuotationsModulePage({ menu_id }) {

  const location = useLocation();
  const navigate = useNavigate();

  const resolvedMenuID = menu_id || quotationsModuleSchema.menu_id || null;
  const permissions = useMenuPermissions(resolvedMenuID);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);
  const [previewQuotation, setPreviewQuotation] = useState(null);
  const quotationList = useAppSelector(selectQuotationsRows);
  const { filterState, setSearchText, applyFilterPayload, setSort, clearFilters, } = useModuleFilters("quotation-master", quotationList);
  const { pagination, page, loading, deleting, selectedRowIds, getQuotationList, handlePageChange, handleToggleRow, handleToggleAllRows, handleDeleteSelected, handleDeleteRow, } = useQuotationsModule({ filterState });
  const { sortConfig, resolvedColumns, defaultVisibleColumnKeys, resolvedFilterFields, } = useQuotationsTableConfig({ resolvedMenuID, filterState });

  const updateLifecycleStatus = async (quotation, status) => {
    const needsReason = status === "rejected" || status === "revision_required";
    const actionLabel = status.replaceAll("_", " ");
    const result = await Swal.fire({
      ...QUOTATION_SWAL_OPTIONS,
      title: `${status === "approved" ? "Approve" : "Update"} ${quotation.quotation_no}?`,
      text: `Quotation will be marked as ${actionLabel}.`,
      input: "textarea",
      inputLabel: needsReason
        ? (status === "rejected" ? "Rejection reason" : "Revision reason")
        : "Approval notes (optional)",
      inputPlaceholder: needsReason ? "Enter reason..." : "Enter notes...",
      showCancelButton: true,
      confirmButtonText: status === "approved" ? "Approve" : "Confirm",
      confirmButtonColor: status === "approved" ? "#16a34a" : "#2563eb",
      cancelButtonText: "Cancel",
      inputValidator: needsReason
        ? (value) => String(value || "").trim() ? undefined : "Reason is required"
        : undefined,
    });
    if (!result.isConfirmed) return false;
    const remarks = String(result.value || "").trim();
    const response = await changeQuotationStatus(quotation.quotation_id, status, remarks || "");
    if (!response.success) return toast.error(response.message || "Unable to update quotation status");
    toast.success(response.message);
    await getQuotationList();
    setPreviewQuotation((current) => current?.quotation_id === quotation.quotation_id
      ? { ...current, quotation_status: status }
      : current);
    return true;
  };    

  const createRevision = async (quotation) => {
    const result = await Swal.fire({
      ...QUOTATION_SWAL_OPTIONS,
      title: `Create revision for ${quotation.quotation_no}?`,
      input: "textarea",
      inputLabel: "Revision reason",
      inputPlaceholder: "Enter revision reason...",
      showCancelButton: true,
      confirmButtonText: "Create Revision",
      confirmButtonColor: "#d97706",
      cancelButtonText: "Cancel",
      inputValidator: (value) => String(value || "").trim() ? undefined : "Revision reason is required",
    });
    if (!result.isConfirmed) return false;
    const reason = String(result.value || "").trim();
    const response = await reviseQuotation(quotation.quotation_id, reason);
    if (!response.success) return toast.error(response.message || "Unable to create quotation revision");
    const revisedQuotationId = response?.data?.quotation_id || response?.quotation_id;
    if (!revisedQuotationId) {
      toast.error("Revision created, but the new quotation could not be opened");
      await getQuotationList();
      return false;
    }
    toast.success(response.message);
    await getQuotationList();
    setPreviewQuotation(null);
    setSelectedQuotation({
      quotation_id: revisedQuotationId,
      quotation_no: response?.data?.quotation_no || response?.quotation_no || "",
      quotation_status: "draft",
    });
    setIsFlyoutOpen(true);
    return true;
  };

  const sendPreviewQuotation = async (quotation) => {
    const defaultEmail = quotation?.email || quotation?.customer_email || quotation?.lead_email || "";
    const result = await Swal.fire({
      ...QUOTATION_SWAL_OPTIONS,
      title: `Send ${quotation.quotation_no}`,
      text: "Quotation PDF will be attached to the email.",
      input: "email",
      inputLabel: "Recipient email",
      inputValue: defaultEmail,
      inputPlaceholder: "customer@example.com",
      showCancelButton: true,
      confirmButtonText: "Send Quotation",
      confirmButtonColor: "#2563eb",
      cancelButtonText: "Cancel",
      inputValidator: (value) => String(value || "").trim() ? undefined : "Recipient email is required",
    });
    if (!result.isConfirmed) return false;
    const recipientEmail = String(result.value || "").trim();

    const response = await sendQuotation(quotation.quotation_id, recipientEmail);
    if (!response.success) {
      toast.error(response.message || "Unable to send quotation");
      return false;
    }

    toast.success(response.message || "Quotation sent successfully");
    await getQuotationList();
    setPreviewQuotation((current) => current?.quotation_id === quotation.quotation_id
      ? { ...current, quotation_status: "sent" }
      : current);
    return true;
  };

  const scheduleFollowup = async (quotation) => {
    const defaultDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    defaultDate.setMinutes(defaultDate.getMinutes() - defaultDate.getTimezoneOffset());
    const result = await Swal.fire({
      ...QUOTATION_SWAL_OPTIONS,
      title: `Schedule follow-up`,
      html: `
        <label class="quotation-swal-field-label">Date & time</label>
        <input id="quotation-followup-date" class="swal2-input quotation-followup-field" type="datetime-local" value="${defaultDate.toISOString().slice(0, 16)}">
        <label class="quotation-swal-field-label">Type</label>
        <select id="quotation-followup-type" class="swal2-select quotation-followup-field"><option value="call">Call</option><option value="whatsapp">WhatsApp</option><option value="email">Email</option><option value="meeting">Meeting</option></select>
        <label class="quotation-swal-field-label">Notes</label>
        <textarea id="quotation-followup-notes" class="swal2-textarea quotation-followup-field" placeholder="Follow-up notes"></textarea>`,
      showCancelButton: true,
      confirmButtonText: "Schedule",
      confirmButtonColor: "#2563eb",
      preConfirm: () => {
        const followup_date = document.getElementById("quotation-followup-date")?.value;
        if (!followup_date) return Swal.showValidationMessage("Follow-up date is required");
        return { followup_date, followup_type: document.getElementById("quotation-followup-type")?.value, notes: document.getElementById("quotation-followup-notes")?.value };
      },
    });
    if (!result.isConfirmed) return false;
    const response = await scheduleQuotationFollowup(quotation.quotation_id, result.value);
    if (!response.success) return toast.error(response.message || "Unable to schedule follow-up");
    toast.success(response.message);
    return true;
  };

  const completeFollowup = async (quotation, followup) => {
    const result = await Swal.fire({
      ...QUOTATION_SWAL_OPTIONS,
      title: "Complete follow-up",
      html: `
        <label class="quotation-swal-field-label">Result</label>
        <select id="quotation-followup-result" class="swal2-select quotation-followup-field"><option value="">Select result</option><option value="no_response">No response</option><option value="callback">Call back later</option><option value="interested">Interested</option><option value="revision_requested">Revision requested</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select>
        <label class="quotation-swal-field-label">Next follow-up (for ongoing discussion)</label>
        <input id="quotation-next-followup" class="swal2-input quotation-followup-field" type="datetime-local">
        <label class="quotation-swal-field-label">Notes</label>
        <textarea id="quotation-complete-notes" class="swal2-textarea quotation-followup-field" placeholder="Discussion notes"></textarea>`,
      showCancelButton: true,
      confirmButtonText: "Complete",
      preConfirm: () => {
        const followup_result = document.getElementById("quotation-followup-result")?.value;
        const next_followup_date = document.getElementById("quotation-next-followup")?.value;
        if (!followup_result) return Swal.showValidationMessage("Result is required");
        if (["no_response", "callback", "interested"].includes(followup_result) && !next_followup_date) return Swal.showValidationMessage("Next follow-up date is required");
        return { followup_result, next_followup_date: next_followup_date || null, notes: document.getElementById("quotation-complete-notes")?.value };
      },
    });
    if (!result.isConfirmed) return false;
    const response = await completeQuotationFollowup(quotation.quotation_id, followup.followup_id, result.value);
    if (!response.success) return toast.error(response.message || "Unable to complete follow-up");
    toast.success(response.message);
    if (result.value.followup_result === "approved") await updateLifecycleStatus(quotation, "approved");
    if (result.value.followup_result === "rejected") await updateLifecycleStatus(quotation, "rejected");
    if (result.value.followup_result === "revision_requested") await createRevision(quotation);
    return true;
  };

  const handleSortChange = (columnKey) => {
    const nextSort = getNextSortConfig(sortConfig, columnKey);

    if (page !== 1) {
      handlePageChange(1);
    }

    setSort({
      order_by: nextSort.key,
      order: nextSort.direction.toUpperCase(),
    });
  };

  useEffect(() => {
    getQuotationList();
  }, [page, filterState.searchText, filterState.order, filterState.order_by, JSON.stringify(filterState.filters)]);

  useEffect(() => {
    const quotationId = Number(location.state?.previewQuotationId || 0);
    if (!quotationId) return;
    let active = true;
    getQuotationDetails(quotationId).then((response) => {
      if (active) setPreviewQuotation(response?.success ? response.data : { quotation_id: quotationId });
    });
    navigate(location.pathname, { replace: true, state: {} });
    return () => { active = false; };
  }, [location.pathname, location.state?.previewQuotationId, navigate]);

  useEffect(() => {
    if (page !== 1) {
      handlePageChange(1)
    }
  }, [filterState.searchText, filterState.order, filterState.order_by, JSON.stringify(filterState.filters)]);

  return (
    <>
      <ModulePageLayout
        title={quotationsModuleSchema.title}
        description={quotationsModuleSchema.description}
        controls={
          <ModuleControls
            canCreate={permissions.canAdd}
            canDelete={permissions.canDelete}
            loading={loading}
            onRefresh={getQuotationList}
            onCreate={() => {
              setSelectedQuotation(null);
              setIsFlyoutOpen(true);
            }}
            onDeleteSelected={handleDeleteSelected}
            showDelete={selectedRowIds.length !== 0}
            deleteDisabled={deleting || loading || selectedRowIds.length === 0}
            deleteLabel={`Delete Selected${selectedRowIds.length ? ` (${selectedRowIds.length})` : ""}`}
            deleting={deleting}
            filter={
              <DynamicFilter
                filterState={filterState}
                fields={resolvedFilterFields}
                savedFilters={quotationsModuleSchema.savedFilters}
                onSearch={setSearchText}
                onApplyFilters={applyFilterPayload}
                onSaveFilter={() => { }}
                onDeleteFilter={() => { }}
                onSelectSavedFilter={() => { }}
                onClearFilters={clearFilters}
              />
            }
          />
        }
        table={
          <ResizableTable
            loading={loading}
            menuId={resolvedMenuID}
            columns={resolvedColumns}
            rows={quotationList}
            storageKey="quotations-module-column-widths"
            defaultVisibleColumnKeys={defaultVisibleColumnKeys}
            sortConfig={sortConfig}
            onSortChange={handleSortChange}
            editRow={permissions.canEdit ? (quotation) => {
              if (quotation.quotation_status !== "draft") {
                toast.info("Only draft quotations can be edited. Create a revision instead.");
                return;
              }
              setSelectedQuotation(quotation);
              setIsFlyoutOpen(true);
            } : undefined}
            onDeleteRow={permissions.canDelete ? handleDeleteRow : undefined}
            actionColumnWidth={90}
            allowSelection={permissions.canDelete}
            selectedRowIds={selectedRowIds}
            onToggleRow={handleToggleRow}
            onToggleAllRows={handleToggleAllRows}
            renderRow={(row, index, columns, table) => (
              <QuotationTableRow
                row={row}
                index={index}
                columns={columns}
                table={table}
                onPreview={setPreviewQuotation}
              />
            )}
          />
        }
        footer={<ModulePagination pagination={pagination} onPageChange={handlePageChange} />}
      />
      <QuotationForm
        isOpen={isFlyoutOpen}
        onClose={() => setIsFlyoutOpen(false)}
        selectedQuotation={selectedQuotation}
        onAfterSave={getQuotationList}
        menu_id={resolvedMenuID}
      />
      <QuotationPreviewFlyout
        isOpen={Boolean(previewQuotation)}
        quotation={previewQuotation}
        onClose={() => setPreviewQuotation(null)}
        onSend={sendPreviewQuotation}
        onStatusChange={updateLifecycleStatus}
        onRevise={createRevision}
        onScheduleFollowup={scheduleFollowup}
        onCompleteFollowup={completeFollowup}
      />
    </>
  );
}

export default QuotationsModulePage;
