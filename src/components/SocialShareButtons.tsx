import React, { useMemo, useState } from 'react';
import { Check, Mail, QrCode, Share2 } from 'lucide-react';
import {
  getHeritageSharePayload,
  QRTargetId,
} from '../utils/heritageShare';
import { renderHeritageQrPlaqueCanvas } from './HeritageQRCodeSvg';
import { useLanguage } from '../utils/i18n';

interface SocialShareButtonsProps {
  targetId: QRTargetId;
  compact?: boolean;
  onOpenQR?: (targetId: QRTargetId) => void;
  includeQrImageOnNativeShare?: boolean;
}

export const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({
  targetId,
  compact = false,
  onOpenQR,
  includeQrImageOnNativeShare = true,
}) => {
  const { t } = useLanguage();
  const [feedback, setFeedback] = useState<string | null>(null);

  const payload = useMemo(() => getHeritageSharePayload(targetId), [targetId]);
  const fullText = `${payload.message} ${payload.url}`;

  const flashFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => {
      setFeedback((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const copyShareMessage = async (msg: string) => {
    try {
      await navigator.clipboard?.writeText(fullText);
      flashFeedback(msg);
    } catch {
      flashFeedback('Ready to share — use Copy URL if clipboard access is blocked.');
    }
  };

  const handleNativeShare = async () => {
    const shareData: ShareData = {
      title: payload.title,
      text: payload.message,
      url: payload.url,
    };

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        if (includeQrImageOnNativeShare && typeof navigator.canShare === 'function') {
          const canvas = renderHeritageQrPlaqueCanvas(targetId);
          const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, 'image/png')
          );
          if (blob) {
            const slug = payload.site ? payload.site.slug : 'full-atlas';
            const file = new File([blob], `kathmandu-heritage-${slug}-qr.png`, {
              type: 'image/png',
            });
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({ ...shareData, files: [file] });
              flashFeedback('Shared via system share sheet.');
              return;
            }
          }
        }
        await navigator.share(shareData);
        flashFeedback('Shared via system share sheet.');
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
      }
    }

    await copyShareMessage('Invite & link copied — paste into any app!');
  };

  const shareChannels = [
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(fullText)}`,
      external: true,
      onClick: undefined,
      icon: (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-[#15803D]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      ),
    },
    {
      id: 'facebook',
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        payload.url
      )}&quote=${encodeURIComponent(payload.message)}`,
      external: true,
      onClick: undefined,
      icon: (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-[#1D4ED8]" fill="currentColor" aria-hidden="true">
          <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" />
        </svg>
      ),
    },
    {
      id: 'messenger',
      label: 'Messenger',
      href: 'https://www.messenger.com/',
      external: true,
      onClick: () => {
        void copyShareMessage(
          'Link & message copied — paste directly into your Messenger chat.'
        );
      },
      icon: (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-[#0284C7]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.15 2 11.27c0 2.9 1.45 5.49 3.72 7.2V22l3.4-1.87c.91.25 1.88.39 2.88.39 5.52 0 10-4.15 10-9.25C22 6.15 17.52 2 12 2z" />
          <path d="m8 13 3-3 2 2 3-3" />
        </svg>
      ),
    },
    {
      id: 'viber',
      label: 'Viber',
      href: `viber://forward?text=${encodeURIComponent(fullText)}`,
      external: false,
      onClick: () => {
        void copyShareMessage(
          'Opening Viber — message & URL also copied to clipboard.'
        );
      },
      icon: (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-[#7C3AED]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
          <path d="M14.5 2.5a7 7 0 0 1 7 7" />
          <path d="M14.5 6a3.5 3.5 0 0 1 3.5 3.5" />
        </svg>
      ),
    },
    {
      id: 'mail',
      label: 'Mail',
      href: `mailto:?subject=${encodeURIComponent(
        payload.title
      )}&body=${encodeURIComponent(
        `${payload.message}\n\n${payload.url}\n\nCurated by Suraj Giri · Antiquity Nepal`
      )}`,
      external: false,
      onClick: undefined,
      icon: <Mail className="h-3.5 w-3.5 shrink-0 text-[#9A3412]" aria-hidden="true" />,
    },
    {
      id: 'telegram',
      label: 'Telegram',
      href: `https://t.me/share/url?url=${encodeURIComponent(
        payload.url
      )}&text=${encodeURIComponent(payload.message)}`,
      external: true,
      onClick: undefined,
      icon: (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-[#0369A1]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m22 2-7 20-4-9-9-4Z" />
          <path d="M22 2 11 13" />
        </svg>
      ),
    },
    {
      id: 'x',
      label: 'X / Twitter',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        payload.message
      )}&url=${encodeURIComponent(payload.url)}`,
      external: true,
      onClick: undefined,
      icon: (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-[#1C1917]" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        payload.url
      )}`,
      external: true,
      onClick: undefined,
      icon: (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-[#0A66C2]" fill="currentColor" aria-hidden="true">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
        </svg>
      ),
    },
  ];

  const buttonClass = compact
    ? 'inline-flex items-center gap-1.5 rounded border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-medium text-[#1C1917] hover:border-[#9A3412] hover:text-[#9A3412] transition-colors whitespace-nowrap shrink-0'
    : 'inline-flex items-center justify-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-[#1C1917] hover:border-[#9A3412] hover:text-[#9A3412] transition-colors whitespace-nowrap shrink-0';

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {shareChannels.map((ch) => (
          <a
            key={ch.id}
            href={ch.href}
            target={ch.external ? '_blank' : undefined}
            rel={ch.external ? 'noopener noreferrer' : undefined}
            onClick={ch.onClick}
            aria-label={`Share via ${ch.label}`}
            className={buttonClass}
          >
            {ch.icon}
            <span>{ch.label}</span>
          </a>
        ))}

        <button
          type="button"
          onClick={() => void handleNativeShare()}
          aria-label="Share to other apps on your device"
          className={
            compact
              ? 'inline-flex items-center gap-1.5 rounded border border-stone-300 bg-[#F8F5F0] px-2.5 py-1.5 text-xs font-medium text-[#1C1917] hover:border-[#9A3412] hover:text-[#9A3412] transition-colors whitespace-nowrap shrink-0'
              : 'inline-flex items-center justify-center gap-1.5 rounded-md border border-stone-300 bg-[#EFEAE1] px-3 py-2 text-xs font-medium text-[#1C1917] hover:border-[#9A3412] hover:text-[#9A3412] transition-colors whitespace-nowrap shrink-0'
          }
        >
          <Share2 className="h-3.5 w-3.5 text-[#9A3412]" />
          <span>{t('shareOtherApps')}</span>
        </button>

        {onOpenQR && (
          <button
            type="button"
            onClick={() => onOpenQR(targetId)}
            className={
              compact
                ? 'inline-flex items-center gap-1.5 rounded bg-[#9A3412] px-2.5 py-1.5 text-xs font-medium text-white hover:bg-[#7C2D12] transition-colors whitespace-nowrap shrink-0'
                : 'inline-flex items-center justify-center gap-1.5 rounded-md bg-[#9A3412] px-3 py-2 text-xs font-medium text-white hover:bg-[#7C2D12] transition-colors whitespace-nowrap shrink-0'
            }
          >
            <QrCode className="h-3.5 w-3.5" />
            <span>{t('shareQrCard')}</span>
          </button>
        )}
      </div>

      {feedback && (
        <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-800">
          <Check className="h-3.5 w-3.5 shrink-0" />
          <span>{feedback}</span>
        </p>
      )}
    </div>
  );
};
