import { useCurrentUser } from "./useCurrentUser";
import { useLogin } from "./useLogin";
import { useLogout } from "./useLogout";
import { isAdmin, isProvider, isClient, hasRole, AppRoles } from "@/constants/app-roles";

export const useAuth = () => {
    const { user, isAuthenticated, isLoading } = useCurrentUser();
    const { login, verify2FA } = useLogin();
    const { logout } = useLogout();

    return {
        user,
        isAuthenticated,
        isLoading,
        login,
        verify2FA,
        logout,
        isAdmin: () => user ? isAdmin(user.roles) : false,
        isProvider: () => user ? isProvider(user.roles) : false,
        isClient: () => user ? isClient(user.roles) : false,
        hasRole: (roles: AppRoles[]) => user ? hasRole(user.roles, roles) : false,
    };
};
