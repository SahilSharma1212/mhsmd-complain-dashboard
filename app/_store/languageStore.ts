import { create } from "zustand";

export type Language = "english" | "hindi";

interface LanguageState {
    language: Language;
    setLanguage: (language: Language) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
    language: "hindi",
    setLanguage: (language: Language) => set({ language }),
}));