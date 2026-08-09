import React, { createContext, useContext, useState } from 'react';

export type Lang = 'en' | 'es' | 'fr' | 'zh';

export const FLAG_SVGS: Record<Lang, React.ReactNode> = {
  en: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 15" width="20" height="15" style={{ borderRadius: 2, display: 'block', flexShrink: 0 }}>
      {/* UK flag */}
      <rect width="20" height="15" fill="#012169"/>
      <path d="M0 0l20 15M20 0L0 15" stroke="#fff" strokeWidth="3"/>
      <path d="M0 0l20 15M20 0L0 15" stroke="#C8102E" strokeWidth="2"/>
      <path d="M10 0v15M0 7.5h20" stroke="#fff" strokeWidth="5"/>
      <path d="M10 0v15M0 7.5h20" stroke="#C8102E" strokeWidth="3"/>
    </svg>
  ),
  es: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 15" width="20" height="15" style={{ borderRadius: 2, display: 'block', flexShrink: 0 }}>
      <rect width="20" height="15" fill="#c60b1e"/>
      <rect y="3.75" width="20" height="7.5" fill="#ffc400"/>
    </svg>
  ),
  fr: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 15" width="20" height="15" style={{ borderRadius: 2, display: 'block', flexShrink: 0 }}>
      <rect width="20" height="15" fill="#ED2939"/>
      <rect width="13.33" height="15" fill="#fff"/>
      <rect width="6.67" height="15" fill="#002395"/>
    </svg>
  ),
  zh: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 15" width="20" height="15" style={{ borderRadius: 2, display: 'block', flexShrink: 0 }}>
      <rect width="20" height="15" fill="#DE2910"/>
      <polygon points="3,1.5 3.9,4.2 1.5,2.6 4.5,2.6 2.1,4.2" fill="#FFDE00"/>
      <polygon points="7,0.5 7.5,2 6.3,1.1 8,1.1 6.7,2" fill="#FFDE00" transform="rotate(-20,7,1)"/>
      <polygon points="8.5,2.5 9,4 7.8,3.1 9.5,3.1 8.2,4" fill="#FFDE00" transform="rotate(15,8.5,3)"/>
      <polygon points="8,5 8.5,6.5 7.3,5.6 9,5.6 7.7,6.5" fill="#FFDE00" transform="rotate(-5,8,5.5)"/>
      <polygon points="7,7 7.5,8.5 6.3,7.6 8,7.6 6.7,8.5" fill="#FFDE00" transform="rotate(20,7,7.5)"/>
    </svg>
  ),
};

export const LANGUAGES: { code: Lang; label: string; native: string }[] = [
  { code: 'en', label: 'English',  native: 'English'  },
  { code: 'es', label: 'Spanish',  native: 'Español'  },
  { code: 'fr', label: 'French',   native: 'Français' },
  { code: 'zh', label: 'Chinese',  native: '中文'     },
];

const TRANSLATE_API = 'http://wing.kokodev.cc:10004/translate';

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  translate: (text: string) => Promise<string>;
  forceTranslate: (text: string, target?: Lang) => Promise<string>;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  translate: async t => t,
  forceTranslate: async t => t,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');

  const callApi = async (text: string, target: Lang): Promise<string> => {
    if (!text.trim()) return text;
    const res = await fetch(TRANSLATE_API, {
      method: 'POST',
      body: JSON.stringify({ q: text, source: 'auto', target, format: 'text', alternatives: 3, api_key: '' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    return (data.translatedText as string) ?? text;
  };

  const translate = async (text: string): Promise<string> => {
    if (!text.trim() || lang === 'en') return text;
    return callApi(text, lang);
  };

  const forceTranslate = async (text: string, target: Lang = lang === 'en' ? 'en' : lang): Promise<string> => {
    return callApi(text, target);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, translate, forceTranslate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
