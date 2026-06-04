# AI Assistant Handoff

Last updated: 2026-06-03

## Project Overview

This repository is the frontend for **FlowupS CallDesk**, a CRM/support desk application. It is built with React 18, Vite, React Router, Axios, Socket.IO, Chart.js, Leaflet, dnd-kit, React Hook Form, Zod, and Electron.

The app supports:

- Login, forgot password, and OTP password reset.
- Dynamic, backend-driven menu routing.
- Role/menu/field permission checks.
- Dashboard metrics and charts.
- User, customer, product, category, company, menu, ticket, AMC reminder, access-control, profile, notification, feedback, and user-marker screens.
- Ticket Kanban view with drag-and-drop status updates.
- Real-time notifications through Socket.IO.
- Electron desktop packaging with splash screen and tray behavior.

The frontend expects a backend API at `VITE_API_SERVER_URL`, with REST routes under `/api/v1`.

## Current Implementation

### Runtime

- Main app entry: `src/main.jsx`
- Root component: `src/App.jsx`
- Router: `src/routes/MainRoutes.jsx`
- Auth routes: `src/routes/AuthRoutes.jsx`
- Protected routing: `src/routes/ProtectedRoute.jsx`
- Permission routing: `src/routes/PermissionRoute.jsx`
- Layout: `src/layouts/AppLayout.jsx`
- Electron main process: `electron/main.cjs`

The app currently uses `BrowserRouter`. `HashRouter` is imported but not used.

### Auth and Permissions

Authentication is stored in `localStorage`:

- `_auth_id`: resolved from user fields such as `adminID`, `adminId`, `user_id`, `id`, or `_id`.
- `user`: serialized user object.
- `permissions`: permission map keyed by menu id.
- `menus`: backend menu tree.

Important files:

- `src/auth/LoginForm.jsx`
- `src/auth/AuthProvider.jsx`
- `src/auth/authStorage.js`
- `src/auth/permissions.js`
- `src/auth/useMenuPermissions.js`

Login flow:

1. `POST login`
2. Save local session.
3. `GET /get-permissions/:userId`
4. `POST /get-menus` with `{ getAll: "Y" }`
5. Save permissions and menus.
6. Navigate to `/dashboard`.

Super admin behavior:

- Users with `role_slug === "super_admin"` bypass menu/action/field permission checks.
- `src/api/httpClient.js` also strips `company_id` filters for super admin on selected endpoints.

### Routing

Routes are generated dynamically from backend menus. The frontend maps menu links to local page components in `src/routes/MainRoutes.jsx`.

Known route/component mappings:

- `/dashboard` -> Dashboard
- `/users` -> Users
- `/tickets` -> Tickets
- `/menus` -> Menu Master
- `/customers` -> Customers
- `/amc-reminders`, `/amc-reminder` -> AMC Reminders
- `/products`, `/product` -> Products
- `/categories`, `/category` -> Category
- `/user-markers` -> User Markers
- `/companies`, `/companyMaster`, `/company-master` -> Company Master
- `/access-control` -> Access Control
- `/profile` -> User Profile, static protected route
- `/feedback/:ticket_id/:token` -> Public feedback route

### API Client

Primary client: `src/api/httpClient.js`

- `makeRequest(url, options)` uses Axios.
- `apiRequest`, `get`, `post`, `put`, `patch`, `remove` use `fetch`, but most app code uses `makeRequest`.
- Base URL comes from `src/api/config.js`:
  - `API_SERVER_URL = import.meta.env.VITE_API_SERVER_URL || "http://localhost:3000"`
  - `API_BASE_URL = ${API_SERVER_URL}/api/v1`
- Requests include:
  - `Content-Type: application/json`
  - `Accept: application/json`
  - `authid` from localStorage `_auth_id`
  - `withCredentials: true`
- 401 responses clear auth and redirect to `/login` after 2 seconds.
- Global loader is shown/hidden around requests.

### UI Patterns

The app uses module schemas to drive:

- Table columns.
- Form fields.
- Field validation through Zod.
- Smart select configs.
- Joined/lookup metadata.
- Fallback columns when backend definitions are missing.

Shared module utilities:

- `src/utils/moduleStructure.js`
- `src/modules/shared/ModulePageLayout.jsx`
- `src/modules/shared/ModuleControls.jsx`
- `src/modules/shared/ModulePagination.jsx`
- `src/components/ui/DynamicModuleForm.jsx`
- `src/components/table/ResizableTable.jsx`
- `src/components/DynamicFilter.jsx`

Kanban implementation:

