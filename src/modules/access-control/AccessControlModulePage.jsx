import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { makeRequest } from "../../api/httpClient";
import { useAuth } from "@auth/components/AuthProvider";
import ModulePageLayout from "../shared/ModulePageLayout";
import IdentitySelector from "./components/IdentitySelector";
import PermissionsMatrix from "./components/PermissionsMatrix";
import { accessModules, accessPermissionColumns } from "./data/accessControlData";
import { flattenMenuModules } from "./data/helper";
import { getStoredPermissions } from "@auth/utils/authStorage";
import ConfigureFeilds from "./components/ConfigureFeilds";

const buildDefaultModules = (rows = accessModules) =>
  rows.map((module) => ({
    ...module,
    permissions: { view: false, add: false, edit: false, delete: false },
    fields: module.fields.map((field) => ({ ...field, visible: false, editable: false })),
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

const getFieldId = (field = {}) =>
  field?.field_id || field?.fieldID || field?.id || field?._id || field?.Field || field?.field_name || field?.key || field?.name;

const getFieldName = (field = {}) => field?.name || "";
const getFieldLabel = (field = {}) =>
  field?.label || field?.lable || field?.display_name || field?.title || getFieldName(field);

const normalizeField = (field = {}, savedPermission = {}) => {
  const fieldId = getFieldId(field);
  const fieldName = getFieldName(field);
  const editable = toBoolean(savedPermission?.editable ?? savedPermission?.can_edit);
  const visible = toBoolean(savedPermission?.visible ?? savedPermission?.can_view ?? savedPermission?.enabled) || editable;

  return {
    key: String(fieldId || fieldName),
    field_id: fieldId,
    field_name: fieldName,
    label: getFieldLabel(field),
    visible,
    editable,
  };
};

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
    const savedFieldId = item?.field_id || item?.fieldID || item?.id;
    const savedFieldName = item?.field_name || item?.fieldName || item?.name || item?.key;
    const currentFieldId = field.field_id || field.id;
    const currentFieldName = field.field_name || field.key || field.name;

    if (savedFieldId && currentFieldId && String(savedFieldId) === String(currentFieldId)) return true;
    if (savedFieldName && currentFieldName && String(savedFieldName) === String(currentFieldName)) return true;
    return false;
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
      savedFieldPermissions: fields,
      fields: module.fields.map((field) => {
        const fieldPermission = getFieldPermission(fields, field);
        return {
          ...normalizeField(field, fieldPermission),
        };
      }),
    };
  });

const prepareFieldPermissionsJson = (module = {}) => {
  const fields = module.fields.length ? module.fields : module.savedFieldPermissions || [];

  return fields.map((field) => {
    const editable = Boolean(field.editable);
    const visible = Boolean(field.visible) || editable;

    return {
      field_id: field.field_id || field.fieldID || field.id || field.key,
      field_name: field.field_name || field.fieldName || field.name || field.key || field.label,
      visible,
      editable,
    };
  });
};

const preparePermissionsJson = (moduleRows = []) =>
  moduleRows.reduce((accumulator, module) => {
    if (!Boolean(module.permissions.view)) return accumulator;
    accumulator[getModulePermissionKey(module)] = {
      view: Boolean(module.permissions.view),
      add: Boolean(module.permissions.add),
      edit: Boolean(module.permissions.edit),
      delete: Boolean(module.permissions.delete),
      fields: prepareFieldPermissionsJson(module),
    };
    return accumulator;
  }, {});

function AccessControlModulePage() {
  const { authSession } = useAuth();
  const currentUser = authSession?.user || {};
  const isSuperAdmin = currentUser?.role_slug === "super_admin";
  const currentCompanyId = isSuperAdmin ? "" : currentUser?.company_id || currentUser?.default_company || "";
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
      const res = await makeRequest("/get-menus", {
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
      const userPermissions = getStoredPermissions();
      const filteredMenus = isSuperAdmin
        ? menuModules
        : menuModules
          .filter(menu => userPermissions[menu.menu_id])
          .map(menu => ({
            ...menu,
            permissions: userPermissions[menu.menu_id]
          }));

      const nextModules = filteredMenus.length ? buildDefaultModules(filteredMenus) : [];
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

  const openAdvancedSettings = (moduleId) => {
    setAdvancedModuleId(moduleId);
  };

  const setFieldPermission = (fieldKey, permissionKey, nextValue) => {
    setModules((current) =>
      current.map((module) =>
        module.id === advancedModuleId
          ? {
            ...module,
            fields: module.fields.map((field) => {
              if (field.key !== fieldKey) return field;

              if (permissionKey === "visible" && !nextValue) {
                return { ...field, visible: false, editable: false };
              }

              if (permissionKey === "editable" && nextValue) {
                return { ...field, visible: true, editable: true };
              }

              return { ...field, [permissionKey]: nextValue };
            }),
          }
          : module
      )
    );
  };

  const setAllFieldPermissions = (permissionKey, nextValue) => {
    setModules((current) =>
      current.map((module) =>
        module.id === advancedModuleId
          ? {
            ...module,
            fields: module.fields.map((field) => {
              if (permissionKey === "visible" && !nextValue) {
                return { ...field, visible: false, editable: false };
              }

              if (permissionKey === "editable" && nextValue) {
                return { ...field, visible: true, editable: true };
              }

              return { ...field, [permissionKey]: nextValue };
            }),
          }
          : module
      )
    );
  };

  const hasAllModulePermissions = modules.length > 0 && modules.every((module) =>
    accessPermissionColumns.every((column) =>
      !module.supports[column.key] || Boolean(module.permissions[column.key])
    )
  );

  const toggleAllModules = () => {
    const shouldEnable = !hasAllModulePermissions;

    setModules((current) =>
      current.map((module) => ({
        ...module,
        permissions: Object.fromEntries(
          accessPermissionColumns.map((column) => [
            column.key,
            shouldEnable && Boolean(module.supports[column.key]),
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
    if (!selectedIdentity?.id) {
      toast.error("Please select a user first");
      return;
    }

    const res = await makeRequest(`/permissions/save/${selectedIdentity?.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        user_id: parseInt(selectedIdentity.id),
        company_id: parseInt(selectedIdentity.company_id),
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
            onEnableAll={toggleAllModules}
            enableAllLabel={hasAllModulePermissions ? "Disable All" : "Enable All"}
            onConfigure={openAdvancedSettings}
            onPermissionChange={setModulePermission}
          />
        </div>
      </ModulePageLayout>
      <ConfigureFeilds
        isOpen={Boolean(advancedModule)}
        advancedModule={advancedModule}
        loadingAdvancedFields={false}
        onFieldPermissionChange={setFieldPermission}
        onFieldBulkChange={setAllFieldPermissions}
        onClose={() => {
          setAdvancedModuleId(null);
        }}
      />
    </>
  );
}

export default AccessControlModulePage;
