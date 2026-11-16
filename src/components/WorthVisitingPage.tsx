import React from 'react';
import { NotableSitesRegistry } from './NotableSitesRegistry';
import { useLanguage } from '../utils/i18n';

interface WorthVisitingPageProps {
  onBackToOverview: () => void;
}

export const WorthVisitingPage: React.FC<WorthVisitingPageProps> = ({
  onBackToOverview: _onBackToOverview,
}) => {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-[1360px] px-4 sm:px-6 py-10 space-y-8">
      <div className="border-b border-stone-300/80 pb-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9A3412]">
            {t('otherEyebrow')}
          </p>
          <h1 className="mt-1 font-serif text-3xl sm:text-5xl font-semibold tracking-tight text-[#1C1917] [text-wrap:balance]">
            {t('otherTitle')}
          </h1>
          <p className="mt-2 max-w-3xl text-sm sm:text-base leading-relaxed text-stone-700">
            {t('otherDesc')}
          </p>
        </div>
      </div>

      <NotableSitesRegistry />
    </div>
  );
};
