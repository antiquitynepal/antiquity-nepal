import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Headphones,
  MapPin,
  Volume2,
} from 'lucide-react';
import { HeritageSite } from '../data/heritageSites';
import { AudioGuidePlayer } from './AudioGuidePlayer';
import { useLanguage, useTranslatedTexts } from '../utils/i18n';
import { useHeritageSites } from '../utils/heritageSitesContext';

interface AudioGuidesPageProps {
  onBackToOverview: () => void;
  onOpenSiteTab: (siteId: string) => void;
}

export const AudioGuidesPage: React.FC<AudioGuidesPageProps> = ({
  onBackToOverview: _onBackToOverview,
  onOpenSiteTab,
}) => {
  const { t, translateCategory } = useLanguage();
  const { sites } = useHeritageSites();
  const [selectedSiteId, setSelectedSiteId] = useState<string>(sites[0]?.id ?? '');
  const [activeChapterIdx, setActiveChapterIdx] = useState<number>(0);
  const [autoPlaySignal, setAutoPlaySignal] = useState<number>(0);

  const selectedSite: HeritageSite | undefined =
    sites.find((s) => s.id === selectedSiteId) ?? sites[0];

  const sourceMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of sites) {
      map[`${s.id}:name`] = s.name;
      map[`${s.id}:era`] = s.era;
      map[`${s.id}:district`] = s.district;
      s.audioChapters.forEach((ch, idx) => {
        map[`${s.id}:ch:${idx}`] = ch.title;
        map[`${s.id}:role:${idx}`] = ch.narratorRole;
      });
    }
    return map;
  }, [sites]);

  const tr = useTranslatedTexts(sourceMap);
  const ts = (key: string, fallback: string) => tr[key] || fallback;

  // Build localized chapters array for the selected site so titles & narrator roles match the selected UI language cleanly
  const localizedChapters = useMemo(() => {
    if (!selectedSite) return [];
    return selectedSite.audioChapters.map((ch, idx) => ({
      ...ch,
      title: tr[`${selectedSite.id}:ch:${idx}`] || ch.title,
      narratorRole: tr[`${selectedSite.id}:role:${idx}`] || ch.narratorRole,
    }));
  }, [selectedSite, tr]);

  if (!selectedSite) {
    return (
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 py-12 text-center text-sm text-stone-600">
        No active heritage sites in directory. Use the Admin view to add or restore monuments.
      </div>
    );
  }

  const handleSelectSiteAndListen = (siteId: string, chapterIndex = 0) => {
    setSelectedSiteId(siteId);
    setActiveChapterIdx(chapterIndex);
    setAutoPlaySignal((n) => n + 1);
    document
      .getElementById('audio-player-desk')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="mx-auto max-w-[1360px] px-4 sm:px-6 py-10 space-y-10">
      {/* Page Masthead */}
      <div className="border-b border-stone-300/80 pb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9A3412]">
              {t('audioEyebrow')}
            </p>
            <h1 className="mt-1 font-serif text-3xl sm:text-5xl font-semibold tracking-tight text-[#1C1917] [text-wrap:balance]">
              {t('audioTitle')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm sm:text-base leading-relaxed text-stone-700">
              {t('audioDesc')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 rounded-md border border-stone-300 bg-[#EFEAE1] px-4 py-3 text-xs text-stone-700 shrink-0">
            <div>
              <span className="text-stone-500">{t('statZones')}:</span>{' '}
              <strong className="font-mono text-[#1C1917] tabular-nums">07</strong>
            </div>
            <span aria-hidden="true" className="text-stone-400">·</span>
            <div>
              <span className="text-stone-500">{t('statAudio')}:</span>{' '}
              <strong className="font-mono text-[#1C1917] tabular-nums">21</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Acoustic Studio Player Desk */}
      <section id="audio-player-desk" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {sites.map((s) => {
              const active = s.id === selectedSite.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSelectedSiteId(s.id);
                    setActiveChapterIdx(0);
                  }}
                  className={`rounded-md px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#9A3412] text-white'
                      : 'border border-stone-300 bg-white text-stone-700 hover:border-stone-500'
                  }`}
                >
                  {ts(`${s.id}:name`, s.name)}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => onOpenSiteTab(selectedSite.id)}
            className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-[#F8F5F0] px-3.5 py-2 text-xs font-semibold text-[#1C1917] hover:border-[#9A3412] hover:text-[#9A3412] transition-colors whitespace-nowrap shrink-0"
          >
            <span>
              {t('stageOpenBtn', {
                site: ts(`${selectedSite.id}:name`, selectedSite.name),
              })}
            </span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <AudioGuidePlayer
          siteName={ts(`${selectedSite.id}:name`, selectedSite.name)}
          chapters={localizedChapters}
          activeChapterIndex={activeChapterIdx}
          onChangeChapter={setActiveChapterIdx}
          autoPlaySignal={autoPlaySignal}
        />
      </section>

      {/* Complete Curated Audio Guides Table */}
      <section className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9A3412]">
            {t('audioPageCatalogEyebrow')}
          </p>
          <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-semibold text-[#1C1917]">
            {t('audioPageCatalogTitle')}
          </h2>
        </div>

        <div className="overflow-x-auto rounded-lg border border-stone-300 bg-white">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-stone-300 bg-[#EFEAE1] text-xs font-semibold text-stone-700">
                <th className="px-4 py-3">{t('audioColSite')}</th>
                <th className="px-4 py-3">{t('audioColEra')}</th>
                <th className="px-4 py-3">{t('audioColChapter')}</th>
                <th className="px-4 py-3 text-right">{t('audioColDuration')}</th>
                <th className="px-4 py-3 text-right">{t('audioColAction')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {sites.map((site) => {
                const totalSec = site.audioChapters.reduce(
                  (sum, ch) => sum + ch.durationSec,
                  0
                );
                const mins = Math.floor(totalSec / 60);
                const secs = totalSec % 60;
                const isSelected = site.id === selectedSite.id;

                return (
                  <tr
                    key={site.id}
                    className={`transition-colors ${
                      isSelected ? 'bg-[#F8F5F0]' : 'hover:bg-stone-50'
                    }`}
                  >
                    <td className="px-4 py-3.5 font-medium text-[#1C1917]">
                      <div className="flex items-center gap-2.5">
                        <MapPin className="h-3.5 w-3.5 text-[#9A3412] shrink-0" />
                        <div>
                          <p className="font-semibold">
                            {ts(`${site.id}:name`, site.name)}
                          </p>
                          <p className="text-[11px] text-stone-500">
                            {translateCategory(site.category)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-stone-600">
                      <p>{ts(`${site.id}:era`, site.era)}</p>
                      <p className="text-stone-500 mt-0.5">
                        {ts(`${site.id}:district`, site.district)}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-stone-700 space-y-1">
                      {site.audioChapters.map((ch, idx) => (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => handleSelectSiteAndListen(site.id, idx)}
                          className="flex items-center gap-1.5 text-left hover:text-[#9A3412] transition-colors"
                        >
                          <Headphones className="h-3 w-3 text-[#9A3412] shrink-0" />
                          <span>
                            {ch.number}. {ts(`${site.id}:ch:${idx}`, ch.title)}
                          </span>
                        </button>
                      ))}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-xs text-stone-700 tabular-nums whitespace-nowrap">
                      {mins}:{String(secs).padStart(2, '0')} ({site.audioChapters.length} ch)
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleSelectSiteAndListen(site.id, 0)}
                          className="inline-flex items-center gap-1.5 rounded bg-[#9A3412] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#7C2D12] transition-colors whitespace-nowrap"
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                          <span>{t('audioListenNow')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenSiteTab(site.id)}
                          className="inline-flex items-center gap-1 rounded border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-medium text-[#1C1917] hover:border-[#9A3412] hover:text-[#9A3412] transition-colors whitespace-nowrap"
                        >
                          <span>{t('cardExploreTab')}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
