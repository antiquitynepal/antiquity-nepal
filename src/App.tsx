import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Compass,
  ExternalLink,
  Footprints,
  Headphones,
  Home,
  Layers,
  Mail,
  MessageSquareQuote,
  Plus,
  QrCode,
  Route,
  Search,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import {
  HERITAGE_SITES,
  HeritageCategory,
  HeritageSite,
} from './data/heritageSites';
import { PanoramaTourViewer } from './components/PanoramaTourViewer';
import { ValleyRouteMap } from './components/ValleyRouteMap';
import { TripItineraryBuilder } from './components/TripItineraryBuilder';
import { SiteDetailView, SiteFeatureTab } from './components/SiteDetailView';
import { HeritageContactsPanel } from './components/HeritageContactsPanel';
import { HeritageGmailPanel } from './components/HeritageGmailPanel';
import { AudioGuidesPage } from './components/AudioGuidesPage';
import { WorthVisitingPage } from './components/WorthVisitingPage';
import { TestimonialsPage } from './components/TestimonialsPage';
import { KathmanduWeatherWidget } from './components/KathmanduWeatherWidget';
import { LanguageSelector } from './components/LanguageSelector';
import { HeritageQRModal, QRTargetId } from './components/HeritageQRModal';
import { HeritageQRCodeSvg } from './components/HeritageQRCodeSvg';
import { SocialShareButtons } from './components/SocialShareButtons';
import { FooterNewsletterForm } from './components/FooterNewsletterForm';
import { BackToTopButton } from './components/BackToTopButton';
import { AdminSitesModal } from './components/AdminSitesModal';
import { buildHeritageShareUrl } from './utils/heritageShare';
import { useLanguage, useTranslatedTexts } from './utils/i18n';
import { useHeritageSites } from './utils/heritageSitesContext';

const CATEGORIES: ('All Sites' | HeritageCategory)[] = [
  'All Sites',
  'Royal Plaza',
  'Buddhist Stupa',
  'Hindu Sanctuary',
  'Hilltop Shrine',
];

function getInitialTabFromUrl(): { tabId: string; siteId: string | null } {
  if (typeof window === 'undefined') return { tabId: 'overview', siteId: null };
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');
  if (
    view === 'audio-guides' ||
    view === 'worth-visiting' ||
    view === 'testimonials'
  ) {
    return { tabId: view, siteId: null };
  }
  const slug = params.get('site');
  if (!slug) return { tabId: 'overview', siteId: null };
  const match = HERITAGE_SITES.find((s) => s.slug === slug || s.id === slug);
  return match
    ? { tabId: match.id, siteId: match.id }
    : { tabId: 'overview', siteId: null };
}

