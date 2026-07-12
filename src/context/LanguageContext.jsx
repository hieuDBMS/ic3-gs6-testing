import { createContext, useContext, useEffect, useState } from "react";
import i18next from "../i18n";

const LanguageContext = createContext();

const getInitialLanguage = () => {
  const stored = localStorage.getItem('ic3_lang');
  if (stored === 'vi' || stored === 'en') return stored;
  return navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'vi';
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(getInitialLanguage);

  useEffect(() => {
    i18next.changeLanguage(lang);
    document.documentElement.lang = lang;
    localStorage.setItem('ic3_lang', lang);
  }, [lang]);

  const toggleLanguage = () => setLang(l => (l === 'vi' ? 'en' : 'vi'));

  const value = { lang, toggleLanguage, setLang };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components -- hook is intentionally co-located with LanguageProvider
export const useLanguage = () => useContext(LanguageContext);