- `src/components/kanban/KanbanBoard.jsx`
- `src/components/kanban/KanbanColumn.jsx`
- `src/components/kanban/KanbanCard.jsx`
- `src/components/kanban/kanbanUtils.js`
- Usage details are documented in `KANBAN_USAGE.md`.

### Current Build Status

`npm run react_build` succeeds with Vite.

Last verified: 2026-06-03.

## Folder Structure

```text
.
|-- assets/
|   `-- sounds/
|-- dist/
|-- electron/
|   |-- main.cjs
|   |-- preload.cjs
|   |-- splash.html
|   `-- new logo.png
|-- public/
|-- release/
|-- release 0.0.1/
|-- src/
|   |-- api/
|   |-- auth/
|   |-- components/
|   |   |-- form-inputs/
|   |   |-- kanban/
|   |   |-- layout/
|   |   |-- table/
|   |   `-- ui/
|   |-- context/
|   |-- layouts/
|   |-- modules/
|   |   |-- access-control/
|   |   |-- amc-reminders/
|   |   |-- category/
|   |   |-- company-master/
|   |   |-- customer/
|   |   |-- dashboard/
|   |   |-- menu-master/
|   |   |-- products/
|   |   |-- profile/
|   |   |-- shared/
|   |   |-- tasks/
|   |   `-- users/
|   |-- public/
|   |-- routes/
|   |-- store/
|   |-- styles/
|   `-- utils/
|-- index.html
|-- package.json
|-- vite.config.js
|-- vercel.json
`-- KANBAN_USAGE.md
```

## Database Schema

There is no backend/database schema file in this frontend repository. The schema below is inferred from module schemas, form `initialValues`, primary keys, API paths, and lookup configs.

### `admin` / users

Primary key: `adminID`

Likely fields:

- `adminID`
- `name`
- `userName`
- `email`
- `contactNo`
- `whatsappNo`
- `dateOfBirth`
- `time_zone`
- `roleID`
- `role_slug`
- `roleOfUser`
- `default_company`
- `company_id`
- `is_approver`
- `is_sys_user`
- `isEmailSend`
- `password`
- `address`
- `google_location`
- `latitude`
- `longitude`
- `photo`
- `status`
- `created_by`
- `modified_by`
- auth/sync fields such as `otp`, `otp_exp_time`, `gfcmToken`, `g_cal_token`, `one_drive_access_token`, `is_google_sync`, `is_one_drive_sync`, `ftoken`, `isVerified`

Related tables/lookups:

- `user_role_master` via `roleID`
- `company_master` via `company_id` / `default_company`

### `customer`

Primary key: `customer_id`

Likely fields:

- `customer_id`
- `name`
- `contact_person`
- `email`
- `mobile_no`
- `wa_no`
- `birth_date`
- `address`
- `pan_number`
- `gst_number`
- `company_name`
- `billing_name`
- `billing_address`
- `mailing_address`
- `company_id`
- `is_amc`
- `amc_term_period`
- `amc_start_date`
- `amc_end_date`
- `created_by`
- `created_date`
- `modified_by`

Customer form code also manages customer products, including product id/name and serial number data.

### `tickets`

Primary key: `ticket_id`

Likely fields:

- `ticket_id`
- `ticket_no`
- `client_id`
- `product_id`
- `product_name`
- `product_serial_number`
- `customer_products`
- `contact_person`
- `contact_no`
- `description`
- `query_type`
- `ticket_status`
- `ticket_priority`
- `assignee`
- `start_date`
- `due_date`
- `reason`
- `company_id`
- `created_by`
- `modified_by`
- `status`

Category lookups:

- `query_type` -> `categories` where slug is `query_types`
- `ticket_status` -> `categories` where slug is `ticket_status`
- `ticket_priority` -> `categories` where slug is `ticket_priority`

Kanban status update:

- `POST /tickets/update-status/:ticket_id`
- Body: `{ ticket_status: targetColumnId }`

### `products`

Primary key: `product_id`

Likely fields:

- `product_id`
- `product_name`
- `product_type`
- `product_description`
- `company_id`
- `created_by`
- `created_date`
- `modified_by`
- `modified_date`

### `categories`

Primary key: `category_id`

Likely fields:

- `category_id`
- `categoryName`
- `slug`
- `is_parent`
- `parent_id`
- `cat_color`
- `description`
- `status`
- `is_sys_category`

Used for ticket status, priority, query type, and other selectable tags.

### `company_master`

Primary key: `company_id`

Likely fields:

