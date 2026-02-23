export const translations = {
    english: {
        layout: {
            logout: "Logout",
        },
    },
    hindi: {
        layout: {
            logout: "लॉगआउट",
        },
    },
} as const;

export type TranslationType = typeof translations;
export type Language = keyof TranslationType;