import { create } from "zustand";
import axios from "axios";
import { IOStatsData } from "../types";

interface IOStatsState {
    stats: IOStatsData | null;
    loading: boolean;
    error: string | null;
    lastFetched: number | null;
    fetchIOStats: (force?: boolean) => Promise<void>;
    clearIOStats: () => void;
}

export const useIoStatsStore = create<IOStatsState>((set, get) => ({
    stats: null,
    loading: false,
    error: null,
    lastFetched: null,

    fetchIOStats: async (force = false) => {
        const { lastFetched, loading } = get();
        const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

        if (loading) return;
        if (!force && lastFetched && Date.now() - lastFetched < CACHE_DURATION) {
            return;
        }

        set({ loading: true, error: null });
        try {
            const response = await axios.get("/api/io");
            if (response.data.success) {
                set({
                    stats: response.data.data,
                    lastFetched: Date.now(),
                    loading: false,
                    error: null
                });
            } else {
                set({
                    loading: false,
                    error: response.data.message || "डेटा प्राप्त करने में विफल"
                });
            }
        } catch (error: any) {
            console.error("IO Stats fetch failed:", error);
            set({
                loading: false,
                error: error.response?.data?.message || "Failed to load IO statistics"
            });
        }
    },

    clearIOStats: () => set({
        stats: null,
        loading: false,
        error: null,
        lastFetched: null
    })
}));
