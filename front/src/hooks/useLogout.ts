import Cookies from "js-cookie";
import { useUserStore } from "@/providers/user-store-provider";
import { UserStore } from "@/store/userStore";
import { authService } from "@/services/auth.service";
import { useRouter } from "next/navigation";

export const useLogout = () => {
    const { clearUser } = useUserStore((state: UserStore) => state);
    const router = useRouter();

    const logout = async () => {
        try {
            //cerrar sesión en el backend
            await authService.logout();
        } catch (error) {
            // Ignorar errores de logout
            console.error("Logout error:", error);
        } finally {
            // Limpiar cookies
            Cookies.remove("token");
            Cookies.remove("currentUser");
            Cookies.remove("partialToken");

            // Limpiar store
            clearUser();

            // Redirigir al login
            router.push("/login");
        }
    };

    return { logout };
};
