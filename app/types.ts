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
    role_addressed_to: string;
    recipient_address: string;
    subject: string;
    date: string;
    status: string;
    name_of_complainer: string;
    complainer_contact_number: string;
    allocated_thana: string;
    submitted_by: string;
    description?: string;
    docs_url?: string[];
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
