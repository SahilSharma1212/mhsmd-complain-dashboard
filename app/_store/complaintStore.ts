import { create } from "zustand";
import { Complaint } from "../types";

interface ComplaintState {
    complaints: Complaint[] | null;
    totalCount: number;
    currentPage: number;
    filterAttribute: string;
    filterValue: string;
    lastFetched: number | null; // Timestamp in ms

    setCachedData: (data: {
        complaints: Complaint[];
        totalCount: number;
        currentPage: number;
        filterAttribute: string;
        filterValue: string;
    }) => void;

    clearCache: () => void;
}

export const useComplaintStore = create<ComplaintState>((set) => ({
    complaints: null,
    totalCount: 0,
    currentPage: 1,
    filterAttribute: "",
    filterValue: "",
    lastFetched: null,

    setCachedData: (data) => set({
        ...data,
        lastFetched: Date.now()
    }),

    clearCache: () => set({
        complaints: null,
        totalCount: 0,
        currentPage: 1,
        filterAttribute: "",
        filterValue: "",
        lastFetched: null
    }),
}));
