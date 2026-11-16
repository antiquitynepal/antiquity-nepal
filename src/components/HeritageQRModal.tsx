import React, { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Image as ImageIcon,
  QrCode,
  X,
} from 'lucide-react';
import {
  buildHeritageShareUrl,
  findHeritageSite,
  QRTargetId,
} from '../utils/heritageShare';
import {
  HeritageQRCodeSvg,
  renderHeritageQrPlaqueCanvas,
} from './HeritageQRCodeSvg';
import { SocialShareButtons } from './SocialShareButtons';
import { useLanguage } from '../utils/i18n';
import { useHeritageSites } from '../utils/heritageSitesContext';

export type { QRTargetId };

interface HeritageQRModalProps {
  isOpen: boolean;
  initialTargetId?: QRTargetId;
  onClose: () => void;
}

export const HeritageQRModal: React.FC<HeritageQRModalProps> = ({
  isOpen,
  initialTargetId = 'atlas',
  onClose,
}) => {
  const { t } = useLanguage();
  const { sites } = useHeritageSites();
  const [targetId, setTargetId] = useState<QRTargetId>(initialTargetId);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [imageCopyError, setImageCopyError] = useState<string | null>(null);

  // Sync when modal re-opens with a different target
  React.useEffect(() => {
    if (isOpen) {
      setTargetId(initialTargetId);
      setCopiedLink(false);
      setCopiedImage(false);
      setImageCopyError(null);
    }
  }, [isOpen, initialTargetId]);

  const selectedSite = useMemo(() => findHeritageSite(targetId, sites), [targetId, sites]);
  const targetUrl = useMemo(() => buildHeritageShareUrl(targetId, sites), [targetId, sites]);

  const handleDownloadPng = () => {
    const canvas = renderHeritageQrPlaqueCanvas(targetId);
    const link = document.createElement('a');
    const slug = selectedSite ? selectedSite.slug : 'full-atlas';
    link.download = `kathmandu-heritage-${slug}-qr.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleCopyImage = async () => {
    setImageCopyError(null);
    try {
      const canvas = renderHeritageQrPlaqueCanvas(targetId);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );
      if (!blob || !navigator.clipboard || typeof ClipboardItem === 'undefined') {
        throw new Error(
          'Clipboard image copy is unavailable in this browser—use Download PNG instead.'
        );
      }
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 2500);
    } catch (err) {
      setImageCopyError(
        err instanceof Error
          ? err.message
          : 'Unable to copy image—please use Download QR Card.'
      );
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback ignored cleanly
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="heritage-qr-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-lg border border-stone-300 bg-[#F8F5F0] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-stone-300 bg-[#EFEAE1] px-6 py-4">
          <div>
            <p className="text-xs font-medium text-[#9A3412]">
              {t('qrModalEyebrow')}
            </p>
            <h3
              id="heritage-qr-modal-title"
              className="mt-0.5 font-serif text-2xl sm:text-3xl font-semibold text-[#1C1917]"
            >
              {t('qrModalTitle')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close QR & Share dialog"
            className="rounded p-1.5 text-stone-600 hover:bg-stone-200 hover:text-[#1C1917]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12 items-center">
            {/* Left Column: Bespoke Heritage QR Plaque */}
            <div className="md:col-span-5 flex flex-col items-center">
              <div className="w-full max-w-[270px] rounded-md border-2 border-[#1C1917] bg-white p-3 shadow-sm">
                <div className="border border-[#9A3412]/70 bg-[#F8F5F0] p-3 text-center">
                  <p className="text-[9px] font-semibold tracking-wider uppercase text-[#9A3412]">
                    {t('brandTitle')}
                  </p>
                  <p className="mt-0.5 font-serif text-base font-semibold text-[#1C1917] leading-tight">
                    {selectedSite ? selectedSite.name : t('qrModalFullAtlas')}
                  </p>

                  <div className="mt-2.5 rounded border border-stone-300 bg-[#F8F5F0] p-1.5">
                    <HeritageQRCodeSvg
                      url={targetUrl}
                      label={`QR code for ${
                        selectedSite ? selectedSite.name : 'Kathmandu Heritage Atlas'
                      }`}
                    />
                  </div>

                  <p className="mt-2 text-[10px] font-medium text-stone-700">
                    {t('qrModalScanLabel')}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Destination Selector, URL & QR Card Actions */}
            <div className="md:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                  {t('qrModalSelectLabel')}
                </label>
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-[#1C1917]"
                >
                  <option value="atlas">
                    {t('qrModalFullOption')}
                  </option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.district.split('·')[0].trim()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-md border border-stone-300 bg-[#EFEAE1] p-3">
                <p className="text-[11px] font-semibold text-stone-700 mb-1">
                  {t('qrModalLinkLabel')}
                </p>
                <p className="break-all font-mono text-[11px] text-stone-800">
                  {targetUrl}
                </p>
              </div>

              {imageCopyError && (
                <p className="rounded border border-[#9A3412]/40 bg-[#9A3412]/10 px-3 py-2 text-[11px] text-[#9A3412]">
                  {imageCopyError}
                </p>
              )}

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#9A3412] px-4 py-2.5 text-xs font-medium text-white hover:bg-[#7C2D12] transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{t('qrModalDownload')}</span>
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => void handleCopyImage()}
                    className="inline-flex items-center justify-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-[#1C1917] hover:border-stone-500 transition-colors"
                  >
                    {copiedImage ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-700" />
                        <span>{t('qrModalImgCopied')}</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-3.5 w-3.5 text-[#9A3412]" />
                        <span>{t('qrModalCopyImg')}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleCopyLink()}
                    className="inline-flex items-center justify-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-[#1C1917] hover:border-stone-500 transition-colors"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-700" />
                        <span>{t('qrModalUrlCopied')}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-[#9A3412]" />
                        <span>{t('qrModalCopyUrl')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Direct Social & Messaging Share Row */}
          <div className="border-t border-stone-300 pt-4">
            <p className="text-xs font-semibold text-stone-800 mb-2.5">
              {t('qrModalSocialTitle')}
            </p>
            <SocialShareButtons
              targetId={targetId}
              compact
              includeQrImageOnNativeShare
            />
          </div>
        </div>

        <div className="border-t border-stone-300 bg-[#EFEAE1] px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-[11px] text-stone-600">
          <span className="inline-flex items-center gap-1.5">
            <QrCode className="h-3.5 w-3.5 text-[#9A3412] shrink-0" />
            <span>
              {t('qrModalFooterNote')}
            </span>
          </span>
          <div className="flex items-center gap-2.5 shrink-0">
            <img
              src="/assets/aistudio/6e112a5a-e7c6-4593-b7d8-3cb913521721_11255886.webp"
              alt="Kathmandu Heritage Atlas Logo"
              referrerPolicy="no-referrer"
              className="h-8 w-8 aspect-square rounded object-contain bg-[#22292A] border border-stone-300 shrink-0"
            />
            <span className="font-medium text-stone-800">Suraj Giri · Antiquity Nepal</span>
          </div>
        </div>
      </div>
    </div>
  );
};
