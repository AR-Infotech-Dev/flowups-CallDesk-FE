import {
  Gauge,
  LayoutGrid,
  MapPin,
  Package,
  Shapes,
  Ticket,
  User,
  Users,
} from "lucide-react";

export const accessIdentities = [
  {
    id: "alex-rivera",
    name: "Alex Rivera",
    email: "alex@example.com",
    role: "Super Admin",
    badge: "SUPER ADMIN",
    initials: "AR",
  },
  {
    id: "support-lead",
    name: "Support Lead",
    email: "support@example.com",
    role: "Support Lead",
    badge: "ROLE",
    initials: "SL",
  },
  {
    id: "manager",
    name: "Manager",
    email: "manager@example.com",
    role: "Manager",
    badge: "ROLE",
    initials: "MG",
  },
];

export const accessModules = [
  {
    id: "dashboardddd",
    name: "Dashboard",
    icon: LayoutGrid,
    supports: { view: true, add: false, edit: false, delete: false },
    permissions: { view: true, add: false, edit: false, delete: false },
    fields: [
      { key: "summary_cards", label: "Summary Cards", enabled: true },
      { key: "activity_feed", label: "Activity Feed", enabled: true },
      { key: "reports", label: "Reports", enabled: true },
    ],
  },
  {
    id: "user-markers",
    name: "User Markers",
    icon: MapPin,
    supports: { view: true, add: true, edit: true, delete: true },
    permissions: { view: true, add: true, edit: false, delete: false },
    fields: [
      { key: "marker_name", label: "Marker Name", enabled: true },
      { key: "location", label: "Location", enabled: true },
      { key: "assigned_user", label: "Assigned User", enabled: false },
    ],
  },
  {
    id: "users",
    name: "Users",
    icon: User,
    supports: { view: true, add: true, edit: true, delete: true },
    permissions: { view: true, add: true, edit: true, delete: false },
    fields: [
      { key: "name", label: "Name", enabled: true },
      { key: "email", label: "Email", enabled: true },
      { key: "role", label: "Role", enabled: true },
      { key: "status", label: "Status", enabled: false },
    ],
  },
  {
    id: "customers",
    name: "Customers",
    icon: Gauge,
    supports: { view: true, add: true, edit: true, delete: true },
    permissions: { view: true, add: true, edit: false, delete: false },
    fields: [
      { key: "name", label: "Customer Name", enabled: true },
      { key: "mobile_no", label: "Mobile No", enabled: true },
      { key: "billing_details", label: "Billing Details", enabled: false },
      { key: "product_ids", label: "Products", enabled: true },
    ],
  },
  {
    id: "products",
    name: "Products",
    icon: Package,
    supports: { view: true, add: true, edit: true, delete: true },
    permissions: { view: true, add: true, edit: false, delete: false },
    fields: [
      { key: "product_name", label: "Product Name", enabled: true },
      { key: "product_type", label: "Product Type", enabled: true },
      { key: "product_description", label: "Description", enabled: true },
    ],
  },
  {
    id: "tickets",
    name: "Tickets",
    icon: Ticket,
    supports: { view: true, add: true, edit: true, delete: true },
    permissions: { view: true, add: true, edit: true, delete: true },
    fields: [
      { key: "client_id", label: "Client", enabled: true },
      { key: "description", label: "Description", enabled: true },
      { key: "assignee", label: "Assignee", enabled: true },
      { key: "priority", label: "Priority", enabled: true },
    ],
  },
  {
    id: "category",
    name: "Category",
    icon: Shapes,
    supports: { view: true, add: true, edit: true, delete: true },
    permissions: { view: true, add: false, edit: false, delete: false },
    fields: [
      { key: "category_name", label: "Category Name", enabled: true },
      { key: "color", label: "Color", enabled: false },
      { key: "parent", label: "Parent Category", enabled: false },
    ],
  },
];

export const accessPermissionColumns = [
  { key: "view", label: "View" },
  { key: "add", label: "Add" },
  { key: "edit", label: "Edit" },
  { key: "delete", label: "Delete" },
];