- `company_id`
- `company_name`
- `sender_email`
- `cc_email`
- `sender_name`
- `mail_provider`
- `smtp_host`
- `smtp_port`
- `smtp_encryption`
- `smtp_username`
- `email_app_password`
- `mail_connection_status`
- `mail_last_tested_at`
- `mobile_number`
- `company_address`
- `country`
- `state`
- `city`
- `zip`
- `pan`
- `time_format`
- `date_format`
- `email_logo`
- `created_by`
- `created_date`
- `modified_by`
- `modified_date`
- `status`

### `menu`

Primary key: `menu_id`

Likely fields:

- `menu_id`
- `module_name`
- `menu_name` / `menuName`
- `module_desc`
- `menu_link` / `menuLink`
- `table_name`
- `label`
- `plural_label`
- `icon_name` / `iconName`
- `menuIndex`
- `parentID` / `parent_id`
- `status`

### Permissions

The permissions API returns a map keyed by `menu_id`. Each entry may contain:

- `view` or `can_view`
- `add` or `can_add`
- `edit` or `can_edit`
- `delete` or `can_delete`
- `fields`: array of field-level permissions

Field permission entries may contain:

- `field_id`, `fieldID`, `id`, `name`, `key`, `field_name`, `fieldName`, `column_name`, or `label`
- `visible`, `can_view`, or `enabled`
- `editable` or `can_edit`

### Notifications

Likely fields based on `NotificationBell`:

- `notification_id`
- `title`
- `message`
- `is_read`
- `module_name`
- `reference_id`
- `created_date`

Socket event:

- `new_notification`

Client joins:

- `join_room` with `_auth_id`

### AMC reminders

AMC reminder rows are customer-derived and may include:

- `customer_id`
- `name`
- `email`
- `mobile_no`
- `contact_person`
- `company_name`
- `is_amc`
- `amc_start_date`
- `amc_end_date`
- `days_until_expiry`
- `support_call_count`
- `last_reminder_sent_at`
- `reminder_count`
- `last_reminder_include_report`

The frontend falls back to `/customers` if `/amc-reminders` is not implemented.

## APIs

All paths below are relative to `API_BASE_URL`, except Socket.IO which connects to `API_SERVER_URL`.

### Auth

- `POST login`
  - Body: `{ username, password }`
  - Expected response includes `success`, `message`, and `user`.
- `POST forgotPassword`
  - Body: `{ email }`
- `POST verifyOtp`
  - Body: `{ otp, new_password, re_enter_password }`

### Permissions and Menus

- `GET /get-permissions/:userId`
- `POST /get-menus`
  - Body: `{ getAll: "Y" }`
- `GET /permissions/:identityId`
- `POST /permissions/save/:identityId`
- `POST /menus`
- `POST /menus/create`
- `GET /menus/:id` or equivalent through `/menus`
- `POST /menus/changestatus`
- `POST /menus/update-positions`

### System Metadata and Lookups

- `POST /system/getDefinations`
- `POST /system/getstructure`
- `POST /system/searchList`
- `POST /system/searchSlugList`

Common `searchList` body fields:

- `tableName`
- `selectFields`
- `searchField`
- `labelKey`
- `valueKey`
- optional `slug`
- optional `status`

### Core Modules

Users:

- `POST /users`
- `POST /users/create`
- `GET/POST /users/:adminID`
- `POST /users/delete`
- `GET /users/profile`
- `POST /users/profile`
- `POST /users/profile/change-password`
- `POST /users/get-markers`

Customers:

- `POST /customers`
- `POST /customers/create`
- `GET/POST /customers/:customer_id`
- `POST /customers/delete`

Products:

- `POST /products`
- `POST /products/create`
- `GET/POST /products/:product_id`
- `POST /products/delete`

Categories:

- `POST /categories`
- `POST /categories/create`
- `GET/POST /categories/:category_id`
- `POST /categories/delete`

Companies:

- `POST /companies`
- `POST /companies/create`
- `GET/POST /companies/:company_id`
- `POST /companies/delete`
- `POST /companies/mail-config/test`

Tickets:

- `POST /tickets`
- `POST /tickets/create`
- `GET/POST /tickets/:ticket_id`
- `POST /tickets/delete`
- `POST /tickets/update-status/:ticket_id`
- `POST tickets/history`
- `POST tickets` for client history lookups

Comments:

- Comment APIs are passed through ticket/comment config in `src/modules/tasks/components/Comments.jsx`.
- The HTTP client explicitly recognizes `/comments` as a create endpoint for super-admin company-filter stripping.

### Dashboard, Notifications, Feedback, AMC

- `GET /dashboard`
- `GET /notifications/unread-count`
- `POST /notifications`
- `GET /notifications/read/:notification_id`
- `POST /feedback/submit`
- `POST /amc-reminders`
- `POST /amc-reminders/send`

AMC reminder send body:

```json
{
  "customer_id": 123,
  "include_report": false
}
```

