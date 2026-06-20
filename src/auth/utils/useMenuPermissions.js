import { useMemo } from "react";
import { useAuth } from "@auth/components/AuthProvider";
import { hasMenuActionPermission, hasMenuViewPermission } from "./permissions";

function useMenuPermissions(menuId) {
  const { authSession } = useAuth();
  const user = authSession?.user;

  return useMemo(() => {
    // These booleans are used by pages to decide which buttons/actions should be visible.
    return {
      canView: hasMenuViewPermission({ menuId, user }),
      canAdd: hasMenuActionPermission({ menuId, action: "add", user }),
      canEdit: hasMenuActionPermission({ menuId, action: "edit", user }),
      canDelete: hasMenuActionPermission({ menuId, action: "delete", user }),
    };
  }, [menuId, user]);
}

export default useMenuPermissions;