export default function App() {
  const { t, translateCategory } = useLanguage();
  const { sites } = useHeritageSites();
  const initialRoute = useMemo(() => getInitialTabFromUrl(), []);

  // Build translation dictionary for all live site cards & overview metadata
  const siteOverviewMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of sites) {
      map[`${s.id}:name`] = s.name;
      map[`${s.id}:summary`] = s.summary;
      map[`${s.id}:era`] = s.era;
      map[`${s.id}:district`] = s.district;
      map[`${s.id}:mode`] = s.routes[0]?.mode ?? 'Walking Trail';
      map[`${s.id}:ch0`] = s.audioChapters[0]?.title ?? '';
    }
    return map;
  }, [sites]);
  const translatedOverview = useTranslatedTexts(siteOverviewMap);
  const ts = (siteId: string, field: 'name' | 'summary' | 'era' | 'district' | 'mode' | 'ch0', fallback: string) =>
    translatedOverview[`${siteId}:${field}`] || fallback;

  // Multi-tab workspace state: 'overview', 'audio-guides', 'worth-visiting', 'testimonials', or a HeritageSite.id
  const [openSiteIds, setOpenSiteIds] = useState<string[]>(() =>
    initialRoute.siteId ? [initialRoute.siteId] : []
  );
  const [activeTabId, setActiveTabId] = useState<string>(
    () => initialRoute.tabId
  );

  // Directory filters
  const [selectedCategory, setSelectedCategory] = useState<'All Sites' | HeritageCategory>('All Sites');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Quick 360 preview site on the overview page
  const [previewSiteId, setPreviewSiteId] = useState<string>('swayambhunath');
  const [workspaceHubTab, setWorkspaceHubTab] = useState<'contacts' | 'gmail'>('contacts');
  const [qrTargetId, setQrTargetId] = useState<QRTargetId | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [siteFeatureTabs, setSiteFeatureTabs] = useState<Record<string, SiteFeatureTab>>({});

  // Shared multi-site Trip Itinerary order synchronized across Directory, Route Map, and PDF Builder
  const [itineraryIds, setItineraryIds] = useState<string[]>([
    'swayambhunath',
    'kathmandu-durbar-square',
    'pashupatinath',
    'boudhanath',
  ]);

  const toggleItinerarySite = (siteId: string) => {
    setItineraryIds((prev) =>
      prev.includes(siteId)
        ? prev.filter((id) => id !== siteId)
        : [...prev, siteId]
    );
  };

  // Sync URL query parameter (?site=... or ?view=...) cleanly without reloads
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const brand = t('brandTitle');
    if (activeTabId === 'overview') {
      url.searchParams.delete('site');
      url.searchParams.delete('view');
      document.title = `${brand} — 360°`;
    } else if (activeTabId === 'audio-guides') {
      url.searchParams.delete('site');
      url.searchParams.set('view', 'audio-guides');
      document.title = `${t('navMajorAudioGuides')} — ${brand}`;
    } else if (activeTabId === 'worth-visiting') {
      url.searchParams.delete('site');
      url.searchParams.set('view', 'worth-visiting');
      document.title = `${t('navMajorOtherSites')} — ${brand}`;
    } else if (activeTabId === 'testimonials') {
      url.searchParams.delete('site');
      url.searchParams.set('view', 'testimonials');
      document.title = `${t('navMajorTestimonials')} — ${brand}`;
    } else {
      const site = sites.find((s) => s.id === activeTabId);
      if (site) {
        url.searchParams.delete('view');
        url.searchParams.set('site', site.slug);
        document.title = `${ts(site.id, 'name', site.name)} — ${brand}`;
      }
    }
    window.history.replaceState({}, '', url.toString());
  }, [activeTabId, sites, t, translatedOverview]);

  const openSiteTab = (siteId: string) => {
    setOpenSiteIds((prev) => (prev.includes(siteId) ? prev : [...prev, siteId]));
    setActiveTabId(siteId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeSiteTab = (siteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenSiteIds((prev) => {
      const remaining = prev.filter((id) => id !== siteId);
      if (activeTabId === siteId) {
        setActiveTabId(remaining.length > 0 ? remaining[remaining.length - 1] : 'overview');
      }
      return remaining;
    });
  };

  const scrollToSection = (sectionId: string) => {
    if (activeTabId !== 'overview') {
      setActiveTabId('overview');
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const filteredSites = useMemo(() => {
    return sites.filter((site) => {
      const matchesCat =
        selectedCategory === 'All Sites' || site.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        site.name.toLowerCase().includes(q) ||
        site.district.toLowerCase().includes(q) ||
        site.summary.toLowerCase().includes(q) ||
        site.era.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [sites, selectedCategory, searchQuery]);

  const isSpecialView =
    activeTabId === 'audio-guides' ||
    activeTabId === 'worth-visiting' ||
    activeTabId === 'testimonials';

  const activeSite: HeritageSite | null =
    activeTabId === 'overview' || isSpecialView
      ? null
      : sites.find((s) => s.id === activeTabId) ?? null;

  const previewSite: HeritageSite | undefined =
    sites.find((s) => s.id === previewSiteId) ?? sites[1] ?? sites[0];

  const adjacentSites = useMemo(() => {
    if (!activeSite) return [];
    return sites.filter((s) => s.id !== activeSite.id).slice(0, 3);
  }, [activeSite, sites]);

  return (
    <div className="min-h-screen bg-[#F8F5F0] text-[#1C1917] flex flex-col">
      {/* Header: Headline + Language Switcher (left), Nav Links (center), Large Crisp Brand Logo (right) */}
      <header className="relative z-40 border-b border-stone-300/90 bg-[#F8F5F0] print:hidden">
        <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-4 lg:gap-6 px-4 sm:px-6 py-3">
          {/* Left Column: Bigger & Bolder Headline + Language Change Bar Directly Below */}
          <div className="flex flex-col items-start gap-2 min-w-0 flex-1 xl:flex-initial">
            <button
              type="button"
              onClick={() => setActiveTabId('overview')}
              className="font-serif text-xl sm:text-[1.7rem] lg:text-[1.95rem] font-bold tracking-tight text-[#1C1917] leading-tight text-left hover:text-[#9A3412] transition-colors"
            >
              {t('brandTitle')}
            </button>
            <LanguageSelector align="left" />
          </div>

          {/* Center Nav Links */}
          <nav
            aria-label="Primary navigation"
            className="hidden xl:flex items-center gap-5 text-sm font-medium text-stone-700"
          >
            <button
              type="button"
              onClick={() => scrollToSection('sites-directory')}
              className="hover:text-[#9A3412] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              {t('navHeritageSites')}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('virtual-tour-stage')}
              className="hover:text-[#9A3412] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              {t('navTours360')}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('valley-routes')}
              className="hover:text-[#9A3412] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              {t('navValleyRoutes')}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('travel-companions')}
              className="hover:text-[#9A3412] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              {t('navCompanionsMail')}
            </button>
          </nav>

          {/* Right Side End: Large Crisp Un-Stretched Kathmandu Heritage Atlas Logo */}
          <button
            type="button"
            onClick={() => setActiveTabId('overview')}
            title={t('brandTitle')}
            className="shrink-0 overflow-hidden rounded-lg border border-stone-400/80 bg-[#22292A] shadow-sm hover:border-[#9A3412] transition-colors"
          >
            <img
              src="/assets/aistudio/6e112a5a-e7c6-4593-b7d8-3cb913521721_11255886.webp"
              alt="Kathmandu Heritage Atlas Logo"
              referrerPolicy="no-referrer"
              className="block h-20 w-20 sm:h-24 sm:w-24 lg:h-[108px] lg:w-[108px] aspect-square object-contain"
            />
          </button>
        </div>

        {/* Clean Horizontal Sub-Category Strip & Workspace Tabs */}
        <div className="border-t border-stone-200 bg-[#EFEAE1]">
          <div className="mx-auto flex max-w-[1360px] flex-col gap-2 lg:flex-row lg:items-center lg:justify-between px-4 sm:px-6 py-2">
            <div className="flex items-center gap-1 overflow-x-auto min-w-0">
              <button
                type="button"
                onClick={() => setActiveTabId('overview')}
                className={`inline-flex items-center gap-2 rounded px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  activeTabId === 'overview'
                    ? 'bg-[#F8F5F0] text-[#1C1917] border border-stone-300'
                    : 'text-stone-600 hover:text-[#1C1917]'
                }`}
              >
                <Layers className="h-3.5 w-3.5 text-[#9A3412]" />
                <span>{t('tabDirectory')}</span>
              </button>

              {openSiteIds.map((id) => {
                const site = sites.find((s) => s.id === id);
                if (!site) return null;
                const isActive = activeTabId === site.id;
                const displayName = ts(site.id, 'name', site.name);
                return (
                  <div
                    key={site.id}
                    onClick={() => setActiveTabId(site.id)}
                    role="tab"
                    aria-selected={isActive}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveTabId(site.id);
                      }
                    }}
                    className={`group inline-flex cursor-pointer items-center gap-2 rounded px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-[#F8F5F0] text-[#9A3412] border border-[#9A3412]/40'
                        : 'text-stone-700 hover:bg-[#F8F5F0]/60'
                    }`}
                  >
                    <Compass className="h-3.5 w-3.5 shrink-0" />
                    <span>{displayName}</span>
                    <button
                      type="button"
                      onClick={(e) => closeSiteTab(site.id, e)}
                      aria-label={`Close ${site.name} tab`}
                      className="rounded p-0.5 text-stone-400 hover:bg-stone-200 hover:text-stone-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Clean Horizontal Sub-Category of Three Dedicated Pages (Opens in New Page) */}
            <nav
              aria-label="Dedicated Heritage Sections"
              className="flex items-center gap-4 sm:gap-5 overflow-x-auto border-t border-stone-300/70 pt-1.5 lg:border-t-0 lg:pt-0 text-xs font-medium shrink-0"
            >
              <a
                href="?view=audio-guides"
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap shrink-0 hover:text-[#9A3412] hover:underline underline-offset-4 ${
                  activeTabId === 'audio-guides'
                    ? 'font-semibold text-[#9A3412] underline underline-offset-4'
                    : 'text-stone-700'
                }`}
              >
                <Headphones className="h-3.5 w-3.5 text-[#9A3412] shrink-0" />
                <span>{t('navMajorAudioGuides')}</span>
                <ExternalLink className="h-3 w-3 text-stone-400 shrink-0" />
              </a>

              <span aria-hidden="true" className="text-stone-300 shrink-0">|</span>

              <a
                href="?view=worth-visiting"
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap shrink-0 hover:text-[#9A3412] hover:underline underline-offset-4 ${
                  activeTabId === 'worth-visiting'
                    ? 'font-semibold text-[#9A3412] underline underline-offset-4'
                    : 'text-stone-700'
                }`}
              >
                <Compass className="h-3.5 w-3.5 text-[#9A3412] shrink-0" />
                <span>{t('navMajorOtherSites')}</span>
                <ExternalLink className="h-3 w-3 text-stone-400 shrink-0" />
              </a>

              <span aria-hidden="true" className="text-stone-300 shrink-0">|</span>

              <a
                href="?view=testimonials"
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 py-1 transition-colors whitespace-nowrap shrink-0 hover:text-[#9A3412] hover:underline underline-offset-4 ${
                  activeTabId === 'testimonials'
                    ? 'font-semibold text-[#9A3412] underline underline-offset-4'
                    : 'text-stone-700'
                }`}
              >
                <MessageSquareQuote className="h-3.5 w-3.5 text-[#9A3412] shrink-0" />
                <span>{t('navMajorTestimonials')}</span>
                <ExternalLink className="h-3 w-3 text-stone-400 shrink-0" />
              </a>

              <span aria-hidden="true" className="text-stone-300 shrink-0">|</span>

              <button
                type="button"
                onClick={() => setIsAdminModalOpen(true)}
                aria-label="Open Heritage Sites Administrator Console"
                className="inline-flex items-center gap-1.5 rounded border border-stone-300 bg-[#F8F5F0] px-2.5 py-1 text-xs font-semibold text-[#1C1917] hover:border-[#9A3412] hover:text-[#9A3412] transition-colors whitespace-nowrap shrink-0"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-[#9A3412] shrink-0" />
                <span>{t('adminBtn')}</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content: Breadcrumb Bar + Utility Box + Dedicated Page Views, Active Site Tab, OR Directory Overview */}
      <main className="flex-1">
        {/* Persistent Breadcrumb Navigation Bar Below Main Header */}
        <nav
          aria-label="Breadcrumb"
          className="border-b border-stone-200/90 bg-[#F4EFE6] print:hidden"
        >
          <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-4 px-4 sm:px-6 py-2 text-xs">
            <ol className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap min-w-0">
              <li className="inline-flex items-center shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTabId('overview');
                    setSelectedCategory('All Sites');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-1.5 font-medium text-stone-700 hover:text-[#9A3412] hover:underline underline-offset-4 transition-colors"
                >
                  <Home className="h-3.5 w-3.5 text-[#9A3412] shrink-0" />
                  <span>{t('breadcrumbHome')}</span>
                </button>
              </li>

              <li aria-hidden="true" className="text-stone-400 shrink-0">
                <ChevronRight className="h-3.5 w-3.5" />
              </li>

              {activeTabId === 'overview' ? (
                selectedCategory === 'All Sites' ? (
                  <li className="inline-flex items-center shrink-0">
                    <span
                      aria-current="page"
                      className="font-semibold text-[#1C1917]"
                    >
                      {t('breadcrumbDirectory')}
                    </span>
                  </li>
                ) : (
                  <>
                    <li className="inline-flex items-center shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory('All Sites');
                          scrollToSection('sites-directory');
                        }}
                        className="font-medium text-stone-700 hover:text-[#9A3412] hover:underline underline-offset-4 transition-colors"
                      >
                        {t('breadcrumbDirectory')}
                      </button>
                    </li>
                    <li aria-hidden="true" className="text-stone-400 shrink-0">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </li>
                    <li className="inline-flex items-center shrink-0">
                      <span
                        aria-current="page"
                        className="font-semibold text-[#1C1917]"
                      >
                        {translateCategory(selectedCategory)}
                      </span>
                    </li>
                  </>
                )
              ) : activeSite ? (
                <>
                  <li className="inline-flex items-center shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('All Sites');
                        scrollToSection('sites-directory');
                      }}
                      className="font-medium text-stone-700 hover:text-[#9A3412] hover:underline underline-offset-4 transition-colors"
                    >
                      {t('breadcrumbDirectory')}
                    </button>
                  </li>
                  <li aria-hidden="true" className="text-stone-400 shrink-0">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </li>
                  <li className="inline-flex items-center shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory(activeSite.category);
                        scrollToSection('sites-directory');
                      }}
                      className="font-medium text-stone-700 hover:text-[#9A3412] hover:underline underline-offset-4 transition-colors"
                    >
                      {translateCategory(activeSite.category)}
                    </button>
                  </li>
                  <li aria-hidden="true" className="text-stone-400 shrink-0">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </li>
                  <li className="inline-flex items-center shrink-0">
                    <button
                      type="button"
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="font-medium text-stone-700 hover:text-[#9A3412] hover:underline underline-offset-4 transition-colors"
                    >
                      {ts(activeSite.id, 'name', activeSite.name)}
                    </button>
                  </li>
                  <li aria-hidden="true" className="text-stone-400 shrink-0">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </li>
                  <li className="inline-flex items-center shrink-0">
                    <span
                      aria-current="page"
                      className="font-semibold text-[#9A3412]"
                    >
                      {(() => {
                        const tab = siteFeatureTabs[activeSite.id] ?? 'routes';
                        if (tab === 'audio') return t('detailTabAudio');
                        if (tab === 'history') return t('detailTabHistory');
                        if (tab === 'architecture') return t('detailTabArch');
                        if (tab === 'companions') return t('detailTabCompanions');
                        if (tab === 'gmail') return t('detailTabGmail');
                        return t('detailTabRoutes');
                      })()}
                    </span>
                  </li>
                </>
              ) : (
                <>
                  <li className="inline-flex items-center shrink-0">
                    <button
                      type="button"
                      onClick={() => scrollToSection('sites-directory')}
                      className="font-medium text-stone-700 hover:text-[#9A3412] hover:underline underline-offset-4 transition-colors"
                    >
                      {t('breadcrumbDirectory')}
                    </button>
                  </li>
                  <li aria-hidden="true" className="text-stone-400 shrink-0">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </li>
                  <li className="inline-flex items-center shrink-0">
                    <span
                      aria-current="page"
                      className="font-semibold text-[#1C1917]"
                    >
                      {activeTabId === 'audio-guides'
                        ? t('navMajorAudioGuides')
                        : activeTabId === 'worth-visiting'
                          ? t('navMajorOtherSites')
                          : t('navMajorTestimonials')}
                    </span>
                  </li>
                </>
              )}
            </ol>

            <div className="hidden md:flex items-center gap-3 shrink-0">
              {activeTabId !== 'overview' ? (
                <button
                  type="button"
                  onClick={() => scrollToSection('sites-directory')}
                  className="inline-flex items-center gap-1.5 font-medium text-[#9A3412] hover:underline underline-offset-4 transition-colors whitespace-nowrap"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>{t('detailBack')}</span>
                </button>
              ) : openSiteIds.length > 0 ? (
                (() => {
                  const lastSite = sites.find(
                    (s) => s.id === openSiteIds[openSiteIds.length - 1]
                  );
                  if (!lastSite) return null;
                  return (
                    <button
                      type="button"
                      onClick={() => openSiteTab(lastSite.id)}
                      className="inline-flex items-center gap-1.5 font-medium text-[#9A3412] hover:underline underline-offset-4 transition-colors whitespace-nowrap"
                    >
                      <span>
                        {t('breadcrumbSiteDetails')}:{' '}
                        {ts(lastSite.id, 'name', lastSite.name)}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  );
                })()
              ) : null}
            </div>
          </div>
        </nav>

        {/* Pull-Down Plan Heritage Trail & Live Kathmandu Weather Box */}
        <div className="mx-auto w-full max-w-[1360px] px-4 sm:px-6 pt-4 print:hidden">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-stone-300 bg-[#EFEAE1] px-4 py-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9A3412]">
                {t('weatherSubTitle')}
              </p>
              <p className="mt-0.5 font-serif text-base sm:text-lg font-semibold text-[#1C1917]">
                {t('weatherTitle')} · {t('weatherWalkPlanning')}
              </p>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => scrollToSection('valley-routes')}
                className="rounded-md bg-[#9A3412] px-4 py-2 text-xs font-semibold text-white hover:bg-[#7C2D12] transition-colors whitespace-nowrap shrink-0"
              >
                {t('ctaPlanTrail')}
              </button>
              <KathmanduWeatherWidget />
            </div>
          </div>
        </div>

        {activeTabId === 'audio-guides' ? (
          <AudioGuidesPage
            onBackToOverview={() => setActiveTabId('overview')}
            onOpenSiteTab={openSiteTab}
          />
        ) : activeTabId === 'worth-visiting' ? (
          <WorthVisitingPage
            onBackToOverview={() => setActiveTabId('overview')}
          />
        ) : activeTabId === 'testimonials' ? (
          <TestimonialsPage
            onBackToOverview={() => setActiveTabId('overview')}
            onOpenSiteTab={openSiteTab}
          />
        ) : activeSite ? (
          <SiteDetailView
            site={activeSite}
            onBackToAtlas={() => setActiveTabId('overview')}
            onOpenOtherSite={openSiteTab}
            onOpenQR={(siteId) => setQrTargetId(siteId)}
            adjacentSites={adjacentSites}
            activeFeatureTab={siteFeatureTabs[activeSite.id] ?? 'routes'}
            onFeatureTabChange={(tab) =>
              setSiteFeatureTabs((prev) => ({
                ...prev,
                [activeSite.id]: tab,
              }))
            }
          />
        ) : (
          <div>
            {/* Editorial Hero Split (2-column balanced height) */}
            <section id="overview-hero" className="mx-auto max-w-[1360px] px-4 sm:px-6 pt-6 pb-8 print:hidden">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-stretch">
                <div className="lg:col-span-5 flex flex-col justify-between py-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-[#9A3412]">
                      {t('heroEyebrow')}
                    </p>
                    <h1 className="mt-3 font-serif text-4xl sm:text-5xl lg:text-[3.75rem] font-bold leading-[1.06] tracking-tight text-[#1C1917] [text-wrap:balance]">
                      {t('heroHeadline')}
                    </h1>
                    <p className="mt-4 max-w-lg text-[15px] sm:text-base leading-relaxed text-stone-700">
                      {t('heroDescription')}
                    </p>
                  </div>

                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => scrollToSection('sites-directory')}
                      className="inline-flex items-center gap-2 rounded-md bg-[#9A3412] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#7C2D12] transition-colors whitespace-nowrap"
                    >
                      <span>{t('btnBrowseSites')}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollToSection('virtual-tour-stage')}
                      className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-[#1C1917] hover:border-[#9A3412] hover:text-[#9A3412] transition-colors whitespace-nowrap"
                    >
                      <Compass className="h-4 w-4 text-[#9A3412]" />
                      <span>{t('btnLaunchPreview')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrTargetId('atlas')}
                      className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-[#EFEAE1] px-4 py-2.5 text-sm font-medium text-[#1C1917] hover:border-[#9A3412] hover:text-[#9A3412] transition-colors whitespace-nowrap"
                    >
                      <QrCode className="h-4 w-4 text-[#9A3412]" />
                      <span>{t('btnQrShare')}</span>
                    </button>
                  </div>
                </div>

                {/* Right Column: Featured Architectural Panorama */}
                {sites[0] && (
                <div className="lg:col-span-7">
                  <div className="relative h-full min-h-[340px] lg:min-h-[410px] overflow-hidden rounded-lg border border-stone-300 bg-stone-900 shadow-xs">
                    <img
                      src={sites[0].panoramaImage}
                      alt={ts(sites[0].id, 'name', sites[0].name)}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover contrast-[1.03] saturate-[1.05]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-end justify-between gap-4 text-white">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-200">
                          {t('featuredBadge')} · {sites[0].foundedYear}
                        </p>
                        <h2 className="mt-0.5 font-serif text-2xl sm:text-3xl font-semibold text-white">
                          {ts(sites[0].id, 'name', sites[0].name)}
                        </h2>
                        <p className="mt-1 text-xs text-stone-200 max-w-md">
                          {t('featuredSub')}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openSiteTab(sites[0].id)}
                        className="rounded-md bg-white px-4 py-2 text-xs font-semibold text-[#1C1917] hover:bg-amber-50 transition-colors whitespace-nowrap shrink-0"
                      >
                        {t('btnOpenSiteTab')} →
                      </button>
                    </div>
                  </div>
                </div>
                )}
              </div>

              {/* Full-Width 4-Column Valley Summary Strip with Crisp Hairline Dividers */}
              <div className="mt-7 grid grid-cols-2 rounded-lg border border-stone-300 bg-[#EFEAE1] sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-300/80">
                <div className="p-4 sm:px-5">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-stone-600">{t('statZones')}</p>
                  <p className="mt-1 font-mono text-2xl font-semibold text-[#9A3412] tabular-nums">
                    {sites.length === 7 ? t('statZonesVal') : `${String(sites.length).padStart(2, '0')} Sites`}
                  </p>
                </div>
                <div className="p-4 sm:px-5">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-stone-600">{t('statViews')}</p>
                  <p className="mt-1 font-mono text-2xl font-semibold text-[#1C1917] tabular-nums">
                    {t('statViewsVal')}
                  </p>
                </div>
                <div className="p-4 sm:px-5">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-stone-600">{t('statRoutes')}</p>
                  <p className="mt-1 font-mono text-2xl font-semibold text-[#1C1917] tabular-nums">
                    {t('statRoutesVal')}
                  </p>
                </div>
                <div className="p-4 sm:px-5">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-stone-600">{t('statAudio')}</p>
                  <p className="mt-1 font-mono text-2xl font-semibold text-[#9A3412] tabular-nums">
                    {t('statAudioVal')}
                  </p>
                </div>
              </div>
            </section>

            {/* Section 1: Heritage Sites Directory */}
            <section
              id="sites-directory"
              className="mx-auto max-w-[1360px] px-4 sm:px-6 py-10 border-t border-stone-300/80 print:hidden"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9A3412]">
                    {t('dirEyebrow')}
                  </p>
                  <h2 className="mt-1 font-serif text-3xl sm:text-4xl font-semibold text-[#1C1917]">
                    {t('dirTitle')}
                  </h2>
                  <p className="mt-1 max-w-xl text-sm text-stone-600">
                    {t('dirDescription')}
                  </p>
                </div>

                {/* Search Box */}
                <div className="relative w-full lg:w-72 shrink-0">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('dirFilterPlaceholder')}
                    aria-label="Filter heritage sites"
                    className="w-full rounded-md border border-stone-300 bg-white py-2 pl-9 pr-3 text-sm text-[#1C1917] placeholder:text-stone-400"
                  />
                </div>
              </div>

              {/* Category Filter Tabs + Itinerary Quick Status */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-stone-300/80 pb-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  {CATEGORIES.map((cat) => {
                    const active = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                          active
                            ? 'bg-[#1C1917] text-white'
                            : 'bg-[#EFEAE1] text-stone-700 hover:bg-stone-200'
                        }`}
                      >
                        {translateCategory(cat)}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => scrollToSection('trip-itinerary-builder')}
                  className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-[#EFEAE1] px-3 py-1.5 text-xs font-medium text-[#1C1917] hover:border-[#9A3412] hover:text-[#9A3412] transition-colors whitespace-nowrap shrink-0"
                >
                  <Route className="h-3.5 w-3.5 text-[#9A3412]" />
                  <span>
                    {t('dirTripStatus')} ({itineraryIds.length}{' '}
                    {itineraryIds.length === 1 ? t('dirStopSingular') : t('dirStopPlural')}) · {t('dirBuilderLink')}
                  </span>
                </button>
              </div>

              {/* Site Grid */}
              {filteredSites.length === 0 ? (
                <div className="mt-8 rounded-lg border border-stone-300 bg-[#EFEAE1] p-10 text-center">
                  <p className="font-serif text-2xl font-semibold text-[#1C1917]">
                    {t('dirNoMatchTitle')}
                  </p>
                  <p className="mt-1 text-sm text-stone-600">
                    {t('dirNoMatchDesc')}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('All Sites');
                      setSearchQuery('');
                    }}
                    className="mt-4 rounded-md bg-[#9A3412] px-4 py-2 text-xs font-medium text-white"
                  >
                    {t('dirResetFilters')}
                  </button>
                </div>
              ) : (
                <div className="mt-7 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredSites.map((site) => {
                    const primaryWalk = site.routes[0];
                    const tripIndex = itineraryIds.indexOf(site.id);
                    const inTrip = tripIndex !== -1;
                    const siteName = ts(site.id, 'name', site.name);
                    const siteSummary = ts(site.id, 'summary', site.summary);
                    const siteDistrict = ts(site.id, 'district', site.district).split('·')[0].trim();
                    const primaryMode = ts(site.id, 'mode', primaryWalk.mode);
                    return (
                      <div
                        key={site.id}
                        className="group flex flex-col justify-between overflow-hidden rounded-lg border border-stone-300 bg-white transition-colors hover:border-[#9A3412]"
                      >
                        <div>
                          {/* Clickable Image Area */}
                          <button
                            type="button"
                            onClick={() => openSiteTab(site.id)}
                            className="relative block h-48 w-full overflow-hidden bg-stone-200 text-left"
                          >
                            <img
                              src={site.panoramaImage}
                              alt={siteName}
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover contrast-[1.03] saturate-[1.04] transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                            <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2 text-white">
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-200">
                                {t('cardTourBadge')}
                              </span>
                              <span className="font-mono text-[11px] text-stone-200 tabular-nums">
                                {site.elevationMeters}m
                              </span>
                            </div>
                          </button>

                          {/* Clean Concise Card Body */}
                          <div className="p-5">
                            <div className="flex items-center gap-2 text-xs text-stone-500">
                              <span className="font-semibold text-[#9A3412]">
                                {translateCategory(site.category)}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="truncate">{siteDistrict}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => openSiteTab(site.id)}
                              className="mt-1 block w-full text-left"
                            >
                              <h3 className="font-serif text-[1.45rem] font-semibold leading-snug text-[#1C1917] group-hover:text-[#9A3412] transition-colors truncate">
                                {siteName}
                              </h3>
                            </button>
                            <p className="mt-0.5 text-xs text-stone-500 truncate">
                              {site.nativeName} · {site.foundedYear}
                            </p>

                            <p className="mt-2.5 text-sm leading-relaxed text-stone-700 line-clamp-2">
                              {siteSummary}
                            </p>

                            <div className="mt-3.5 space-y-1 border-t border-stone-200/80 pt-3 text-xs text-stone-600">
                              <p className="flex items-center gap-2">
                                <Footprints className="h-3.5 w-3.5 text-[#9A3412] shrink-0" />
                                <span className="truncate">
                                  {primaryMode} · {primaryWalk.distanceKm} km ({primaryWalk.durationMin} min)
                                </span>
                              </p>
                              <p className="flex items-center gap-2">
                                <Headphones className="h-3.5 w-3.5 text-[#9A3412] shrink-0" />
                                <span className="truncate">
                                  {t('cardAudioHotspots', {
                                    chapters: site.audioChapters.length,
                                    hotspots: site.hotspots.length,
                                  })}
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Aligned Single-Row Card Footer */}
                        <div className="flex flex-nowrap items-center justify-between gap-2 border-t border-stone-200 bg-[#F8F5F0] px-5 py-2.5">
                          <button
                            type="button"
                            onClick={() => openSiteTab(site.id)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9A3412] hover:text-[#7C2D12] whitespace-nowrap shrink-0"
                          >
                            <span>{t('cardExploreTab')}</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => toggleItinerarySite(site.id)}
                              title={
                                inTrip
                                  ? `Remove ${siteName} from trip itinerary`
                                  : `Add ${siteName} to trip itinerary`
                              }
                              className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                                inTrip
                                  ? 'bg-[#9A3412] text-white hover:bg-[#7C2D12]'
                                  : 'border border-stone-300 bg-white text-stone-700 hover:border-[#9A3412] hover:text-[#9A3412]'
                              }`}
                            >
                              {inTrip ? (
                                <>
                                  <Check className="h-3 w-3" />
                                  <span>{t('cardStopPrefix')} #{tripIndex + 1}</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="h-3 w-3" />
                                  <span>{t('cardAddTrip')}</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => setQrTargetId(site.id)}
                              title={`Generate QR code and share ${siteName}`}
                              className="inline-flex items-center gap-1 rounded border border-transparent px-1.5 py-1 text-xs font-medium text-stone-600 hover:border-stone-300 hover:bg-white hover:text-[#9A3412] transition-colors whitespace-nowrap"
                            >
                              <QrCode className="h-3.5 w-3.5" />
                              <span>{t('cardQrShare')}</span>
                            </button>

                            <a
                              href={`?site=${site.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`Open ${siteName} in a new tab`}
                              className="inline-flex items-center gap-1 rounded border border-transparent px-1.5 py-1 text-xs font-medium text-stone-600 hover:border-stone-300 hover:bg-white hover:text-[#1C1917] transition-colors whitespace-nowrap"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Section 2: Interactive 360° Virtual Tour Stage */}
            {previewSite && (
            <section
              id="virtual-tour-stage"
              className="border-t border-stone-300/80 bg-[#EFEAE1] py-10 print:hidden"
            >
              <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-6">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9A3412]">
                      {t('stageEyebrow')}
                    </p>
                    <h2 className="mt-1 font-serif text-3xl sm:text-4xl font-semibold text-[#1C1917]">
                      {t('stageTitle')}
                    </h2>
                    <p className="mt-1 text-sm text-stone-600 max-w-xl">
                      {t('stageDescription')}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => openSiteTab(previewSite.id)}
                    className="inline-flex items-center gap-2 rounded-md bg-[#1C1917] px-4 py-2.5 text-xs font-medium text-white hover:bg-[#9A3412] transition-colors whitespace-nowrap shrink-0 self-start lg:self-auto"
                  >
                    <span>
                      {t('stageOpenBtn', {
                        site: ts(previewSite.id, 'name', previewSite.name),
                      })}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Site Selector Bar */}
                <div className="mb-4 flex items-center gap-1.5 overflow-x-auto pb-1">
                  {sites.map((s) => {
                    const active = s.id === previewSite.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setPreviewSiteId(s.id)}
                        className={`rounded-md px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                          active
                            ? 'bg-[#9A3412] text-white'
                            : 'border border-stone-300 bg-[#F8F5F0] text-stone-700 hover:border-stone-500'
                        }`}
                      >
                        {ts(s.id, 'name', s.name)}
                      </button>
                    );
                  })}
                </div>

                <PanoramaTourViewer
                  site={previewSite}
                  onListenChapter={() => openSiteTab(previewSite.id)}
                />
              </div>
            </section>
            )}

            {/* Section 3: Kathmandu Valley Route Map & Trail Planner */}
            <section
              id="valley-routes"
              className="mx-auto max-w-[1360px] px-4 sm:px-6 py-10 border-t border-stone-300/80"
            >
              <div className="mb-7 print:hidden">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9A3412]">
                  {t('routesEyebrow')}
                </p>
                <h2 className="mt-1 font-serif text-3xl sm:text-4xl font-semibold text-[#1C1917]">
                  {t('routesTitle')}
                </h2>
                <p className="mt-1 max-w-xl text-sm text-stone-600">
                  {t('routesDescription')}
                </p>
              </div>

              <div className="print:hidden">
                <ValleyRouteMap
                  onOpenSiteTab={openSiteTab}
                  itineraryIds={itineraryIds}
                  onChangeItineraryIds={setItineraryIds}
                />
              </div>

              <TripItineraryBuilder
                itineraryIds={itineraryIds}
                onChangeItineraryIds={setItineraryIds}
                onOpenSiteTab={openSiteTab}
              />
            </section>

            {/* Section 4: Travel Companions & Gmail Dispatch */}
            <section
              id="travel-companions"
              className="border-t border-stone-300/80 bg-[#EFEAE1] py-10 print:hidden"
            >
              <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9A3412]">
                      {t('compEyebrow')}
                    </p>
                    <h2 className="mt-1 font-serif text-3xl sm:text-4xl font-semibold text-[#1C1917]">
                      {t('compTitle')}
                    </h2>
                    <p className="mt-1 max-w-xl text-sm text-stone-600">
                      {t('compDesc')}
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-[#F8F5F0] p-1 self-start lg:self-auto">
                    <button
                      type="button"
                      onClick={() => setWorkspaceHubTab('contacts')}
                      className={`inline-flex items-center gap-2 rounded px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                        workspaceHubTab === 'contacts'
                          ? 'bg-[#1C1917] text-white'
                          : 'text-stone-700 hover:bg-stone-200/70'
                      }`}
                    >
                      <Users className="h-3.5 w-3.5" />
                      <span>{t('compTabContacts')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWorkspaceHubTab('gmail')}
                      className={`inline-flex items-center gap-2 rounded px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                        workspaceHubTab === 'gmail'
                          ? 'bg-[#1C1917] text-white'
                          : 'text-stone-700 hover:bg-stone-200/70'
                      }`}
                    >
                      <Mail className="h-3.5 w-3.5" />
                      <span>{t('compTabGmail')}</span>
                    </button>
                  </div>
                </div>

                {workspaceHubTab === 'contacts' ? (
                  <HeritageContactsPanel />
                ) : (
                  <HeritageGmailPanel />
                )}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Quiet Editorial Footer with Instant QR & Social Share Bar */}
      <footer className="border-t border-stone-300 bg-[#F8F5F0] py-8 print:hidden">
        <div className="mx-auto max-w-[1360px] px-4 sm:px-6 space-y-6">
          {/* Scannable QR & Social App Share Strip */}
          <div className="flex flex-col gap-4 rounded-lg border border-stone-300 bg-[#EFEAE1] p-4 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => setQrTargetId(activeSite ? activeSite.id : 'atlas')}
              title="Open full downloadable Heritage QR Pass"
              className="shrink-0 self-start rounded-md border-2 border-[#1C1917] bg-white p-1.5 shadow-xs hover:border-[#9A3412] transition-colors"
            >
              <div className="h-20 w-20">
                <HeritageQRCodeSvg
                  url={buildHeritageShareUrl(activeSite ? activeSite.id : 'atlas')}
                  label="Scan QR code to open Suraj Giri's Kathmandu Heritage Atlas"
                />
              </div>
            </button>

            <div className="flex-1 min-w-0 space-y-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9A3412]">
                  {t('footerShareEyebrow')}
                </p>
                <p className="font-serif text-lg sm:text-xl font-semibold text-[#1C1917]">
                  {t('footerShareTitle', {
                    target: activeSite
                      ? ts(activeSite.id, 'name', activeSite.name)
                      : t('brandTitle'),
                  })}
                </p>
              </div>
              <SocialShareButtons
                targetId={activeSite ? activeSite.id : 'atlas'}
                compact
                onOpenQR={(id) => setQrTargetId(id)}
              />
            </div>
          </div>

          {/* Heritage Updates Newsletter Subscription Bar */}
          <FooterNewsletterForm />

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-stone-200 pt-5 text-xs text-stone-600">
            <div className="flex items-center gap-4">
              <img
                src="/assets/aistudio/6e112a5a-e7c6-4593-b7d8-3cb913521721_11255886.webp"
                alt="Kathmandu Heritage Atlas Logo"
                referrerPolicy="no-referrer"
                className="h-16 w-16 sm:h-20 sm:w-20 aspect-square rounded-md object-contain bg-[#22292A] border border-stone-300 shrink-0 shadow-xs"
              />
              <div>
                <p className="font-serif text-base font-semibold text-[#1C1917]">
                  {t('brandTitle')}
                </p>
                <p className="mt-0.5 font-medium text-stone-800">
                  {t('footerManagedBy')}
                </p>
                <p className="mt-1">
                  {t('footerTagline')}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-5">
              {sites.slice(0, 4).map((site) => (
                <button
                  key={site.id}
                  type="button"
                  onClick={() => openSiteTab(site.id)}
                  className="hover:text-[#9A3412] transition-colors whitespace-nowrap"
                >
                  {ts(site.id, 'name', site.name).replace(' Square', '')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <HeritageQRModal
        isOpen={qrTargetId !== null}
        initialTargetId={qrTargetId ?? 'atlas'}
        onClose={() => setQrTargetId(null)}
      />

      <AdminSitesModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSiteRemoved={(removedId) => {
          setOpenSiteIds((prev) => prev.filter((id) => id !== removedId));
          setItineraryIds((prev) => prev.filter((id) => id !== removedId));
          if (activeTabId === removedId) {
            setActiveTabId('overview');
          }
        }}
      />

      <BackToTopButton watchKey={activeTabId} />
    </div>
  );
}
