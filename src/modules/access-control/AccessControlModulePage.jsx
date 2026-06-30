import { useAuth } from "@auth/components/AuthProvider";
import ModulePageLayout from "../shared/ModulePageLayout";
import IdentitySelector from "./components/IdentitySelector";
import PermissionsMatrix from "./components/PermissionsMatrix";
import ConfigureFeilds from "./components/ConfigureFeilds";
import { useAccessControlModule } from "./hooks/useAccessControlModule";

function AccessControlModulePage() {
  const { authSession } = useAuth();
  const currentUser = authSession?.user || {};

  const {
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
  } = useAccessControlModule({ currentUser });

  return (
    <>
      <ModulePageLayout
        title="Access Control Management"
        description="Define and manage permissions for users and roles."
        controls={
          <div className="absolute right-6 top-7 flex gap-2">
            <button
              type="button"
              className="h-8 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => loadSelectedPermissions()}
            >
              Refresh Menus
            </button>
            <button
              type="button"
              className="h-8 rounded-md border border-gray-400 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              onClick={resetDefault}
            >
              Reset to Default
            </button>
            <button
              type="button"
              className="h-8 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
              onClick={saveChanges}
            >
              Save Changes
            </button>
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
        onClose={closeAdvancedSettings}
      />
    </>
  );
}

export default AccessControlModulePage;
