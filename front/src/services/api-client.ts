import axios from "axios";
import Cookies from "js-cookie";

export const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 3000,
});

apiClient.interceptors.request.use(
    (config) => {
        const token = Cookies.get("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const url = error.config?.url ?? "";

        const isInteractiveAuthFlow =
            url.includes("/auth/login") ||
            url.includes("/auth/2fa/verificar");

        if (status === 401 && !isInteractiveAuthFlow) {
            Cookies.remove("token");
            Cookies.remove("currentUser");
            Cookies.remove("partialToken");

            // Fuera de un componente no hay useRouter, por eso se navega con window
            if (typeof window !== "undefined") {
                // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    }
);
