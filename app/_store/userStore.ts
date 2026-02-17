import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Thana, User } from "../types";

interface UserState {
    user: User | null;
    setUser: (user: User) => void;
    clearUser: () => void;

    thana: Thana[] | null;
    setThana: (thana: Thana[]) => void;
    clearThana: () => void;
}

export const useUserStore = create<UserState>()(persist((set) => ({
    user: null,
    setUser: (user: User) => set({ user }),
    clearUser: () => set({ user: null }),

    thana: null,
    setThana: (thana: Thana[]) => set({ thana }),
    clearThana: () => set({ thana: null }),
}), {
    name: "user",
}));