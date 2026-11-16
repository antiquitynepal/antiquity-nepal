import React, { useState } from 'react';
import { Check, Mail } from 'lucide-react';
import {
  MAX_EMAIL_LENGTH,
  normalizeAndValidateEmail,
  subscribeToNewsletter,
} from '../utils/newsletterDb';
import { useLanguage } from '../utils/i18n';

export const FooterNewsletterForm: React.FC = () => {
  const { t, language } = useLanguage();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [subscribedEmail, setSubscribedEmail] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);

    const validated = normalizeAndValidateEmail(email);
    if (!validated) {
      setErrorMsg(t('newsletterInvalidEmail'));
      return;
    }

    setSubmitting(true);
    try {
      const result = await subscribeToNewsletter(validated, language);
      setSubscribedEmail(result.email);
      setEmail('');
    } catch {
      setErrorMsg(t('newsletterError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border border-stone-300 bg-[#EFEAE1] p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9A3412]">
            {t('newsletterEyebrow')}
          </p>
          <p className="mt-0.5 font-serif text-lg sm:text-xl font-semibold text-[#1C1917]">
            {t('newsletterTitle')}
          </p>
          <p className="mt-1 text-xs text-stone-600 max-w-xl">
            {t('newsletterDesc')}
          </p>
        </div>

        <div className="w-full lg:w-auto lg:min-w-[400px] shrink-0">
          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-2 sm:flex-row sm:items-stretch"
          >
            <div className="relative flex-1 min-w-0">
              <Mail
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
              />
              <input
                type="email"
                name="newsletter-email"
                autoComplete="email"
                maxLength={MAX_EMAIL_LENGTH}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                  if (subscribedEmail) setSubscribedEmail(null);
                }}
                placeholder={t('newsletterPlaceholder')}
                aria-label={t('newsletterPlaceholder')}
                disabled={submitting}
                className="w-full rounded-md border border-stone-300 bg-white py-2.5 pl-9 pr-3 text-xs sm:text-sm text-[#1C1917] placeholder:text-stone-400 focus:border-[#9A3412] focus:outline-none disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-[#9A3412] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-[#7C2D12] transition-colors whitespace-nowrap shrink-0 disabled:opacity-60"
            >
              {submitting ? t('newsletterSubscribing') : t('newsletterSubscribe')}
            </button>
          </form>

          {errorMsg && (
            <p role="alert" className="mt-2 text-xs font-medium text-[#9A3412]">
              {errorMsg}
            </p>
          )}

          {subscribedEmail && !errorMsg && (
            <p
              role="status"
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800"
            >
              <Check className="h-3.5 w-3.5 shrink-0" />
              <span>{t('newsletterSuccess', { email: subscribedEmail })}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
