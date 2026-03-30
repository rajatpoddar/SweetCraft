import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Sidebar
      "Overview": "Overview",
      "Stock & Inventory": "Stock & Inventory",
      "Party Orders": "Party Orders",
      "Staff Khata": "Staff Khata",
      "Market Udhari": "Market Udhari",
      "All Reports": "All Reports",
      "Menu Manager": "Menu Manager",
      "Daily Expenses": "Daily Expenses",
      "Mahajan Manager": "Mahajan Manager",
      "Theme": "Theme",
      "Logout": "Logout",
      "Home": "Home",
      "Stock": "Stock",
      "Orders": "Orders",
      "Udhari": "Udhari",
      "Menu": "Menu",

      // Dashboard
      "Welcome back, here's your daily summary.": "Welcome back, here's your daily summary.",
      "Staff Present": "Staff Present",
      "Pending Orders": "Pending Orders",
      "Expiring Stock": "Expiring Stock",
      "Upcoming Orders": "Upcoming Orders",
      "Low Stock Alerts": "Low Stock Alerts",

      // Public Menu
      "Our": "Our",
      "Authentic taste, crafted with love.": "Authentic taste, crafted with love.",
      "Search for sweets, snacks...": "Search for sweets, snacks...",
      "No items found": "No items found",
      "Try searching for something else.": "Try searching for something else.",
      "Bestseller": "Bestseller",
      "OUT OF STOCK": "OUT OF STOCK",
      "Premium Menu": "Premium Menu"
    }
  },
  hi: {
    translation: {
      // Sidebar
      "Overview": "डैशबोर्ड",
      "Stock & Inventory": "स्टॉक और इन्वेंटरी",
      "Party Orders": "पार्टी ऑर्डर्स",
      "Staff Khata": "स्टाफ खाता",
      "Market Udhari": "बाजार उधारी",
      "All Reports": "सभी रिपोर्ट्स",
      "Menu Manager": "मेन्यू मैनेजर",
      "Daily Expenses": "रोज का खर्च",
      "Mahajan Manager": "महाजन मैनेजर",
      "Theme": "थीम",
      "Logout": "लॉग आउट",
      "Home": "होम",
      "Stock": "स्टॉक",
      "Orders": "ऑर्डर्स",
      "Udhari": "उधारी",
      "Menu": "मेन्यू",

      // Dashboard
      "Welcome back, here's your daily summary.": "वापसी पर स्वागत है, यहाँ आपका दैनिक सारांश है।",
      "Staff Present": "उपस्थित स्टाफ",
      "Pending Orders": "पेंडिंग ऑर्डर्स",
      "Expiring Stock": "एक्सपायर होने वाला स्टॉक",
      "Upcoming Orders": "आने वाले ऑर्डर्स",
      "Low Stock Alerts": "कम स्टॉक अलर्ट",

      // Public Menu
      "Our": "हमारा",
      "Authentic taste, crafted with love.": "असली स्वाद, प्यार से बनाया गया।",
      "Search for sweets, snacks...": "मिठाई, स्नैक्स खोजें...",
      "No items found": "कोई आइटम नहीं मिला",
      "Try searching for something else.": "कुछ और खोजने का प्रयास करें।",
      "Bestseller": "सबसे ज्यादा बिकने वाला",
      "OUT OF STOCK": "स्टॉक खत्म",
      "Premium Menu": "प्रीमियम मेन्यू"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('app_lang') || 'en',
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;