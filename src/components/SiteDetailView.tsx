import React, { useState } from 'react';
import {
  BookOpen,
  Clock,
  Compass,
  ExternalLink,
  Footprints,
  Headphones,
  Landmark,
  Mail,
  MapPin,
  Navigation,
  QrCode,
  ShieldCheck,
  Ticket,
  Users,
} from 'lucide-react';
import {
  HeritageSite,
  PanoramaHotspot,
  TransportMode,
} from '../data/heritageSites';
import { PanoramaTourViewer } from './PanoramaTourViewer';
import { AudioGuidePlayer } from './AudioGuidePlayer';
import { HeritageContactsPanel } from './HeritageContactsPanel';
import { HeritageGmailPanel } from './HeritageGmailPanel';
import { HeritageQRCodeSvg } from './HeritageQRCodeSvg';
import { SocialShareButtons } from './SocialShareButtons';
import { buildHeritageShareUrl } from '../utils/heritageShare';
import { useLanguage, useTranslatedTexts } from '../utils/i18n';

interface SiteDetailViewProps {
  site: HeritageSite;
  onBackToAtlas: () => void;
  onOpenOtherSite: (siteId: string) => void;
  onOpenQR?: (siteId: string) => void;
  adjacentSites: HeritageSite[];
  activeFeatureTab?: SiteFeatureTab;
  onFeatureTabChange?: (tab: SiteFeatureTab) => void;
}

export type SiteFeatureTab =
  | 'routes'
  | 'audio'
  | 'history'
  | 'architecture'
  | 'companions'
  | 'gmail';

