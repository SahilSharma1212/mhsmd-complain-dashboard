import { create } from "zustand";
import axios from "axios";
import { StatusCounts, StatData } from "../types";

interface StatsState {
    stats: StatData | null;
    loading: boolean;
    lastFetched: number | null;
    fetchStats: (force?: boolean) => Promise<void>;
}

export const useStatsStore = create<StatsState>((set, get) => ({
    stats: null,
    loading: false,
    lastFetched: null,

    fetchStats: async (force = false) => {
        const { lastFetched, loading } = get();
        const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

        if (loading) return;
        if (!force && lastFetched && Date.now() - lastFetched < CACHE_DURATION) {
            return;
        }

        set({ loading: true });
        try {
            const response = await axios.get("/api/stat-logs");
            if (response.data) {
                set({
                    stats: response.data,
                    lastFetched: Date.now(),
                    loading: false
                });
            }
        } catch (error) {
            console.error("Stats fetch failed:", error);
            set({ loading: false });
        }
    }
}));
