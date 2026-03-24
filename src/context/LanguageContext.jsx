import React, { createContext, useState, useContext, useEffect } from 'react';
import { translations } from '../translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    // Attempt to load saved language from localStorage, else default to 'en'
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('app_language') || 'en';
    });

    // Update localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('app_language', language);
    }, [language]);

    // Fast translation hook
    const t = (key) => {
        if (!translations[key]) {
            console.warn(`Missing translation key: ${key}`);
            return key;
        }
        return translations[key][language] || translations[key]['en'] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    return useContext(LanguageContext);
};
