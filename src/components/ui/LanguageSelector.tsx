'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Locale } from '@/lib/i18n/translations';

export function LanguageSelector() {
  const { locale, setLocale } = useLanguage();

  const languages: { code: Locale; label: string; flag: string }[] = [
    { code: 'en', label: 'EN', flag: '🇺🇸' },
    { code: 'pt', label: 'PT', flag: '🇧🇷' },
  ];

  return (
    <div className="flex items-center gap-1 bg-poker-brown-dark/50 rounded-lg p-1">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLocale(lang.code)}
          className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
            locale === lang.code
              ? 'bg-poker-gold text-poker-brown-dark'
              : 'text-poker-cream/70 hover:text-poker-gold'
          }`}
          title={lang.code === 'en' ? 'English' : 'Português'}
        >
          <span className="mr-1">{lang.flag}</span>
          {lang.label}
        </button>
      ))}
    </div>
  );
}
