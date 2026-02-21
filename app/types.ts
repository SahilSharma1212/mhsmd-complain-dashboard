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
}

export interface Thana {
    name: string;
}

export interface addThanaDetails {
    name: string,
    pin_code: string,
    city: string,
    contact_number: string,
}
