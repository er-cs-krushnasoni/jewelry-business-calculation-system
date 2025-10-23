// Language constants for the jewelry management system
export const LANGUAGES = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇺🇸',
      isRTL: false
    },
    {
      code: 'gu',
      name: 'Gujarati',
      nativeName: 'ગુજરાતી',
      flag: '🇮🇳',
      isRTL: false
    },
    {
      code: 'hi',
      name: 'Hindi',
      nativeName: 'हिन्दी',
      flag: '🇮🇳',
      isRTL: false
    },
    {
      code: 'mr',
      name: 'Marathi',
      nativeName: 'मराठी',
      flag: '🇮🇳',
      isRTL: false
    }
  ];
  
  // Default language
  export const DEFAULT_LANGUAGE = 'en';
  
  // Language detection helper
  export const detectLanguage = () => {
    // Check localStorage first
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && LANGUAGES.some(lang => lang.code === savedLanguage)) {
      return savedLanguage;
    }
    
    // Check browser language
    const browserLang = navigator.language.split('-')[0];
    if (LANGUAGES.some(lang => lang.code === browserLang)) {
      return browserLang;
    }
    
    // Fallback to default
    return DEFAULT_LANGUAGE;
  };