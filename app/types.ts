export interface Role {
    role: "SP" | "TI"
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
}
