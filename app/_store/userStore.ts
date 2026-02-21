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

    currentlyViewingComplaint: Complaint | null;
    setCurrentlyViewingComplaint: (complaint: Complaint | null) => void;
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

    currentlyViewingComplaint: null,
    setCurrentlyViewingComplaint: (complaint: Complaint | null) => set({ currentlyViewingComplaint: complaint }),
}), {
    name: "user",
}));