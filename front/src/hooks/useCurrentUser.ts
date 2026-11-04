import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useUserStore } from "@/providers/user-store-provider";
import { UserStore } from "@/store/userStore";
import { AppRoles } from "@/constants/app-roles";

export const useCurrentUser = () => {
    const [hasCheckedSession, setHasCheckedSession] = useState(false);

    const { id, name, email, roles, token, isAuthenticated, isLoading, setUser, clearUser, setLoading,} = useUserStore((state: UserStore) => state);

    useEffect(() => {
        const loadUserFromCookie = () => {
            setLoading(true);

            try {
                const storedToken = Cookies.get("token");
                const storedUser = Cookies.get("currentUser");

                if (!storedToken || !storedUser) {
                    clearUser();
                    return;
                }

                const userData = JSON.parse(storedUser);

                setUser({
                    id: userData.id,
                    name: userData.name,
                    email: userData.email,
                    roles: userData.roles as AppRoles[],
                    token: storedToken,
                });
            } catch (error) {
                console.error("Error parsing user from cookie:", error);
                clearUser();
            } finally {
                setLoading(false);
                setHasCheckedSession(true);
            }
        };

        loadUserFromCookie();
    }, [setUser, clearUser, setLoading]);

    return {
        user: isAuthenticated ? { id, name, email, roles, token } : null,
        isAuthenticated,
        isLoading: isLoading || !hasCheckedSession,
    };
};
