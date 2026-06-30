import { useState } from "react";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@store/hooks";
import {
  fetchAmcReminders,
  selectAmcLoading,
  selectAmcPage,
  selectAmcPagination,
  selectAmcRows,
  setAmcPage,
} from "../data/amcReminder.slice";
import {
  fetchAmcActivity,
  getDefaultAmcCallDescription,
  makeAmcCallTicket,
  scheduleAmcVisit,
  sendAmcReminder,
} from "../data/amcReminders.service";
import {
  toLocalDateTimeInputValue,
  toMysqlDateTime,
} from "../utils/amcReimders.utils";

export const useAmcRemindersModule = ({
  filterState,
  effectiveOrder,
  effectiveOrderBy,
  canSendReminder,
}) => {
  const dispatch = useAppDispatch();

  const page = useAppSelector(selectAmcPage);
  const customers = useAppSelector(selectAmcRows);
  const pagination = useAppSelector(selectAmcPagination);
  const loading = useAppSelector(selectAmcLoading);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [includeReport, setIncludeReport] = useState(false);
  const [sendingCustomerId, setSendingCustomerId] = useState(null);
  const [callingCustomerId, setCallingCustomerId] = useState(null);
  const [callCustomer, setCallCustomer] = useState(null);
  const [callDescription, setCallDescription] = useState("");
  const [visitCustomer, setVisitCustomer] = useState(null);
  const [schedulingVisitCustomerId, setSchedulingVisitCustomerId] = useState(null);
  const [activityCustomer, setActivityCustomer] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const [activityTab, setActivityTab] = useState("calls");
  const [activityLoadingCustomerId, setActivityLoadingCustomerId] = useState(null);
  const [visitFormData, setVisitFormData] = useState({
    visit_scheduled_at: toLocalDateTimeInputValue(),
    visit_details: "",
  });

  const handlePageChange = (nextPage) => {
    dispatch(setAmcPage(nextPage));
  };

  const getReminderList = async () => {
    const action = await dispatch(fetchAmcReminders({
      filterState,
      page,
      order: effectiveOrder,
      order_by: effectiveOrderBy,
    }));

    if (fetchAmcReminders.rejected.match(action)) {
      toast.error(action.payload || "Error while fetching AMC reminders");
    }
  };

  const openReminderModal = (customer) => {
    if (!canSendReminder) {
      toast.error("You do not have permission to send reminders.");
      return;
    }

    if (!customer?.email) {
      toast.error("Customer email is required before sending reminder.");
      return;
    }

    if (Number(customer?.sent_today || 0)) {
      toast.error("Reminder already sent today for this customer.");
      return;
    }

    setSelectedCustomer(customer);
    setIncludeReport(false);
  };

  const closeReminderModal = () => {
    if (sendingCustomerId) return;

    setSelectedCustomer(null);
    setIncludeReport(false);
  };

  const handleSendReminder = async () => {
    const customerId = selectedCustomer?.customer_id;
    if (!customerId) {
      toast.error("Customer id is missing.");
      return;
    }

    setSendingCustomerId(customerId);

    const response = await sendAmcReminder({
      customerId,
      includeReport,
    });

    setSendingCustomerId(null);

    if (response?.success) {
      toast.success(response?.message || "AMC reminder sent successfully.");
      setSelectedCustomer(null);
      setIncludeReport(false);
      await getReminderList();
      return;
    }

    toast.error(response?.message || "Unable to send AMC reminder.");
  };

  const handleMakeCall = async (customer) => {
    const customerId = customer?.customer_id;
    if (!customerId) {
      toast.error("Customer id is missing.");
      return;
    }

    if (!canSendReminder) {
      toast.error("You do not have permission to create AMC calls.");
      return;
    }

    setCallCustomer(customer);
    setCallDescription(getDefaultAmcCallDescription(customer));
  };

  const closeCallModal = () => {
    if (callingCustomerId) return;
    setCallCustomer(null);
    setCallDescription("");
  };

  const handleCallDescriptionChange = (value) => {
    setCallDescription(value);
  };

  const handleConfirmMakeCall = async () => {
    const customerId = callCustomer?.customer_id;
    const remarks = String(callDescription || "").trim();

    if (!customerId) {
      toast.error("Customer id is missing.");
      return;
    }

    if (!remarks) {
      toast.error("Call description required!");
      return;
    }

    setCallingCustomerId(customerId);

    const response = await makeAmcCallTicket({
      customer: callCustomer,
      remarks,
    });

    setCallingCustomerId(null);

    if (response?.success) {
      toast.success(response?.message || "AMC call ticket created successfully.");
      setCallCustomer(null);
      setCallDescription("");
      await getReminderList();
      return;
    }

    toast.error(response?.message || response?.msg || "Unable to create AMC call ticket.");
  };

  const handleAddVisit = (customer) => {
    if (!canSendReminder) {
      toast.error("You do not have permission to schedule AMC visits.");
      return;
    }

    setVisitCustomer(customer);
    setVisitFormData({
      visit_scheduled_at: toLocalDateTimeInputValue(),
      visit_details: "",
    });
  };

  const closeVisitModal = () => {
    if (schedulingVisitCustomerId) return;
    setVisitCustomer(null);
  };

  const handleVisitFieldChange = (field, value) => {
    setVisitFormData((current) => ({ ...current, [field]: value }));
  };

  const handleScheduleVisit = async () => {
    const customerId = visitCustomer?.customer_id;
    if (!customerId) {
      toast.error("Customer id is missing.");
      return;
    }
    if (!visitFormData.visit_details) {
      toast.error("Visit details required!");
      return;
    }

    setSchedulingVisitCustomerId(customerId);

    const response = await scheduleAmcVisit({
      customer: visitCustomer,
      visitScheduledAt: toMysqlDateTime(visitFormData.visit_scheduled_at),
      visitDetails: visitFormData.visit_details,
    });

    setSchedulingVisitCustomerId(null);

    if (response?.success) {
      toast.success(response?.message || "AMC visit scheduled successfully.");
      setVisitCustomer(null);
      await getReminderList();
      return;
    }

    toast.error(response?.message || response?.msg || "Unable to schedule AMC visit.");
  };

  const handleOpenActivity = async (customer) => {
    const customerId = customer?.customer_id;
    if (!customerId) {
      toast.error("Customer id is missing.");
      return;
    }

    setActivityLoadingCustomerId(customerId);
    const response = await fetchAmcActivity({ customerId });
    setActivityLoadingCustomerId(null);

    if (response?.success) {
      setActivityCustomer(customer);
      setActivityData(response.data || {});
      setActivityTab("calls");
      return;
    }

    toast.error(response?.message || "Unable to fetch AMC activity.");
  };

  const refreshActivity = async () => {
    const customerId = activityCustomer?.customer_id;
    if (!customerId) return;

    const response = await fetchAmcActivity({ customerId });

    if (response?.success) {
      setActivityData(response.data || {});
      await getReminderList();
      return;
    }

    toast.error(response?.message || "Unable to refresh AMC activity.");
  };

  const closeActivityModal = () => {
    setActivityCustomer(null);
    setActivityData(null);
    setActivityTab("calls");
  };

  return {
    page,
    customers,
    pagination,
    loading,
    selectedCustomer,
    includeReport,
    sendingCustomerId,
    callingCustomerId,
    callCustomer,
    callDescription,
    visitCustomer,
    schedulingVisitCustomerId,
    activityCustomer,
    activityData,
    activityTab,
    activityLoadingCustomerId,
    visitFormData,
    setIncludeReport,
    setActivityTab,
    handlePageChange,
    getReminderList,
    openReminderModal,
    closeReminderModal,
    handleSendReminder,
    handleMakeCall,
    closeCallModal,
    handleCallDescriptionChange,
    handleConfirmMakeCall,
    handleAddVisit,
    closeVisitModal,
    handleVisitFieldChange,
    handleScheduleVisit,
    handleOpenActivity,
    refreshActivity,
    closeActivityModal,
  };
};
