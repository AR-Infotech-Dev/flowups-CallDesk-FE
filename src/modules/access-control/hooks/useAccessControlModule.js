import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getStoredPermissions } from "@auth/utils/authStorage";
import { accessPermissionColumns } from "../data/accessControlData";
import { flattenMenuModules } from "../data/helper";
import {
  getAccessMenus,
  getIdentityPermissions,
  saveIdentityPermissions,
} from "../data/accessControl.service";
import {
  applyPermissionMapToModules,
  buildDefaultModules,
  normalizePermissionMap,
  preparePermissionsJson,
} from "../utils/accessControl.utils";

const DEFAULT_MODULES = buildDefaultModules();

export function useAccessControlModule({ currentUser = {} }) {
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
      const res = await getAccessMenus();

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
          .filter((menu) => userPermissions[menu.menu_id])
          .map((menu) => ({
            ...menu,
            permissions: userPermissions[menu.menu_id],
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
      const res = await getIdentityPermissions(identity.id);

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

  const closeAdvancedSettings = () => {
    setAdvancedModuleId(null);
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

    const res = await saveIdentityPermissions({
      identity: selectedIdentity,
      permissions,
    });

    if (res?.success) {
      toast.success(res?.message || "Permissions updated successfully");
      return;
    }

    toast.error(res?.message || "Unable to save permissions");
  };

  return {
    currentCompanyId,
    selectedIdentity,
    setSelectedIdentity,
    loadingMenus,
    loadingPermissions,
    modules,
    advancedModule,
    hasAllModulePermissions,
    loadSelectedPermissions,
    setModulePermission,
    openAdvancedSettings,
    closeAdvancedSettings,
    setFieldPermission,
    setAllFieldPermissions,
    toggleAllModules,
    resetDefault,
    saveChanges,
  };
}
