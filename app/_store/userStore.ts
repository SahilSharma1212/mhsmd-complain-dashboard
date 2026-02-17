import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Complaint, Thana, User } from "../types";

interface UserState {
    user: User | null;
    setUser: (user: User) => void;
    clearUser: () => void;

    thana: Thana[] | null;
    setThana: (thana: Thana[]) => void;
    clearThana: () => void;

    complaints: Complaint[] | null;
    setComplaints: (complaints: Complaint[]) => void;
    clearComplaints: () => void;
}

export const useUserStore = create<UserState>()(persist((set) => ({
    user: null,
    setUser: (user: User) => set({ user }),
    clearUser: () => set({ user: null }),

    thana: null,
    setThana: (thana: Thana[]) => set({ thana }),
    clearThana: () => set({ thana: null }),

    complaints: null,
    setComplaints: (complaints: Complaint[]) => set({ complaints }),
    clearComplaints: () => set({ complaints: null }),
}), {
    name: "user",
}));