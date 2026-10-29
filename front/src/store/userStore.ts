import { createStore } from "zustand";
import { AppRoles } from "@/constants/app-roles";

export interface UserState {
    id: string;
    name: string;
    email: string;
    roles: AppRoles[];
    token: string;
    isAuthenticated: boolean;
    isLoading: boolean;
}

export interface UserActions {
    setUser: (user: Omit<UserState, "isAuthenticated" | "isLoading">) => void;
    setToken: (token: string) => void;
    clearUser: () => void;
    setLoading: (isLoading: boolean) => void;
}

export type UserStore = UserState & UserActions;

export const defaultInitState: UserState = {
    id: "",
    name: "",
    email: "",
    roles: [],
    token: "",
    isAuthenticated: false,
    isLoading: false,
};

export const createUserStore = (initState: UserState = defaultInitState) => {
    return createStore<UserStore>((set) => ({
        ...initState,
        setUser: (user) => set({
            ...user,
            isAuthenticated: true,
            isLoading: false
        }),
        setToken: (token) => set({ token }),
        clearUser: () => set(defaultInitState),
        setLoading: (isLoading) => set({ isLoading }),
    }));
};