### Socket.IO

- URL: `API_SERVER_URL`
- Transport: `websocket`
- Auto-connect: false until `NotificationBell` mounts with `_auth_id`
- Emits: `join_room`
- Listens: `new_notification`

## Environment Variables

Current `.env`:

```text
PORT=2000
VITE_API_SERVER_URL="http://localhost:3000"
```

Commented alternatives in `.env` include:

- `VITE_API_BASE_URL="http://localhost:3000/api/v1"`
- `VITE_API_BASE_URL="http://192.168.1.5:3000/api/v1"`
- `VITE_API_BASE_URL="https://flowups-be.onrender.com/api/v1"`
- `VITE_API_BASE_URL="https://13.60.209.177/api/v1"`
- `VITE_API_SERVER_URL="https://api.calldesk.flowups.in"`
- LAN/local `VITE_API_SERVER_URL` variants

Important note: the code currently reads `VITE_API_SERVER_URL`, not `VITE_API_BASE_URL`. `API_BASE_URL` is derived by appending `/api/v1`.

`APP_NAME` is read in `src/api/config.js`, but without the Vite prefix it will not normally be exposed to the client. The fallback is `"flowupS"`.

## Current Task

Create a complete handoff document for another AI assistant. This file is that handoff document.

## Pending Work

- Add or update backend documentation. The frontend strongly implies database tables and API contracts, but there is no canonical DB schema or backend OpenAPI/spec file in this repo.
- Confirm actual backend response shapes for all module list/detail/delete/create endpoints.
- Confirm whether `BrowserRouter` is correct for Electron packaged builds. Electron often needs `HashRouter` or server fallback handling for deep links.
- Replace remaining debug strings and console logging before production.
- Document and standardize module API contracts, especially delete/changestatus behavior and detail fetch behavior.
- Consolidate duplicated select components and smart select implementations if future maintenance becomes painful.
- Add automated tests. There are currently no test scripts in `package.json`.
- Add lint/format scripts if this project will have multiple contributors or AI agents working on it.
- Verify `PORT=2000` usage. Vite defaults to 5173 unless configured or launched with a port flag, while Electron dev waits on `http://localhost:5173`.
- Validate Electron build assets. `package.json` points Windows icon to `build/icon.ico`, but no `build/icon.ico` is visible in the repo listing.
- Clarify deployment path. `vercel.json` exists, and Electron packaging exists, so web and desktop release paths both appear active.

## Known Bugs and Risks

- `src/api/config.js` logs API URLs on every app load.
- `src/modules/tasks/data/module.schema.js` logs the current assignee during module import.
- `src/components/ui/FormField.jsx`, `src/modules/access-control/AccessControlModulePage.jsx`, and `src/modules/tasks/components/Comments.jsx` contain debug `console.log` calls.
- `src/routes/MainRoutes.jsx` and `src/auth/LoginForm.jsx` pass Marathi/debug strings such as `"ithech mainroutes madhe"` and `"ithech Login madhe"` into `fetchMenuList`. The argument is currently unused, but it should be removed or renamed if diagnostics are needed.
- `src/components/ui/NotificationBell.jsx` contains mojibake in a comment: `/* ðŸ”¥ reconnect fix */`.
- `src/api/config.js` defines `API_BASE_URL = `${API_SERVER_URL}/api/v1` || "http://localhost:3000/api/v1";`; the fallback after `||` is unreachable because template strings are always truthy.
- `src/App.jsx` imports `HashRouter` but does not use it.
- `src/routes/AuthRoutes.jsx` destructures several unused values from `useAuth()` in `LoginRoute`.
- `src/main.jsx` has React StrictMode commented out, so double-effect issues may be hidden during development.
- `NotificationBell` uses `Math.random()` as a fallback React key for notifications without `notification_id`, which can cause unstable list rendering.
- `NotificationBell` uses `new Audio(messageTone)` during render state initialization; browser autoplay policies can still block playback until user interaction.
- Several endpoints are called without leading slash, for example `login`, `forgotPassword`, `verifyOtp`, and `tickets/history`. Axios `baseURL` usually handles this, but route consistency would reduce surprises.
- There is no visible error boundary around lazy routes. A failed chunk or render exception can blank the route.
- The frontend assumes many backend field aliases. This is flexible, but it can also mask response contract drift.

## Useful Commands

```bash
npm run react
npm run dev
npm run preview
npm run react_build
npm run dist
```

Notes:

- `npm run react` starts Vite.
- `npm run dev` starts Vite and Electron together.
- `npm run react_build` builds the web app into `dist/`.
- `npm run dist` builds the web app and packages Electron with `electron-builder`.

