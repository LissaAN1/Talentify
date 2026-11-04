import Cookies from 'js-cookie';
import { authService } from "@/services/auth.service";
import { useUserStore } from '@/providers/user-store-provider';
import { UserStore } from '@/store/userStore';
import { LoginResponse } from '@/interfaces/auth';

export const useLogin = () => {
    const { setUser, clearUser, setLoading } = useUserStore((state: UserStore) => state);

    const login = async (email: string, password: string): Promise<{ success: boolean; requires2FA?: boolean; partialToken?: string }> => {
        setLoading(true);

        try {
            const response = await authService.login(email, password);

            // Si requiere 2FA (se activa en HU-15)
            if ('requires2FA' in response && response.requires2FA) {
                setLoading(false);
                return {
                    success: true,
                    requires2FA: true,
                    partialToken: response.partialToken
                };
            }

            // Login normal
            const loginResponse = response as LoginResponse;

            // Guardar en cookies
            Cookies.set('token', loginResponse.token, { expires: 7 });
            Cookies.set('currentUser', JSON.stringify({
                id: loginResponse.usuario.id,
                name: loginResponse.usuario.nombre,
                email: loginResponse.usuario.correo,
                roles: loginResponse.usuario.roles,
            }), { expires: 7 });

            // Guardar en store
            setUser({
                id: loginResponse.usuario.id,
                name: loginResponse.usuario.nombre,
                email: loginResponse.usuario.correo,
                roles: loginResponse.usuario.roles,
                token: loginResponse.token,
            });

            setLoading(false);
            return { success: true };

        } catch (error) {
            setLoading(false);
            clearUser();
            throw error;
        }
    };

    return { login };
};
