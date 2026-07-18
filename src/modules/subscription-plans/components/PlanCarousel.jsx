import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";

const DEFAULT_PLANS = [
  {
    plan_id: "starter",
    plan_name: "Starter",
    plan_code: "starter",
    billing_cycle: "monthly",
    base_price: "999.00",
    included_users: 3,
    extra_user_price: "199.00",
    customer_limit: 500,
    ticket_limit: 1000,
    features: {
      ticket_management: true,
      customer_management: true,
      performance_report: "basic",
      excel_export: true,
    },
  },
  {
    plan_id: "growth",
    plan_name: "Growth",
    plan_code: "growth",
    billing_cycle: "monthly",
    base_price: "2499.00",
    included_users: 10,
    extra_user_price: "149.00",
    customer_limit: 2000,
    ticket_limit: 5000,
    features: {
      amc_management: true,
      kanban_view: true,
      excel_import: true,
      performance_report: "advanced",
    },
  },
  {
    plan_id: "business",
    plan_name: "Business",
    plan_code: "business",
    billing_cycle: "monthly",
    base_price: "4999.00",
    included_users: 25,
    extra_user_price: "99.00",
    customer_limit: null,
    ticket_limit: null,
    features: {
      user_attendance_report: true,
      customer_wise_report: "advanced",
      product_expiry_report: true,
      notifications: true,
    },
  },
];

const FEATURE_LABELS = {
  ticket_management: "Ticket management",
  customer_management: "Customer management",
  amc_management: "AMC management",
  product_expiry_report: "Product expiry report",
  performance_report: "Performance report",
  customer_wise_report: "Customer-wise report",
  user_attendance_report: "Attendance report",
  excel_import: "Excel import",
  excel_export: "Excel export",
  dynamic_filters: "Dynamic filters",
  kanban_view: "Kanban view",
  notifications: "Notifications",
};

