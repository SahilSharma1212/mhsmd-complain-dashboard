export interface Role {
    role: "SP" | "TI"
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: Role["role"];
}