export const SiteDetailView: React.FC<SiteDetailViewProps> = ({
  site,
  onBackToAtlas: _onBackToAtlas,
  onOpenOtherSite,
  onOpenQR,
  adjacentSites,
  activeFeatureTab,
  onFeatureTabChange,
}) => {
  const { t, translateCategory } = useLanguage();
  const [internalFeatureTab, setInternalFeatureTab] = useState<SiteFeatureTab>('routes');
  const featureTab = activeFeatureTab ?? internalFeatureTab;
  const setFeatureTab = (next: SiteFeatureTab) => {
    if (onFeatureTabChange) {
      onFeatureTabChange(next);
    } else {
      setInternalFeatureTab(next);
    }
  };
  const [selectedRouteMode, setSelectedRouteMode] = useState<TransportMode>('Walking Trail');
  const [activeAudioChapter, setActiveAudioChapter] = useState<number>(0);
  const [audioPlaySignal, setAudioPlaySignal] = useState<number>(0);
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null);

  const siteTextMap = React.useMemo(() => {
    const map: Record<string, string> = {
      name: site.name,
      district: site.district,
      summary: site.summary,
      visitingHours: site.visitingHours,
      era: site.era,
      quoteText: site.quote.text,
      quoteAttr: site.quote.attribution,
      dressCode: site.visitorNotes.dressCode,
      etiquette: site.visitorNotes.etiquette,
      photography: site.visitorNotes.photography,
      majorFestival: site.visitorNotes.majorFestival,
    };
    site.historicalEssay.forEach((p, idx) => {
      map[`essay:${idx}`] = p;
    });
    site.timeline.forEach((item, idx) => {
      map[`tl_era:${idx}`] = item.era;
      map[`tl_title:${idx}`] = item.title;
      map[`tl_detail:${idx}`] = item.detail;
    });
    site.architecturalFeatures.forEach((feat, idx) => {
      map[`arch_mat:${idx}`] = feat.material;
      map[`arch_name:${idx}`] = feat.name;
      map[`arch_detail:${idx}`] = feat.detail;
    });
    site.routes.forEach((r) => {
      map[`rt_mode:${r.id}`] = r.mode;
      map[`rt_origin:${r.id}`] = r.origin;
      map[`rt_diff:${r.id}`] = r.difficulty;
      map[`rt_over:${r.id}`] = r.overview;
      map[`rt_win:${r.id}`] = r.bestWindow;
      r.waypoints.forEach((wp) => {
        map[`wp_land:${r.id}:${wp.step}`] = wp.landmark;
        map[`wp_inst:${r.id}:${wp.step}`] = wp.instruction;
        if (wp.note) map[`wp_note:${r.id}:${wp.step}`] = wp.note;
      });
    });
    site.hotspots.forEach((hs) => {
      map[`hs_title:${hs.id}`] = hs.title.split('(')[0].trim();
    });
    adjacentSites.forEach((other) => {
      map[`adj_name:${other.id}`] = other.name;
      map[`adj_dist:${other.id}`] = other.district.split('·')[0].trim();
    });
    return map;
  }, [site, adjacentSites]);

  const tr = useTranslatedTexts(siteTextMap);

  const activeRoute =
    site.routes.find((r) => r.mode === selectedRouteMode) || site.routes[0];

  const handleListenFromHotspot = (chapterIdx: number) => {
    setActiveAudioChapter(chapterIdx);
    setFeatureTab('audio');
    setAudioPlaySignal((n) => n + 1);
    const el = document.getElementById(`site-features-${site.id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <article className="mx-auto max-w-[1360px] px-4 sm:px-6 py-8">
      {/* Site Toolbar: Quick Audio, QR Pass & Standalone Tab */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-300/80 pb-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600">
          <span className="font-semibold uppercase tracking-wider text-[#9A3412]">
            {translateCategory(site.category)}
          </span>
          <span aria-hidden="true">·</span>
          <span>{tr.district}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono text-[11px]">{site.unescoRef}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleListenFromHotspot(0)}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#9A3412]/40 bg-[#9A3412]/8 px-3 py-1.5 text-xs font-medium text-[#9A3412] hover:bg-[#9A3412]/15 transition-colors whitespace-nowrap"
          >
            <Headphones className="h-3.5 w-3.5" />
            <span>{t('detailStartAudio')}</span>
          </button>

          {onOpenQR && (
            <button
              type="button"
              onClick={() => onOpenQR(site.id)}
              className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-[#EFEAE1] px-3 py-1.5 text-xs font-medium text-[#1C1917] hover:border-[#9A3412] hover:text-[#9A3412] transition-colors whitespace-nowrap"
            >
              <QrCode className="h-3.5 w-3.5 text-[#9A3412]" />
              <span>{t('btnQrShare')}</span>
            </button>
          )}

          <a
            href={`?site=${site.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-800 hover:border-stone-500 transition-colors whitespace-nowrap"
          >
            <span>{t('detailStandaloneTab')}</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Site Editorial Masthead */}
      <header className="mt-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-[#1C1917] [text-wrap:balance]">
              {tr.name}
            </h1>
            <p className="mt-1 font-serif text-xl italic text-stone-600">
              {site.nativeName} · {site.foundedYear}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-stone-600 font-mono tabular-nums">
            <span>Elev. {site.elevationMeters}m</span>
            <span>{site.coordinates.label}</span>
          </div>
        </div>

        <p className="mt-4 max-w-3xl text-base leading-relaxed text-stone-700">
          {tr.summary}
        </p>

        {/* Operational Utility Strip with Crisp Hairline Dividers */}
        <div className="mt-6 grid grid-cols-1 rounded-lg border border-stone-300 bg-[#EFEAE1] p-4 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-stone-300/80">
          <div className="flex items-start gap-3 pb-3 sm:pb-0 sm:pr-4">
            <Clock className="mt-0.5 h-4 w-4 text-[#9A3412] shrink-0" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-600">
                {t('detailVisitingHours')}
              </p>
              <p className="mt-0.5 text-xs font-medium text-[#1C1917]">{tr.visitingHours}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 py-3 sm:py-0 sm:px-4">
            <Ticket className="mt-0.5 h-4 w-4 text-[#9A3412] shrink-0" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-600">
                {t('detailEntryFee')}
              </p>
              <p className="mt-0.5 text-xs font-medium text-[#1C1917] tabular-nums">
                {t('detailForeign')} {site.entryFees.foreign} · {t('detailSaarc')} {site.entryFees.saarc} · {t('detailLocal')} {site.entryFees.nepali}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 pt-3 sm:pt-0 sm:pl-4">
            <Compass className="mt-0.5 h-4 w-4 text-[#9A3412] shrink-0" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-600">
                {t('detailArchEra')}
              </p>
              <p className="mt-0.5 text-xs font-medium text-[#1C1917]">{tr.era}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Primary Interactive Stage: 360-Degree Virtual Tour */}
      <section className="mt-8" aria-label="Interactive 360-degree virtual tour">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1C1917]">
              {t('detailTourHeading')}
            </h2>
            <p className="text-xs text-stone-600">
              {t('detailTourHelp')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {site.hotspots.map((hs: PanoramaHotspot) => (
              <button
                key={hs.id}
                type="button"
                onClick={() => setActiveHotspotId(hs.id)}
                className={`rounded border px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                  activeHotspotId === hs.id
                    ? 'border-[#9A3412] bg-[#9A3412] text-white'
                    : 'border-stone-300 bg-[#F8F5F0] text-stone-700 hover:border-[#9A3412]'
                }`}
              >
                {tr[`hs_title:${hs.id}`] || hs.title.split('(')[0].trim()}
              </button>
            ))}
          </div>
        </div>

        <PanoramaTourViewer
          site={site}
          activeHotspotId={activeHotspotId}
          onSelectHotspot={(hs) => setActiveHotspotId(hs?.id ?? null)}
          onListenChapter={handleListenFromHotspot}
        />

        {site.galleryImages && site.galleryImages.length > 1 && (
          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-600 mb-2">
              Curated Site Photography ({site.galleryImages.length} Images)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {site.galleryImages.map((imgUrl, idx) => (
                <div
                  key={`${site.id}-img-${idx}`}
                  className="overflow-hidden rounded-md border border-stone-300 bg-stone-200 aspect-[4/3]"
                >
                  <img
                    src={imgUrl}
                    alt={`${tr.name} photograph ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Rich Site Feature Workspace Tabs */}
      <section id={`site-features-${site.id}`} className="mt-10">
        <div className="flex flex-wrap items-center gap-2 border-b border-stone-300 pb-3">
          <button
            type="button"
            onClick={() => setFeatureTab('routes')}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              featureTab === 'routes'
                ? 'bg-[#1C1917] text-white'
                : 'text-stone-700 hover:bg-stone-200/70'
            }`}
          >
            <Navigation className="h-4 w-4" />
            <span>{t('detailTabRoutes')} ({site.routes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setFeatureTab('audio')}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              featureTab === 'audio'
                ? 'bg-[#1C1917] text-white'
                : 'text-stone-700 hover:bg-stone-200/70'
            }`}
          >
            <Headphones className="h-4 w-4" />
            <span>{t('detailTabAudio')} ({site.audioChapters.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setFeatureTab('history')}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              featureTab === 'history'
                ? 'bg-[#1C1917] text-white'
                : 'text-stone-700 hover:bg-stone-200/70'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>{t('detailTabHistory')}</span>
          </button>

          <button
            type="button"
            onClick={() => setFeatureTab('architecture')}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              featureTab === 'architecture'
                ? 'bg-[#1C1917] text-white'
                : 'text-stone-700 hover:bg-stone-200/70'
            }`}
          >
            <Landmark className="h-4 w-4" />
            <span>{t('detailTabArch')}</span>
          </button>

          <button
            type="button"
            onClick={() => setFeatureTab('companions')}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              featureTab === 'companions'
                ? 'bg-[#1C1917] text-white'
                : 'text-stone-700 hover:bg-stone-200/70'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>{t('detailTabCompanions')}</span>
          </button>

          <button
            type="button"
            onClick={() => setFeatureTab('gmail')}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              featureTab === 'gmail'
                ? 'bg-[#1C1917] text-white'
                : 'text-stone-700 hover:bg-stone-200/70'
            }`}
          >
            <Mail className="h-4 w-4" />
            <span>{t('detailTabGmail')}</span>
          </button>
        </div>

        {/* Tab 1: Routes & Directions */}
        {featureTab === 'routes' && (
          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4 space-y-3">
              <h3 className="font-serif text-2xl font-semibold text-[#1C1917]">
                {t('detailRoutesToTake')}
              </h3>
              <p className="text-xs leading-relaxed text-stone-600">
                {t('detailRoutesHelp')}
              </p>

              <div className="space-y-2 pt-2">
                {site.routes.map((route) => {
                  const active = route.mode === activeRoute.mode;
                  return (
                    <button
                      key={route.id}
                      type="button"
                      onClick={() => setSelectedRouteMode(route.mode)}
                      className={`w-full rounded-lg border p-4 text-left transition-colors ${
                        active
                          ? 'border-[#9A3412] bg-[#EFEAE1]'
                          : 'border-stone-300 bg-[#F8F5F0] hover:border-stone-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[#9A3412]">
                          {tr[`rt_mode:${route.id}`] || route.mode}
                        </span>
                        <span className="font-mono text-xs text-stone-600 tabular-nums">
                          {route.distanceKm} km · {route.durationMin} min
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-[#1C1917]">
                        {t('detailFrom')} {tr[`rt_origin:${route.id}`] || route.origin}
                      </p>
                      <p className="mt-1 text-xs text-stone-600">
                        {t('detailDifficulty')}: {tr[`rt_diff:${route.id}`] || route.difficulty} · +{route.elevationGainM}m {t('detailClimb')}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-8 rounded-lg border border-stone-300 bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-4">
                <div>
                  <p className="text-xs font-medium text-[#9A3412]">
                    {tr[`rt_mode:${activeRoute.id}`] || activeRoute.mode} · {tr[`rt_diff:${activeRoute.id}`] || activeRoute.difficulty}
                  </p>
                  <h4 className="mt-1 font-serif text-2xl font-semibold text-[#1C1917]">
                    {t('detailFrom')} {tr[`rt_origin:${activeRoute.id}`] || activeRoute.origin}
                  </h4>
                </div>
                <div className="flex items-center gap-5 font-mono text-xs text-stone-700 tabular-nums">
                  <span>{activeRoute.distanceKm} km</span>
                  <span>{activeRoute.durationMin} min</span>
                  <span>+{activeRoute.elevationGainM}m elev</span>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-stone-700">
                {tr[`rt_over:${activeRoute.id}`] || activeRoute.overview}
              </p>

              <p className="mt-3 text-xs text-stone-600">
                <span className="font-semibold text-stone-800">{t('detailRecWindow')}</span>{' '}
                {tr[`rt_win:${activeRoute.id}`] || activeRoute.bestWindow}
              </p>

              <div className="mt-6 space-y-4">
                {activeRoute.waypoints.map((wp) => (
                  <div
                    key={wp.step}
                    className="flex items-start gap-4 border-b border-stone-100 pb-4 last:border-b-0 last:pb-0"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1C1917] font-mono text-xs font-semibold text-white tabular-nums">
                      {String(wp.step).padStart(2, '0')}
                    </span>
                    <div>
                      <h5 className="text-sm font-semibold text-[#1C1917]">
                        {tr[`wp_land:${activeRoute.id}:${wp.step}`] || wp.landmark}
                      </h5>
                      <p className="mt-1 text-sm text-stone-700 leading-relaxed">
                        {tr[`wp_inst:${activeRoute.id}:${wp.step}`] || wp.instruction}
                      </p>
                      {wp.note && (
                        <p className="mt-1.5 text-xs text-[#9A3412]">
                          {t('detailFieldTip')} {tr[`wp_note:${activeRoute.id}:${wp.step}`] || wp.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Guided Audio Player */}
        {featureTab === 'audio' && (
          <div className="mt-6">
            <AudioGuidePlayer
              siteName={tr.name}
              chapters={site.audioChapters}
              activeChapterIndex={activeAudioChapter}
              onChangeChapter={setActiveAudioChapter}
              autoPlaySignal={audioPlaySignal}
            />
          </div>
        )}

        {/* Tab 3: Historical Context & Timeline */}
        {featureTab === 'history' && (
          <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="max-w-2xl space-y-5">
                {site.historicalEssay.map((para, idx) => (
                  <p
                    key={idx}
                    className={`text-[16px] leading-[1.8] text-stone-800 ${
                      idx === 0
                        ? 'first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:font-serif first-letter:text-5xl first-letter:font-bold first-letter:leading-none first-letter:text-[#9A3412]'
                        : ''
                    }`}
                  >
                    {tr[`essay:${idx}`] || para}
                  </p>
                ))}
              </div>

              <blockquote className="my-8 max-w-2xl border-y border-stone-300 py-6">
                <p className="font-serif text-2xl italic leading-snug text-[#1C1917]">
                  “{tr.quoteText}”
                </p>
                <footer className="mt-3 text-xs font-medium tracking-wide text-stone-600">
                  — {tr.quoteAttr}
                </footer>
              </blockquote>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-lg border border-stone-300 bg-[#EFEAE1] p-6">
                <h3 className="font-serif text-2xl font-semibold text-[#1C1917]">
                  {t('detailChronology')}
                </h3>
                <div className="mt-5 space-y-5">
                  {site.timeline.map((item, idx) => (
                    <div
                      key={idx}
                      className="border-b border-stone-300/80 pb-4 last:border-b-0 last:pb-0"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-semibold text-[#9A3412] tabular-nums">
                          {item.year}
                        </span>
                        <span className="text-xs text-stone-600">
                          {tr[`tl_era:${idx}`] || item.era}
                        </span>
                      </div>
                      <h4 className="mt-1 text-sm font-semibold text-[#1C1917]">
                        {tr[`tl_title:${idx}`] || item.title}
                      </h4>
                      <p className="mt-1 text-xs leading-relaxed text-stone-700">
                        {tr[`tl_detail:${idx}`] || item.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Architectural Anatomy & Visitor Etiquette */}
        {featureTab === 'architecture' && (
          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <h3 className="font-serif text-2xl font-semibold text-[#1C1917]">
                {t('detailAnatomy')}
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {site.architecturalFeatures.map((feat, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-stone-300 bg-white p-5"
                  >
                    <p className="text-xs font-medium text-[#9A3412]">
                      {String(idx + 1).padStart(2, '0')}. {tr[`arch_mat:${idx}`] || feat.material}
                    </p>
                    <h4 className="mt-1 font-serif text-xl font-semibold text-[#1C1917]">
                      {tr[`arch_name:${idx}`] || feat.name}
                    </h4>
                    <p className="mt-2 text-xs leading-relaxed text-stone-700">
                      {tr[`arch_detail:${idx}`] || feat.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-lg border border-stone-300 bg-[#EFEAE1] p-6">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#9A3412]" />
                  <h3 className="font-serif text-2xl font-semibold text-[#1C1917]">
                    {t('detailEtiquetteTitle')}
                  </h3>
                </div>

                <dl className="mt-5 divide-y divide-stone-300/80 text-xs">
                  <div className="py-3">
                    <dt className="font-semibold text-stone-900">{t('detailDress')}</dt>
                    <dd className="mt-1 leading-relaxed text-stone-700">
                      {tr.dressCode}
                    </dd>
                  </div>
                  <div className="py-3">
                    <dt className="font-semibold text-stone-900">{t('detailRitual')}</dt>
                    <dd className="mt-1 leading-relaxed text-stone-700">
                      {tr.etiquette}
                    </dd>
                  </div>
                  <div className="py-3">
                    <dt className="font-semibold text-stone-900">{t('detailPhoto')}</dt>
                    <dd className="mt-1 leading-relaxed text-stone-700">
                      {tr.photography}
                    </dd>
                  </div>
                  <div className="py-3">
                    <dt className="font-semibold text-stone-900">{t('detailFestival')}</dt>
                    <dd className="mt-1 leading-relaxed text-stone-700">
                      {tr.majorFestival}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Google Contacts Companions & Route Sharing */}
        {featureTab === 'companions' && (
          <div className="mt-6">
            <HeritageContactsPanel focusedSite={site} />
          </div>
        )}

        {/* Tab 6: Gmail Trail Dispatch & Inbox */}
        {featureTab === 'gmail' && (
          <div className="mt-6">
            <HeritageGmailPanel focusedSite={site} />
          </div>
        )}
      </section>

      {/* Share Monument: Inline Scannable QR & Social Apps */}
      <section
        aria-label={`Share ${site.name}`}
        className="mt-10 rounded-lg border border-stone-300 bg-[#EFEAE1] p-5 sm:p-6"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => onOpenQR?.(site.id)}
            title={`Enlarge QR card for ${tr.name}`}
            className="shrink-0 self-start rounded-md border-2 border-[#1C1917] bg-white p-2 shadow-sm hover:border-[#9A3412] transition-colors"
          >
            <div className="h-24 w-24">
              <HeritageQRCodeSvg
                url={buildHeritageShareUrl(site.id)}
                label={`Scannable QR code for ${site.name}`}
              />
            </div>
          </button>

          <div className="flex-1 min-w-0 space-y-2.5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9A3412]">
                {t('detailShareEyebrow')} · {tr.name}
              </p>
              <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#1C1917]">
                {t('detailShareTitle')}
              </h3>
            </div>
            <SocialShareButtons
              targetId={site.id}
              compact
              onOpenQR={onOpenQR ? (id) => onOpenQR(id) : undefined}
            />
          </div>
        </div>
      </section>

      {/* Continue Exploring Nearby Valley Sites */}
      <section className="mt-12 border-t border-stone-300 pt-8">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="font-serif text-2xl font-semibold text-[#1C1917]">
              {t('detailContinueTitle')}
            </h3>
            <p className="text-xs text-stone-600">
              {t('detailContinueDesc')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {adjacentSites.map((other) => (
            <button
              key={other.id}
              type="button"
              onClick={() => onOpenOtherSite(other.id)}
              className="group overflow-hidden rounded-lg border border-stone-300 bg-white text-left transition-colors hover:border-[#9A3412]"
            >
              <div className="relative h-40 w-full overflow-hidden bg-stone-200">
                <img
                  src={other.panoramaImage}
                  alt={tr[`adj_name:${other.id}`] || other.name}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <p className="text-[11px] text-amber-200">{translateCategory(other.category)}</p>
                  <p className="font-serif text-lg font-semibold leading-tight">
                    {tr[`adj_name:${other.id}`] || other.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-3 text-xs text-stone-700">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#9A3412]" />
                  <span>{tr[`adj_dist:${other.id}`] || other.district.split('·')[0].trim()}</span>
                </span>
                <span className="inline-flex items-center gap-1 font-medium text-[#9A3412]">
                  <Footprints className="h-3.5 w-3.5" />
                  <span>{t('btnOpenSiteTab')}</span>
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </article>
  );
};
