import React from 'react';
import { AlertCircle, Languages, Loader2, X } from 'lucide-react';
import {
  LANGUAGE_OPTIONS,
  LanguageCode,
  useLanguage,
} from '../utils/i18n';

interface LanguageSelectorProps {
  align?: 'left' | 'right';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  align = 'left',
}) => {
  const {
    language,
    setLanguage,
    t,
    isTranslating,
    translationError,
    dismissTranslationError,
  } = useLanguage();

  return (
    <div
      className={`relative flex flex-col ${
        align === 'right' ? 'items-end' : 'items-start'
      }`}
    >
      <div
        role="group"
        aria-label="Translate page language"
        className="inline-flex items-center gap-1 rounded border border-stone-300 bg-[#EFEAE1]/80 px-2 py-0.5 text-[11px] text-[#1C1917]"
      >
        <span className="inline-flex items-center gap-1 pr-1 text-stone-600 font-medium whitespace-nowrap">
          {isTranslating ? (
            <Loader2
              className="h-3 w-3 animate-spin text-[#9A3412] shrink-0"
              aria-hidden="true"
            />
          ) : (
            <Languages
              className="h-3 w-3 text-[#9A3412] shrink-0"
              aria-hidden="true"
            />
          )}
          <span className="hidden md:inline">
            {isTranslating ? t('langTranslating') : t('langBarLabel')}
          </span>
        </span>

        <div className="flex items-center gap-0.5">
          {LANGUAGE_OPTIONS.map((opt) => {
            const active = language === opt.code;
            return (
              <button
                key={opt.code}
                type="button"
                onClick={() => setLanguage(opt.code as LanguageCode)}
                aria-pressed={active}
                title={`${opt.nativeName} (${opt.englishName})`}
                className={`rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#9A3412] text-white'
                    : 'text-stone-700 hover:bg-stone-200/80 hover:text-[#1C1917]'
                }`}
              >
                <span className="sm:hidden font-mono">{opt.shortLabel}</span>
                <span className="hidden sm:inline">{opt.nativeName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {translationError && (
        <div
          className={`absolute top-full mt-1.5 z-50 flex items-center gap-2 rounded border border-[#9A3412]/40 bg-[#F8F5F0] px-2.5 py-1.5 text-[11px] text-[#9A3412] shadow-md max-w-xs ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{translationError}</span>
          <button
            type="button"
            onClick={dismissTranslationError}
            aria-label="Dismiss translation notice"
            className="rounded p-0.5 hover:bg-stone-200 shrink-0"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
};
