export interface Role {
    role: "SP" | "TI" | "ADSP" | "SDOP"
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: Role["role"];
    phone: string;
    thana: string;
    address: string
}

// ─── Centralized Complaint Statuses ─────────────────────────────────────
export const COMPLAINT_STATUSES = ["अपराध", "फ़ैना", "अप्रमाणित", "प्रतिबंधात्मक", "वापसी", "लम्बित", "अन्य"] as const;
export type ComplaintStatus = typeof COMPLAINT_STATUSES[number];

export const COMPLAINT_STATUS_COLORS: Record<string, {
    indicatorColor: string;
    labeleng: string;
    labelhindi: string;
    bg: string;
    text: string;
}> = {
    "अपराध": { indicatorColor: "#0000ff", labeleng: "Apradh", labelhindi: "अपराध", bg: "#0000ff20", text: "#0000ff" },
    "फ़ैना": { indicatorColor: "#ff5e00", labeleng: "Faina", labelhindi: "फ़ैना", bg: "#ff5e0020", text: "#ff5e00" },
    "अप्रमाणित": { indicatorColor: "#7a00b3", labeleng: "Apramanit", labelhindi: "अप्रमाणित", bg: "#7a00b320", text: "#7a00b3" },
    "प्रतिबंधात्मक": { indicatorColor: "#000000", labeleng: "Pratibandhatmak", labelhindi: "प्रतिबंधात्मक", bg: "#99999920", text: "#000" },
    "वापसी": { indicatorColor: "#ff0000", labeleng: "Vapsi", labelhindi: "वापसी", bg: "#ff000020", text: "#ff0000" },
    "लम्बित": { indicatorColor: "#f59e0b", labeleng: "Pending", labelhindi: "लम्बित", bg: "#f59e0b20", text: "#f59e0b" },
    "अन्य": { indicatorColor: "#007d21", labeleng: "Anya", labelhindi: "अन्य", bg: "#00ff0020", text: "#007d21" },
};

export interface Complaint {
    id?: string;
    created_at?: string;
    role_addressed_to: string;
    recipient_address: string;
    subject: string;
    date?: string;
    status: string;
    phone?: string;
    complainant_name: string;
    complainant_contact: string;
    complainant_details?: string;
    allocated_thana: string;
    submitted_by: string;
    message?: string;
    file_urls?: string[];
    accused_details?: string;
    source?: string;
    submitted_by_name?: string;
    io_officer?: string;
    feedback?: string | null;
}

export interface Thana {
    id?: string;
    name: string;
}

export interface addThanaDetails {
    name: string,
    pin_code: string,
    city: string,
    contact_number: string,
}

export interface StatusCounts {
    [status: string]: number;
}

export interface StatData {
    total: number;
    unallocatedCount?: number;
    nirakritCount?: number;
    statusCounts: StatusCounts;
    thanaBreakdown?: Record<string, StatusCounts>;
    ageStats?: {
        lessThan15Days: number;
        fifteenToThirtyDays: number;
        moreThan30Days: number;
    };
    categoryAgeStats?: {
        total: { lessThan15Days: number; fifteenToThirtyDays: number; moreThan30Days: number };
        pending: { lessThan15Days: number; fifteenToThirtyDays: number; moreThan30Days: number };
        unallocated: { lessThan15Days: number; fifteenToThirtyDays: number; moreThan30Days: number };
        nirakrit: { lessThan15Days: number; fifteenToThirtyDays: number; moreThan30Days: number };
    };
    ageStatusBreakdown?: {
        lessThan15Days: StatusCounts;
        fifteenToThirtyDays: StatusCounts;
        moreThan30Days: StatusCounts;
    };
    thanaAgeBreakdown?: Record<string, {
        lessThan15Days: number;
        fifteenToThirtyDays: number;
        moreThan30Days: number;
    }>;
    thanaAgeStatusBreakdown?: Record<string, Record<string, StatusCounts>>;
    latestUnallocatedComplaints?: Complaint[];
    latestPendingComplaints?: Complaint[];
    latestNirakritComplaints?: Complaint[];
    latestTotalComplaints?: Complaint[];
}
