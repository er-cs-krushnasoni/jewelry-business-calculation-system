import React, { createContext, useContext, useState, useEffect } from 'react';
import { LANGUAGES } from '../constants/languages';

import guTranslations from '../locales/gu.json';
import hiTranslations from '../locales/hi.json';
import enTranslations from '../locales/en.json';
import mrTranslations from '../locales/mr.json';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

const translations = {
  en: enTranslations,
  gu: guTranslations,
  hi: hiTranslations,
  mr: mrTranslations
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');

  // Load saved language on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && LANGUAGES.some(lang => lang.code === savedLanguage)) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  // Save language when changed
  const setLanguage = (langCode) => {
    if (LANGUAGES.some(lang => lang.code === langCode)) {
      setCurrentLanguage(langCode);
      localStorage.setItem('language', langCode);
      document.documentElement.lang = langCode;
    }
  };

  // Translation function with fallback to English and interpolation support
  const t = (key, params = {}, fallback = key) => {
    const keys = key.split('.');
    let translation = translations[currentLanguage];

    // Navigate through nested keys
    for (const k of keys) {
      if (translation && typeof translation === 'object') {
        translation = translation[k];
      } else {
        translation = null;
        break;
      }
    }

    // If translation not found in current language, try English
    if (!translation && currentLanguage !== 'en') {
      translation = translations.en;
      for (const k of keys) {
        if (translation && typeof translation === 'object') {
          translation = translation[k];
        } else {
          translation = null;
          break;
        }
      }
    }

    // If still no translation found, use fallback
    if (!translation) {
      return fallback;
    }

    // Handle interpolation - replace {{variable}} with actual values
    if (typeof translation === 'string' && Object.keys(params).length > 0) {
      return translation.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return params[key] !== undefined ? params[key] : match;
      });
    }

    return translation;
  };

  // Get current language info
  const getCurrentLanguageInfo = () => {
    return LANGUAGES.find(lang => lang.code === currentLanguage) || LANGUAGES[0];
  };

  // Check if language is RTL
  const isRTL = () => {
    const currentLangInfo = getCurrentLanguageInfo();
    return currentLangInfo?.isRTL || false;
  };

  const value = {
    currentLanguage,
    setLanguage,
    t,
    getCurrentLanguageInfo,
    isRTL,
    availableLanguages: LANGUAGES,
  };

  return (
    <LanguageContext.Provider value={value}>
      <div className={isRTL() ? 'rtl' : 'ltr'} dir={isRTL() ? 'rtl' : 'ltr'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export default LanguageContext;