import { create } from "zustand";
import { Complaint } from "../types";

export type Log = {
    id: number;
    created_at: string;
    complaint_id: number;
    updated_by: string;
    prev_status: string;
    current_status: string;
    reason: string;
    action: string;
};

interface LogCache {
    logs: Log[];
    complaint: Complaint;
    lastFetched: number;
}

interface LogState {
    logsByComplaint: Record<number, LogCache>;

    setLogs: (complaintId: number, logs: Log[], complaint: Complaint) => void;
    clearLogs: (complaintId?: number) => void;
}

export const useLogStore = create<LogState>((set) => ({
    logsByComplaint: {},

    setLogs: (complaintId, logs, complaint) => set((state) => ({
        logsByComplaint: {
            ...state.logsByComplaint,
            [complaintId]: {
                logs,
                complaint,
                lastFetched: Date.now()
            }
        }
    })),

    clearLogs: (complaintId) => set((state) => {
        if (complaintId) {
            const newCache = { ...state.logsByComplaint };
            delete newCache[complaintId];
            return { logsByComplaint: newCache };
        }
        return { logsByComplaint: {} };
    }),
}));
