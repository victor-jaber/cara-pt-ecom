import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useLocationContext } from "./LocationContext";
import { translations, type Language, type TranslationKey, getTranslation } from "../lib/i18n";

type LanguageContextType = {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_KEY = "cara_language";

export function LanguageProvider({ children }: { children: ReactNode }) {
    const { countryCode, isLoading: locationLoading } = useLocationContext();
    const [language, setLanguageState] = useState<Language>("en");
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        if (locationLoading) return;

        const savedLanguage = localStorage.getItem(LANGUAGE_KEY) as Language;

        if (savedLanguage && translations[savedLanguage]) {
            setLanguageState(savedLanguage);
        } else if (countryCode) {
            // Auto-detect based on country code
            const code = countryCode.toUpperCase();
            if (code === "PT") {
                setLanguageState("pt");
            } else if (code === "ES") {
                setLanguageState("es");
            } else if (code === "FR") {
                setLanguageState("fr");
            } else {
                setLanguageState("en");
            }
        }

        setIsInitialized(true);
    }, [countryCode, locationLoading]);

    const setLanguage = useCallback((lang: Language) => {
        localStorage.setItem(LANGUAGE_KEY, lang);
        setLanguageState(lang);
    }, []);

    const t = useCallback((key: string) => {
        return getTranslation(language, key);
    }, [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}
