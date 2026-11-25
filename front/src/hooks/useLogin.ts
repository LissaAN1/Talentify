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
            
            // Si requiere 2FA
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

    const verify2FA = async (token: string, partialToken: string): Promise<boolean> => {
        setLoading(true);
        
        try {
            const response = await authService.verify2FA({ token }, partialToken);
            
            // Guardar en cookies
            Cookies.set('token', response.token, { expires: 7 });
            Cookies.set('currentUser', JSON.stringify({
                id: response.usuario.id,
                name: response.usuario.nombre,
                email: response.usuario.correo,
                roles: response.usuario.roles,
            }), { expires: 7 });
            
            // Guardar en store
            setUser({
                id: response.usuario.id,
                name: response.usuario.nombre,
                email: response.usuario.correo,
                roles: response.usuario.roles,
                token: response.token,
            });
            
            setLoading(false);
            return true;
            
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    return { login, verify2FA };
};
