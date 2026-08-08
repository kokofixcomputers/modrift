import { createContext, useContext, useState } from 'react';

export type Lang = 'en' | 'es' | 'fr' | 'zh';

export const LANGUAGES: { code: Lang; label: string; flag: string; native: string }[] = [
  { code: 'en', label: 'English',  flag: '🇬🇧', native: 'English'  },
  { code: 'es', label: 'Spanish',  flag: '🇪🇸', native: 'Español'  },
  { code: 'fr', label: 'French',   flag: '🇫🇷', native: 'Français' },
  { code: 'zh', label: 'Chinese',  flag: '🇨🇳', native: '中文'     },
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
