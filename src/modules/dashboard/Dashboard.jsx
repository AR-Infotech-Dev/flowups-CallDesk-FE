import { ArcElement, CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip } from "chart.js";
import { useAuth } from "@auth/components/AuthProvider";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "./components/DashboardHeader";
import { DashboardPanels } from "./components/DashboardPanels";
import { DashboardStats } from "./components/DashboardStats";
import { ProductExpiryUpdateModal } from "./components/ProductExpiryUpdateModal";
import { useDashboardData } from "./hooks/useDashboardData";
import { useProductExpiryUpdate } from "./hooks/useProductExpiryUpdate";

ChartJS.register(ArcElement, CategoryScale, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip);
ChartJS.defaults.font.family = "Inter, ui-sans-serif, system-ui, sans-serif";

export function Dashboard() {
  const navigate = useNavigate();
  const { authSession } = useAuth();
  const roleSlug = authSession?.user?.role_slug || "user";

  const {
    dashboard,
    loadDashboard,
    loadingDashboard,
    dashboardError,
    dashboardFilter,
    setDashboardFilterValue,
    clearDashboardFilter,
    adminView,
  } = useDashboardData({ roleSlug });

  const {
    openProductExpiryModal,
    saveProductExpiry,
    expiryModal,
    setExpiryModal,
    closeProductExpiryModal,
    validateExpiryDate,
  } = useProductExpiryUpdate({ loadDashboard });

  const navigateTickets = () => {
    navigate("/tickets");
  };

  const navigateProductExpiry = () => {
    navigate("/dashboard/product-expiry");
  };

  const openQuotationFollowup = (followup) => {
    navigate("/quotations", { state: { previewQuotationId: followup.quotation_id } });
  };

  const handleRenewAmc = (amc) => {
    navigate("/customers", {
      state: {
        openCustomer: {
          customer_id: amc.id,
          getBackTo: "/dashboard",
          action: "amc_expiry",
        },
      },
    });
  };

  return (
    <main className="dashboard-page">
      <DashboardHeader
        dashboard={dashboard}
        dashboardFilter={dashboardFilter}
        loadingDashboard={loadingDashboard}
        dashboardError={dashboardError}
        onFilterChange={setDashboardFilterValue}
        onClearFilter={clearDashboardFilter}
        onRefresh={loadDashboard}
      />

      <DashboardStats stats={dashboard.stats} />

      <DashboardPanels
        dashboard={dashboard}
        adminView={adminView}
        onNavigateTickets={navigateTickets}
        onNavigateProductExpiry={navigateProductExpiry}
        onRenewAmc={handleRenewAmc}
        onUpdateProductExpiry={openProductExpiryModal}
        onOpenQuotationFollowup={openQuotationFollowup}
      />

      <ProductExpiryUpdateModal
        alert={expiryModal.alert}
        loading={expiryModal.loading}
        saving={expiryModal.saving}
        expiryDate={expiryModal.expiryDate}
        error={expiryModal.error}
        onExpiryDateChange={(value) => setExpiryModal((current) => ({
          ...current,
          expiryDate: value,
          error: validateExpiryDate(value, current.alert?.expiry_date),
        }))}
        onClose={closeProductExpiryModal}
        onSave={saveProductExpiry}
      />
    </main>
  );
}

export default Dashboard;
