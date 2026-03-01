import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations, Translations } from '../services/translations';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (path: string, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>(() => {
        return (localStorage.getItem('cyberQuestLanguage') as Language) || 'en';
    });

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('cyberQuestLanguage', lang);
    };

    // Translation helper function
    const t = (path: string, params?: Record<string, string>): string => {
        const keys = path.split('.');
        let result: any = translations[language];

        for (const key of keys) {
            if (result && result[key]) {
                result = result[key];
            } else {
                return path; // Fallback to key path if translation missing
            }
        }

        if (typeof result !== 'string') return path;

        // Handle parameters (e.g., {role})
        if (params) {
            let parameterized = result;
            Object.entries(params).forEach(([key, value]) => {
                parameterized = parameterized.replace(`{${key}}`, value);
            });
            return parameterized;
        }

        return result;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
