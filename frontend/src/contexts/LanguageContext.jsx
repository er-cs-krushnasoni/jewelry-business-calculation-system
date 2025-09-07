import React, { createContext, useContext, useState, useEffect } from 'react';
import { LANGUAGES } from '../constants/languages';

// Language context
const LanguageContext = createContext();

// Custom hook to use language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Simple translations object (can be expanded)
const translations = {
  en: {
    // App
    'app.title': 'Jewelry Manager',
    'app.version': 'Jewelry Manager v1.0',
    
    // Navigation
    'nav.calculator': 'Calculator',
    'nav.shops': 'Shop Management',
    'nav.dashboard': 'Dashboard',
    'nav.userManagement': 'User Management',
    'nav.categories': 'Categories',
    'nav.rates': 'Rate Management',
    'nav.reports': 'Reports',
    'nav.settings': 'Settings',
    'nav.noItems': 'No navigation items available',
    
    // Header
    'header.shop': 'Shop:',
    'header.profile': 'Profile Settings',
    'header.logout': 'Logout',
    
    // User
    'user.platform': 'Platform Admin',
    
    // Dashboard
    'dashboard.welcome': 'Welcome back',
    'dashboard.redirecting': 'Redirecting to Shop Management...',
    'dashboard.redirectingCalculator': 'Redirecting to Calculator...',
    'dashboard.shopManagement': 'Shop Management',
    'dashboard.userManagement': 'User Management',
    'dashboard.analytics': 'Platform Analytics',
    'dashboard.settings': 'Platform Settings',
    
    // Dashboard - Super Admin
    'dashboard.superAdmin.subtitle': 'Platform Administrator Dashboard',
    'dashboard.superAdmin.shopDesc': 'Create and manage jewelry shops',
    'dashboard.superAdmin.userDesc': 'Oversee shop administrators',
    'dashboard.superAdmin.analyticsDesc': 'Monitor platform performance',
    'dashboard.superAdmin.settingsDesc': 'Configure system settings',
    
    // Dashboard - Admin
    'dashboard.admin.subtitle': 'Shop Administrator Dashboard',
    'dashboard.admin.access': 'You have full access to all shop features',
    'dashboard.admin.capabilities': 'Your Capabilities',
    'dashboard.admin.calc': 'Full jewelry calculations with margins',
    'dashboard.admin.users': 'Create and manage shop users',
    'dashboard.admin.rates': 'Update daily gold/silver rates',
    'dashboard.admin.categories': 'Manage jewelry categories',
    'dashboard.admin.settings': 'Configure shop settings',
    'dashboard.admin.reports': 'View detailed reports',
    
    // Dashboard - Manager
    'dashboard.manager.subtitle': 'Shop Manager Dashboard',
    'dashboard.manager.access': 'Rate updates and full calculation access',
    'dashboard.manager.capabilities': 'Your Capabilities',
    'dashboard.manager.calc': 'Full jewelry calculations with margins',
    'dashboard.manager.rates': 'Update daily gold/silver rates',
    'dashboard.manager.purity': 'View purity and wastage details',
    'dashboard.manager.reports': 'Access calculation reports',
    
    // Dashboard - Pro Client
    'dashboard.proClient.subtitle': 'Professional Client Dashboard',
    'dashboard.proClient.access': 'Calculations with margin visibility',
    'dashboard.proClient.capabilities': 'Your Capabilities',
    'dashboard.proClient.calc': 'Jewelry calculations with results',
    'dashboard.proClient.margins': 'View margin per gram and totals',
    'dashboard.proClient.resale': 'Access resale options (when enabled)',
    'dashboard.proClient.professional': 'Professional-level access',
    
    // Dashboard - Client
    'dashboard.client.subtitle': 'Client Dashboard',
    'dashboard.client.access': 'Basic calculation access',
    'dashboard.client.capabilities': 'Your Capabilities',
    'dashboard.client.calc': 'Basic jewelry calculations',
    'dashboard.client.prices': 'View final selling/buying prices',
    'dashboard.client.simple': 'Simple, easy-to-use interface',
    
    // Login
    'login.title': 'Sign In',
    'login.subtitle': 'Welcome back to Jewelry Manager',
    'login.username': 'Username',
    'login.password': 'Password',
    'login.signin': 'Sign In',
    'login.signingin': 'Signing In...',
    'login.error': 'Login failed. Please check your credentials.'
  },
  
  gu: {
    // App
    'app.title': 'જ્વેલરી મેનેજર',
    'app.version': 'જ્વેલરી મેનેજર વર્ઝન 1.0',
    
    // Navigation
    'nav.calculator': 'કેલ્ક્યુલેટર',
    'nav.shops': 'દુકાન વ્યવસ્થાપન',
    'nav.dashboard': 'ડેશબોર્ડ',
    'nav.userManagement': 'વપરાશકર્તા વ્યવસ્થાપન',
    'nav.categories': 'શ્રેણીઓ',
    'nav.rates': 'દર વ્યવસ્થાપન',
    'nav.reports': 'અહેવાલો',
    'nav.settings': 'સેટિંગ્સ',
    'nav.noItems': 'કોઈ નેવિગેશન આઈટમ ઉપલબ્ધ નથી',
    
    // Header
    'header.shop': 'દુકાન:',
    'header.profile': 'પ્રોફાઈલ સેટિંગ્સ',
    'header.logout': 'લોગ આઉટ',
    
    // User
    'user.platform': 'પ્લેટફોર્મ એડમિન',
    
    // Dashboard
    'dashboard.welcome': 'પાછા સ્વાગત છે',
    'dashboard.redirecting': 'દુકાન વ્યવસ્થાપન પર રીડાયરેક્ટ કરી રહ્યા છીએ...',
    'dashboard.redirectingCalculator': 'કેલ્ક્યુલેટર પર રીડાયરેક્ટ કરી રહ્યા છીએ...',
    
    // Login
    'login.title': 'સાઇન ઇન',
    'login.subtitle': 'જ્વેલરી મેનેજરમાં પાછા સ્વાગત છે',
    'login.username': 'વપરાશકર્તા નામ',
    'login.password': 'પાસવર્ડ',
    'login.signin': 'સાઇન ઇન',
    'login.signingin': 'સાઇન ઇન કરી રહ્યા છીએ...',
    'login.error': 'લોગિન નિષ્ફળ. કૃપા કરીને તમારી માહિતી તપાસો.'
  },
  
  hi: {
    // App
    'app.title': 'ज्वेलरी मैनेजर',
    'app.version': 'ज्वेलरी मैनेजर संस्करण 1.0',
    
    // Navigation
    'nav.calculator': 'कैलकुलेटर',
    'nav.shops': 'दुकान प्रबंधन',
    'nav.dashboard': 'डैशबोर्ड',
    'nav.userManagement': 'उपयोगकर्ता प्रबंधन',
    'nav.categories': 'श्रेणियां',
    'nav.rates': 'दर प्रबंधन',
    'nav.reports': 'रिपोर्ट',
    'nav.settings': 'सेटिंग्स',
    'nav.noItems': 'कोई नेविगेशन आइटम उपलब्ध नहीं',
    
    // Header
    'header.shop': 'दुकान:',
    'header.profile': 'प्रोफ़ाइल सेटिंग्स',
    'header.logout': 'लॉग आउट',
    
    // User
    'user.platform': 'प्लेटफॉर्म एडमिन',
    
    // Dashboard
    'dashboard.welcome': 'वापस स्वागत है',
    'dashboard.redirecting': 'दुकान प्रबंधन पर रीडायरेक्ट कर रहे हैं...',
    'dashboard.redirectingCalculator': 'कैलकुलेटर पर रीडायरेक्ट कर रहे हैं...',
    
    // Login
    'login.title': 'साइन इन',
    'login.subtitle': 'ज्वेलरी मैनेजर में वापस स्वागत है',
    'login.username': 'उपयोगकर्ता नाम',
    'login.password': 'पासवर्ड',
    'login.signin': 'साइन इन',
    'login.signingin': 'साइन इन कर रहे हैं...',
    'login.error': 'लॉगिन असफल. कृपया अपनी जानकारी जांचें।'
  }
};

// Language Provider Component
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
      
      // Update document language attribute
      document.documentElement.lang = langCode;
    }
  };

  // Translation function
  const t = (key, fallback = key) => {
    const translation = translations[currentLanguage]?.[key];
    return translation || fallback;
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
    availableLanguages: LANGUAGES
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