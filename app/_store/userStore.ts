import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useUserStore = create(persist((set) => ({
    user: null,
    setUser: (user: any) => set({ user }),
    clearUser: () => set({ user: null }),
}), {
    name: "user",
}));