function formatCurrency(value) {
  const amount = Number(value || 0);
  return `Rs ${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatCycle(value) {
  if (!value) return "/ month";
  return `/ ${String(value).toLowerCase() === "yearly" ? "year" : "month"}`;
}

function formatLimit(value, label) {
  return `${value == null || value === "" ? "Unlimited" : value} ${label}`;
}

function formatFeatureValue(key, value) {
  const label = FEATURE_LABELS[key] || key.replaceAll("_", " ");

  if (value === false || value == null || value === "") return null;
  if (value === true) return label;
  return `${label}: ${value}`;
}

function buildPlanFeatures(plan = {}) {
  const limitFeatures = [
    formatLimit(plan.customer_limit, "customers"),
    formatLimit(plan.ticket_limit, "tickets"),
    `Extra user ${formatCurrency(plan.extra_user_price)}`,
  ];

  const moduleFeatures = Object.entries(plan.features || {})
    .map(([key, value]) => formatFeatureValue(key, value))
    .filter(Boolean);

  return [...limitFeatures, ...moduleFeatures].slice(0, 5);
}

function getPlanHighlight(plan = {}) {
  const code = String(plan.plan_code || plan.code || "").toLowerCase();

  if (code === "growth") return "Recommended";
  if (code === "business") return "Full suite";
  if (code === "starter") return "Starter pack";
  return plan.highlight || "Plan";
}

function normalizePlan(plan = {}) {
  return {
    ...plan,
    id: plan.plan_id || plan.id || plan.plan_code || plan.plan_name,
    name: plan.plan_name || plan.name || "Subscription Plan",
    price: plan.price || formatCurrency(plan.base_price),
    cycle: plan.cycle || formatCycle(plan.billing_cycle),
    users: plan.users || `${plan.included_users || 0} users included`,
    highlight: getPlanHighlight(plan),
    description: plan.description || `Includes ${formatLimit(plan.customer_limit, "customers")} and ${formatLimit(plan.ticket_limit, "tickets")}.`,
    displayFeatures: Array.isArray(plan.features) ? plan.features : buildPlanFeatures(plan),
  };
}

function normalizePlans(plans = []) {
  const sourcePlans = Array.isArray(plans) && plans.length ? plans : DEFAULT_PLANS;
  return sourcePlans.map(normalizePlan);
}

function getCircularItem(items, index) {
  const count = items.length;
  return items[((index % count) + count) % count];
}

function PlanCarousel({ plans = DEFAULT_PLANS, initialIndex = 1, onSelectPlan }) {
  const planItems = useMemo(() => normalizePlans(plans), [plans]);
  const [activeIndex, setActiveIndex] = useState(() => Math.min(Math.max(initialIndex, 0), planItems.length - 1));

  const visiblePlans = useMemo(() => {
    if (planItems.length === 1) {
      return [{ plan: planItems[0], index: 0, position: 0 }];
    }

    return [
      { plan: getCircularItem(planItems, activeIndex - 1), index: (activeIndex - 1 + planItems.length) % planItems.length, position: -1 },
      { plan: getCircularItem(planItems, activeIndex), index: activeIndex, position: 0 },
      { plan: getCircularItem(planItems, activeIndex + 1), index: (activeIndex + 1) % planItems.length, position: 1 },
    ];
  }, [activeIndex, planItems]);

  const goToPrevious = () => {
    setActiveIndex((current) => (current - 1 + planItems.length) % planItems.length);
  };

  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % planItems.length);
  };

  const handleSelect = (plan) => {
    onSelectPlan?.(plan);
  };

  return (
    <div className="module-content-panel">
      <section className="w-full overflow-hidden bg-white px-2 py-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          {/* <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Subscription Plans</p>
          <h3 className="text-lg font-semibold text-slate-900">Choose a plan</h3>
        </div> */}

          {planItems.length > 1 ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goToPrevious}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                aria-label="Previous plan"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={goToNext}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                aria-label="Next plan"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          ) : null}
        </div>

        <div className="relative mx-auto flex min-h-[360px] max-w-4xl items-center justify-center sm:min-h-[370px]">
          {visiblePlans.map(({ plan, index, position }) => {
            const isActive = index === activeIndex;
            const translateClass = position < 0 ? "-translate-x-[62%]" : position > 0 ? "translate-x-[62%]" : "translate-x-0";
            const scaleClass = isActive ? "scale-100" : "scale-90";
            const zClass = isActive ? "z-20" : "z-10";
            const opacityClass = isActive ? "opacity-100" : "opacity-75";

            return (
              <article
                key={`${plan.id || index}-${position}`}
                className={`absolute w-[78%] max-w-[360px] transform rounded-lg border bg-white p-5 shadow-lg transition-all duration-300 sm:w-[340px] ${translateClass} ${scaleClass} ${zClass} ${opacityClass} ${isActive ? "border-blue-500 shadow-blue-100" : "border-slate-200"}`}
                aria-hidden={!isActive}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                      {plan.highlight}
                    </span>
                    <h4 className="mt-3 text-xl font-bold text-slate-950">{plan.name}</h4>
                    <p className="mt-1 text-sm leading-5 text-slate-500">{plan.description}</p>
                  </div>
                </div>

                <div className="mb-4 rounded-md bg-slate-50 p-3">
                  <div className="flex items-end gap-1">
                    <span className="text-2xl font-bold text-slate-950">{plan.price}</span>
                    <span className="pb-1 text-xs font-medium text-slate-500">{plan.cycle}</span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-blue-700">{plan.users}</p>
                </div>

                <ul className="space-y-2.5 text-sm text-slate-700">
                  {(plan.displayFeatures || []).map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <Check size={13} />
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => (isActive ? handleSelect(plan) : setActiveIndex(index))}
                  className={`mt-5 h-9 w-full rounded-md text-sm font-semibold transition-colors ${isActive ? "bg-blue-600 text-white hover:bg-blue-700" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                >
                  {isActive ? "Select Plan" : "View Plan"}
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default PlanCarousel;
