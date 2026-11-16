import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useLanguage } from '../utils/i18n';

interface BackToTopButtonProps {
  heroElementId?: string;
  fallbackScrollY?: number;
  watchKey?: string;
}

export const BackToTopButton: React.FC<BackToTopButtonProps> = ({
  heroElementId = 'overview-hero',
  fallbackScrollY = 520,
  watchKey,
}) => {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const evaluateVisibility = () => {
      const heroEl = document.getElementById(heroElementId);
      if (heroEl) {
        const rect = heroEl.getBoundingClientRect();
        // Appear as soon as the bottom edge of the hero section has scrolled above the viewport top
        setVisible(rect.bottom <= 0);
      } else {
        setVisible(window.scrollY > fallbackScrollY);
      }
    };

    evaluateVisibility();
    window.addEventListener('scroll', evaluateVisibility, { passive: true });
    window.addEventListener('resize', evaluateVisibility, { passive: true });

    return () => {
      window.removeEventListener('scroll', evaluateVisibility);
      window.removeEventListener('resize', evaluateVisibility);
    };
  }, [heroElementId, fallbackScrollY, watchKey]);

  const scrollToTop = () => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label={t('backToTop')}
      title={t('backToTop')}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 inline-flex items-center gap-2 rounded-md border border-stone-700/80 bg-[#1C1917] px-3.5 py-2.5 text-xs font-semibold text-[#F8F5F0] shadow-md hover:border-[#9A3412] hover:bg-[#9A3412] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A3412] transition-all duration-200 whitespace-nowrap print:hidden ${
        visible
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : 'translate-y-3 opacity-0 pointer-events-none'
      }`}
    >
      <ArrowUp className="h-3.5 w-3.5 shrink-0" />
      <span>{t('backToTop')}</span>
    </button>
  );
};
