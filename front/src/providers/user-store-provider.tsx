'use client'

import { UserStore, createUserStore } from "@/store/userStore"
import { ReactNode, createContext, useContext, useRef } from "react"
import { useStore } from "zustand"

export type UserStoreApi = ReturnType<typeof createUserStore>

export const UserStoreContext = createContext<UserStoreApi | undefined>(undefined)

export interface Props {
    children: ReactNode
}

export const UserStoreProvider = ({ children }: Props) => {
    const storeRef = useRef<UserStoreApi | null>(null);
    if (storeRef.current === null) {
        storeRef.current = createUserStore();
    }

    return (
        <UserStoreContext.Provider value={storeRef.current}>
            {children}
        </UserStoreContext.Provider>
    );
}

export const useUserStore = <T,>(selector: (store: UserStore) => T): T => {
    const userStoreContext = useContext(UserStoreContext)
    if (!userStoreContext) {
        throw new Error('useUserStore must be used within UserStoreProvider');
    }
    return useStore(userStoreContext, selector)
}
