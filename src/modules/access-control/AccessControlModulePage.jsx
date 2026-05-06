import { useEffect, useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import { toast } from "react-toastify";
import { makeRequest } from "../../api/httpClient";
import { useAuth } from "../../auth/AuthProvider";
import ModulePageLayout from "../shared/ModulePageLayout";
import IdentitySelector from "./components/IdentitySelector";
import PermissionToggle from "./components/PermissionToggle";
import PermissionsMatrix from "./components/PermissionsMatrix";
import { accessModules, accessPermissionColumns } from "./data/accessControlData";
import { flattenMenuModules } from "./data/helper";

const buildDefaultModules = (rows = accessModules) =>
  rows.map((module) => ({
    ...module,
    permissions: { view: false, add: false, edit: false, delete: false },
    fields: module.fields.map((field) => ({ ...field, enabled: false })),
  }));

const DEFAULT_MODULES = buildDefaultModules();

const toBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  return ["1", "true", "yes", "y", "on"].includes(String(value || "").toLowerCase());
};

const parseMaybeJson = (value) => {
  if (!value || typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const getModulePermissionKey = (module = {}) => String(module.menu_id || module.id);

const normalizePermissionMap = (payload = {}) => {
  const source =
    payload?.permissions ||
    payload?.data?.permissions ||
    payload?.data ||
    payload;

  if (Array.isArray(source)) {
    return source.reduce((accumulator, item) => {
      const menuId = item?.menu_id || item?.menuID || item?.menuId || item?.id;
      if (menuId) accumulator[String(menuId)] = item;
      return accumulator;
    }, {});
  }

  if (source && typeof source === "object") {
    return source;
  }

  return {};
};

const getFieldPermission = (permissions = [], field = {}) => {
  const normalized = Array.isArray(permissions) ? permissions : [];
  return normalized.find((item) => {
    const fieldName = item?.field_name || item?.fieldName || item?.name || item?.key;
    return String(fieldName) === String(field.field_name || field.key || field.name);
  });
};

const applyPermissionMapToModules = (moduleRows = [], permissionMap = {}) =>
  moduleRows.map((module) => {
    const permission = permissionMap[getModulePermissionKey(module)] || permissionMap[module.id] || {};
    const fields = parseMaybeJson(permission.fields || permission.field_permissions || permission.fieldPermissions) || [];
    const view = toBoolean(permission.view ?? permission.can_view);
    const add = view && toBoolean(permission.add ?? permission.can_add);
    const edit = view && toBoolean(permission.edit ?? permission.can_edit);
    const deleteAllowed = view && toBoolean(permission.delete ?? permission.can_delete);

    return {
      ...module,
      permissions: {
        view,
        add,
        edit,
        delete: deleteAllowed,
      },
      fields: module.fields.map((field) => {
        const fieldPermission = getFieldPermission(fields, field);
        return {
          ...field,
          enabled: toBoolean(fieldPermission?.editable ?? fieldPermission?.enabled),
        };
      }),
    };
  });

const preparePermissionsJson = (moduleRows = []) =>
  moduleRows.reduce((accumulator, module) => {
    if (!Boolean(module.permissions.view)) return accumulator;
    accumulator[getModulePermissionKey(module)] = {
      view: Boolean(module.permissions.view),
      add: Boolean(module.permissions.add),
      edit: Boolean(module.permissions.edit),
      delete: Boolean(module.permissions.delete),
      fields: module.fields.map((field) => ({
        field_name: field.field_name || field.key || field.name || field.label,
        editable: Boolean(field.enabled),
      })),
    };
    return accumulator;
  }, {});

function AccessControlModulePage() {
  const { authSession } = useAuth();
  const currentCompanyId = authSession?.user?.company_id || authSession?.user?.default_company || "";
  const [selectedIdentity, setSelectedIdentity] = useState(null);
  const [loadingMenus, setLoadingMenus] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [defaultModules, setDefaultModules] = useState(DEFAULT_MODULES);
  const [modules, setModules] = useState([]);

  const [advancedModuleId, setAdvancedModuleId] = useState(null);
  const advancedModule = modules.find((module) => module.id === advancedModuleId);

  const fetchMenus = async () => {
    try {
      setLoadingMenus(true);
      const res = await makeRequest("/menus", {
        method: "POST",
        body: {
          getAll: "Y",
        },
      });

      if (!res?.success) {
        toast.error(res?.message || "Error while fetching menu list");
        setDefaultModules([]);
        return [];
      }
      const menuModules = flattenMenuModules(res.data || []);
      const nextModules = menuModules.length ? buildDefaultModules(menuModules) : [];
      setDefaultModules(nextModules);
      return nextModules;
    } catch (error) {
      toast.error(error.message || "Error while fetching menu list");
      setDefaultModules([]);
      return [];
    } finally {
      setLoadingMenus(false);
    }
  };

  const fetchPreviousPermissions = async (identity) => {
    if (!identity?.id) return {};

    try {
      setLoadingPermissions(true);
      const res = await makeRequest(`/permissions/${identity.id}`, {
        method: "GET",
      });

      if (!res?.success) return {};
      return normalizePermissionMap(res);
    } catch {
      return {};
    } finally {
      setLoadingPermissions(false);
    }
  };

  const loadSelectedPermissions = async (identity = selectedIdentity) => {
    if (!identity) {
      setModules([]);
      setAdvancedModuleId(null);
      return;
    }

    const [menuRows, permissionMap] = await Promise.all([
      fetchMenus(),
      fetchPreviousPermissions(identity),
    ]);

    setModules(applyPermissionMapToModules(menuRows, permissionMap));
  };

  useEffect(() => {
    if (!selectedIdentity) {
      setModules([]);
      setAdvancedModuleId(null);
      return;
    }

    loadSelectedPermissions(selectedIdentity);

    return () => {
      setAdvancedModuleId(null);
    };
  }, [selectedIdentity]);

  const setModulePermission = (moduleId, permissionKey, nextValue) => {
    setModules((current) =>
      current.map((module) => {
        if (module.id !== moduleId) return module;

        const nextPermissions = {
          ...module.permissions,
          [permissionKey]: nextValue,
        };

        if (permissionKey === "view" && !nextValue) {
          nextPermissions.add = false;
          nextPermissions.edit = false;
          nextPermissions.delete = false;
        }

        return {
          ...module,
          permissions: nextPermissions,
        };
      })
    );
  };

  const setFieldPermission = (fieldKey, nextValue) => {
    setModules((current) =>
      current.map((module) =>
        module.id === advancedModuleId
          ? {
            ...module,
            fields: module.fields.map((field) =>
              field.key === fieldKey ? { ...field, enabled: nextValue } : field
            ),
          }
          : module
      )
    );
  };

  const enableAll = () => {
    setModules((current) =>
      current.map((module) => ({
        ...module,
        permissions: Object.fromEntries(
          accessPermissionColumns.map((column) => [
            column.key,
            Boolean(module.supports[column.key]),
          ])
        ),
      }))
    );
  };

  const resetDefault = () => {
    setModules(
      defaultModules.map((module) => ({
        ...module,
        permissions: { ...module.permissions },
        fields: module.fields.map((field) => ({ ...field })),
      }))
    );
    toast.info("Default permissions restored");
  };

  const saveChanges = async () => {
    const permissions = preparePermissionsJson(modules);
    console.log('permissions : ',permissions);
    
    if (!selectedIdentity?.id) {
      toast.error("Please select a user first");
      return;
    }

    const res = await makeRequest(`/permissions/save/${selectedIdentity?.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        user_id: selectedIdentity.id,
        company_id: selectedIdentity.company_id,
        permissions,
      },
    });

    if (res?.success) {
      toast.success(res?.message || "Permissions updated successfully");
      return;
    }

    toast.error(res?.message || "Unable to save permissions");
  };

  return (
    <>
      <ModulePageLayout
        title="Access Control Management"
        description="Define and manage permissions for users and roles."
        controls={
          <div className="absolute right-6 top-7 flex gap-2">
            <button type="button" className="h-8 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50" onClick={() => loadSelectedPermissions()}> Refresh Menus</button>
            <button type="button" className="h-8 rounded-md border border-gray-400 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50" onClick={resetDefault} >Reset to Default</button>
            <button type="button" className="h-8 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white shadow-sm hover:bg-blue-700" onClick={saveChanges}> Save Changes</button>
          </div>
        }
      >
        <div className="mt-1 grid min-h-full grid-cols-1 gap-1.5 xl:grid-cols-[290px_minmax(0,1fr)]">
          <IdentitySelector
            companyId={currentCompanyId}
            selectedIdentity={selectedIdentity}
            onSelect={setSelectedIdentity}
          />
          <PermissionsMatrix
            modules={modules}
            loadingMenus={loadingMenus}
            selectedIdentity={selectedIdentity}
            loadingPermissions={loadingPermissions}
            onEnableAll={enableAll}
            onConfigure={setAdvancedModuleId}
            onPermissionChange={setModulePermission}
          />
        </div>
      </ModulePageLayout>

      {advancedModule && (
        <div className="fixed inset-0 z-[70] flex justify-end bg-slate-900/30" onClick={() => setAdvancedModuleId(null)}>
          <aside className="flex h-full w-[360px] max-w-full flex-col bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <header className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-200 px-5">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Advanced Settings</h2>
                <p className="text-xs text-slate-500">Field-level security controls</p>
              </div>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
                onClick={() => setAdvancedModuleId(null)}
                aria-label="Close advanced settings"
              >
                <X size={18} />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="flex h-11 items-center gap-3 rounded-md bg-blue-50 px-3 text-sm font-semibold text-blue-700">
                <ShieldCheck size={18} />
                <span>Field Permissions</span>
              </div>

              <div className="mt-4 overflow-hidden rounded-md border border-slate-200">
                <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  {advancedModule.name}
                </div>
                {advancedModule.fields.map((field) => (
                  <div
                    key={field.key}
                    className="flex min-h-10 items-center justify-between gap-3 border-b border-slate-100 px-3 text-xs last:border-b-0"
                  >
                    <span className="font-medium text-slate-700">{field.label}</span>
                    <PermissionToggle
                      checked={field.enabled}
                      disabled={!advancedModule.permissions.edit}
                      onChange={(nextValue) => setFieldPermission(field.key, nextValue)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <footer className="border-t border-slate-200 bg-slate-50 p-5">
              <button
                type="button"
                className="h-10 w-full rounded-md bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700"
                onClick={() => setAdvancedModuleId(null)}
              >
                Apply Changes
              </button>
            </footer>
          </aside>
        </div>
      )}
    </>
  );
}

export default AccessControlModulePage;
