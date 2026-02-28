import { create } from "zustand";
import { Complaint } from "../types";

interface UnallocatedState {
    complaints: Complaint[] | null;
    totalCount: number;
    currentPage: number;
    lastFetched: number | null;

    setCachedData: (data: {
        complaints: Complaint[];
        totalCount: number;
        currentPage: number;
    }) => void;
    clearCache: () => void;
}

export const useUnallocatedStore = create<UnallocatedState>((set) => ({
    complaints: null,
    totalCount: 0,
    currentPage: 1,
    lastFetched: null,

    setCachedData: (data) => set({
        complaints: data.complaints,
        totalCount: data.totalCount,
        currentPage: data.currentPage,
        lastFetched: Date.now()
    }),

    clearCache: () => set({
        complaints: null,
        totalCount: 0,
        currentPage: 1,
        lastFetched: null
    }),
}));
