import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Clock,
  Compass,
  ExternalLink,
  Footprints,
  MapPin,
  Plus,
  RotateCcw,
  Route as RouteIcon,
} from 'lucide-react';
import { HeritageSite, TRAIL_CORRIDORS, TrailCorridor } from '../data/heritageSites';
import { useLanguage, useTranslatedTexts } from '../utils/i18n';
import { useHeritageSites } from '../utils/heritageSitesContext';

interface ValleyRouteMapProps {
  onOpenSiteTab: (siteId: string) => void;
  itineraryIds?: string[];
  onChangeItineraryIds?: React.Dispatch<React.SetStateAction<string[]>>;
}

const PRESET_ITINERARIES: {
  id: string;
  label: string;
  siteIds: string[];
  note: string;
}[] = [
  {
    id: 'core-walk',
    label: 'Old City & Sacred River Walk',
    siteIds: ['swayambhunath', 'kathmandu-durbar-square', 'pashupatinath', 'boudhanath'],
    note: 'Links Kathmandu’s western hilltop stupa, royal palace plaza, Bagmati ghats, and Boudhanath kora.',
  },
  {
    id: 'three-kingdoms',
    label: 'Three Malla Kingdoms Circuit',
    siteIds: ['kathmandu-durbar-square', 'patan-durbar-square', 'bhaktapur-durbar-square', 'changu-narayan'],
    note: 'Connects the historic royal plazas of Kathmandu, Patan, and Bhaktapur up to 5th-century Changu ridge.',
  },
];

export const ValleyRouteMap: React.FC<ValleyRouteMapProps> = ({
  onOpenSiteTab,
  itineraryIds: controlledItineraryIds,
  onChangeItineraryIds,
}) => {
  const { t, translateCategory } = useLanguage();
  const { sites } = useHeritageSites();
  const [selectedSiteId, setSelectedSiteId] = useState<string>('kathmandu-durbar-square');
  const [hoveredSiteId, setHoveredSiteId] = useState<string | null>(null);
  const [localItineraryIds, setLocalItineraryIds] = useState<string[]>([
    'swayambhunath',
    'kathmandu-durbar-square',
    'pashupatinath',
    'boudhanath',
  ]);

  const mapTextMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of sites) {
      map[`name:${s.id}`] = s.name;
      map[`dist:${s.id}`] = s.district;
      map[`sum:${s.id}`] = s.summary;
    }
    for (const c of TRAIL_CORRIDORS) {
      map[`corr:${c.id}`] = c.corridorName;
      map[`hl:${c.id}`] = c.highlights;
    }
    for (const p of PRESET_ITINERARIES) {
      map[`preset:${p.id}`] = p.label;
    }
    return map;
  }, [sites]);
  const trMap = useTranslatedTexts(mapTextMap);

  const itineraryIds = controlledItineraryIds ?? localItineraryIds;
  const setItineraryIds = onChangeItineraryIds ?? setLocalItineraryIds;

  const activeInspectSiteId = hoveredSiteId ?? selectedSiteId;

  const selectedSite: HeritageSite | undefined =
    sites.find((s) => s.id === activeInspectSiteId) ?? sites[0];

  const connectedCorridors = useMemo(() => {
    if (!selectedSite) return [];
    return TRAIL_CORRIDORS.filter(
      (c) => c.fromId === selectedSite.id || c.toId === selectedSite.id
    );
  }, [selectedSite]);

  // Compute legs between consecutive stops in itineraryIds
  const itineraryLegs = useMemo(() => {
    const legs: {
      from: HeritageSite;
      to: HeritageSite;
      corridor: TrailCorridor | null;
      estKm: number;
      estTransitMin: number;
    }[] = [];

    for (let i = 0; i < itineraryIds.length - 1; i++) {
      const from = sites.find((s) => s.id === itineraryIds[i]);
      const to = sites.find((s) => s.id === itineraryIds[i + 1]);
      if (!from || !to) continue;

      const corridor =
        TRAIL_CORRIDORS.find(
          (c) =>
            (c.fromId === from.id && c.toId === to.id) ||
            (c.fromId === to.id && c.toId === from.id)
        ) ?? null;

      // Fallback Haversine estimate if no direct corridor exists
      const dx = (to.coordinates.lng - from.coordinates.lng) * 98;
      const dy = (to.coordinates.lat - from.coordinates.lat) * 111;
      const straightKm = Math.max(1.5, Number(Math.hypot(dx, dy).toFixed(1)));
      const estKm = corridor ? corridor.distanceKm : Number((straightKm * 1.25).toFixed(1));
      const estTransitMin = corridor ? corridor.transitMin : Math.round(estKm * 3.8 + 6);

      legs.push({ from, to, corridor, estKm, estTransitMin });
    }
    return legs;
  }, [itineraryIds, sites]);

  const totals = useMemo(() => {
    return itineraryLegs.reduce(
      (acc, leg) => {
        acc.km += leg.estKm;
        acc.transitMin += leg.estTransitMin;
        return acc;
      },
      { km: 0, transitMin: 0 }
    );
  }, [itineraryLegs]);

  const toggleItineraryStop = (siteId: string) => {
    setSelectedSiteId(siteId);
    setItineraryIds((prev) => {
      if (prev.includes(siteId)) {
        return prev.length > 1 ? prev.filter((id) => id !== siteId) : prev;
      }
      return [...prev, siteId];
    });
  };

  if (!selectedSite) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
      {/* Interactive Topographic Valley SVG Map */}
      <div className="lg:col-span-7 rounded-lg border border-stone-300 bg-[#F2ECE1] p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-stone-300/80 pb-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9A3412]">
              {t('mapEyebrow')}
            </p>
            <h3 className="font-serif text-2xl font-semibold text-[#1C1917]">
              {t('mapTitle')}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {PRESET_ITINERARIES.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setItineraryIds(preset.siteIds);
                  setSelectedSiteId(preset.siteIds[0]);
                }}
                className="rounded border border-stone-300 bg-[#F8F5F0] px-2.5 py-1 text-xs font-medium text-stone-700 hover:border-[#9A3412] hover:text-[#9A3412] transition-colors whitespace-nowrap"
              >
                {trMap[`preset:${preset.id}`] || preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative aspect-[1000/580] w-full overflow-hidden rounded-md border border-stone-300 bg-[#EAE2D3]">
          <svg
            viewBox="0 0 1000 580"
            className="h-full w-full block"
            role="img"
            aria-label="Interactive route map of Kathmandu Valley heritage sites"
          >
            {/* Subtle Valley Elevation Contours */}
            <path
              d="M 40 160 Q 240 60 520 95 T 960 140 L 960 0 L 40 0 Z"
              fill="#DFD5C3"
              opacity="0.7"
            />
            <path
              d="M 20 510 Q 280 560 560 525 T 980 480 L 980 580 L 20 580 Z"
              fill="#DFD5C3"
              opacity="0.65"
            />
            <ellipse
              cx="505"
              cy="335"
              rx="290"
              ry="175"
              fill="none"
              stroke="#C8BCAA"
              strokeWidth="1.5"
              strokeDasharray="6 6"
            />

            {/* Ring Road Loop Label */}
            <text
              x="510"
              y="174"
              textAnchor="middle"
              className="fill-stone-500 text-[11px] font-mono"
            >
              RING ROAD CORRIDOR
            </text>

            {/* Bishnumati River */}
            <path
              d="M 320 65 C 335 160, 345 250, 358 345 C 365 395, 395 430, 415 470"
              fill="none"
              stroke="#7A9BB0"
              strokeWidth="4"
              strokeLinecap="round"
              opacity="0.8"
            />
            <text
              x="315"
              y="210"
              transform="rotate(-82 315 210)"
              className="fill-[#4E6E82] text-[10px] font-mono"
            >
              Bishnumati River
            </text>

            {/* Bagmati River */}
            <path
              d="M 760 80 C 705 155, 658 245, 635 320 C 600 415, 480 435, 390 480 C 330 510, 260 535, 210 565"
              fill="none"
              stroke="#688DA4"
              strokeWidth="5"
              strokeLinecap="round"
              opacity="0.85"
            />
            <text
              x="545"
              y="412"
              transform="rotate(-22 545 412)"
              className="fill-[#48687B] text-[10px] font-mono"
            >
              Bagmati River
            </text>

            {/* Manohara River */}
            <path
              d="M 915 190 C 835 280, 770 365, 695 415 C 625 450, 560 440, 515 430"
              fill="none"
              stroke="#84A3B6"
              strokeWidth="3.5"
              strokeLinecap="round"
              opacity="0.75"
            />

            {/* Base Trail Corridors */}
            {TRAIL_CORRIDORS.map((corridor) => {
              const from = sites.find((s) => s.id === corridor.fromId);
              const to = sites.find((s) => s.id === corridor.toId);
              if (!from || !to) return null;
              const isRelated =
                selectedSite != null &&
                (corridor.fromId === selectedSite.id || corridor.toId === selectedSite.id);
              return (
                <line
                  key={corridor.id}
                  x1={from.mapPos.x}
                  y1={from.mapPos.y}
                  x2={to.mapPos.x}
                  y2={to.mapPos.y}
                  stroke={isRelated ? '#9A3412' : '#A89F91'}
                  strokeWidth={isRelated ? 2.5 : 1.5}
                  strokeDasharray={isRelated ? 'none' : '4 4'}
                  opacity={isRelated ? 0.85 : 0.6}
                />
              );
            })}

            {/* Active Multi-Stop Itinerary Path */}
            {itineraryLegs.map((leg, idx) => (
              <g key={`${leg.from.id}-${leg.to.id}-${idx}`}>
                <line
                  x1={leg.from.mapPos.x}
                  y1={leg.from.mapPos.y}
                  x2={leg.to.mapPos.x}
                  y2={leg.to.mapPos.y}
                  stroke="#9A3412"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <circle
                  cx={(leg.from.mapPos.x + leg.to.mapPos.x) / 2}
                  cy={(leg.from.mapPos.y + leg.to.mapPos.y) / 2}
                  r="11"
                  fill="#F8F5F0"
                  stroke="#9A3412"
                  strokeWidth="1.5"
                />
                <text
                  x={(leg.from.mapPos.x + leg.to.mapPos.x) / 2}
                  y={(leg.from.mapPos.y + leg.to.mapPos.y) / 2 + 3.5}
                  textAnchor="middle"
                  className="fill-[#9A3412] text-[10px] font-mono font-semibold"
                >
                  {leg.estKm}k
                </text>
              </g>
            ))}

            {/* Compass Rose (Top-Right Corner) */}
            <g transform="translate(930, 58)">
              <circle cx="0" cy="0" r="22" fill="#F8F5F0" stroke="#BDB4A6" strokeWidth="1" />
              <path d="M 0 -15 L 4 0 L 0 -4 L -4 0 Z" fill="#9A3412" />
              <path d="M 0 15 L 4 0 L 0 4 L -4 0 Z" fill="#78716C" />
              <text x="0" y="-17" textAnchor="middle" className="fill-[#1C1917] text-[9px] font-mono font-bold">
                N
              </text>
            </g>
          </svg>

          {/* Overlaid Interactive Heritage Site Markers */}
          <div className="absolute inset-0 pointer-events-none">
            {sites.map((site) => {
              const isSelected = selectedSite != null && site.id === selectedSite.id;
              const isHovered = site.id === hoveredSiteId;
              const orderIdx = itineraryIds.indexOf(site.id);
              const inRoute = orderIdx !== -1;
              const leftPct = (site.mapPos.x / 1000) * 100;
              const topPct = (site.mapPos.y / 580) * 100;
              const alignTooltipAbove = topPct > 65;
              const alignTooltipLeft = leftPct > 68;
              const localizedName = trMap[`name:${site.id}`] || site.name;
              const shortLabel = localizedName
                .replace(' Temple', '')
                .replace(' Square', ' Sq.')
                .replace(' Stupa', '');

              return (
                <div
                  key={site.id}
                  style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto ${
                    isHovered || isSelected ? 'z-20' : 'z-10'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSiteId(site.id);
                      onOpenSiteTab(site.id);
                    }}
                    onMouseEnter={() => {
                      setHoveredSiteId(site.id);
                      setSelectedSiteId(site.id);
                    }}
                    onMouseLeave={() => setHoveredSiteId(null)}
                    onFocus={() => {
                      setHoveredSiteId(site.id);
                      setSelectedSiteId(site.id);
                    }}
                    onBlur={() => setHoveredSiteId(null)}
                    aria-label={`Open ${localizedName} detail tab`}
                    title={`Open ${localizedName} detail tab`}
                    className="group relative flex flex-col items-center focus:outline-none"
                  >
                    {/* Pulse Halo for Active/Hovered Marker */}
                    {(isSelected || isHovered) && (
                      <span
                        aria-hidden="true"
                        className="absolute -top-1.5 h-9 w-9 sm:h-10 sm:w-10 rounded-full border-2 border-[#9A3412]/45 bg-[#9A3412]/10"
                      />
                    )}

                    {/* Circular Interactive Pin */}
                    <span
                      className={`relative flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full border-2 border-[#F8F5F0] shadow-sm transition-transform duration-150 group-hover:scale-110 group-focus-visible:ring-2 group-focus-visible:ring-[#9A3412] ${
                        inRoute
                          ? 'bg-[#9A3412] text-white'
                          : 'bg-[#1C1917] text-white group-hover:bg-[#9A3412]'
                      }`}
                    >
                      {inRoute ? (
                        <span className="font-mono text-[10px] font-bold leading-none tabular-nums">
                          {orderIdx + 1}
                        </span>
                      ) : (
                        <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      )}
                    </span>

                    {/* Cartographic Marker Label */}
                    <span
                      className={`mt-1 rounded border px-1.5 py-0.5 text-[9px] sm:text-[10px] font-medium leading-tight whitespace-nowrap shadow-xs transition-colors ${
                        isSelected || isHovered
                          ? 'border-[#1C1917] bg-[#1C1917] text-white'
                          : 'border-[#C9C0B1] bg-[#F8F5F0]/95 text-[#1C1917] group-hover:border-[#9A3412]'
                      }`}
                    >
                      {shortLabel}
                    </span>
                  </button>

                  {/* Hover / Focus Rich Tooltip */}
                  {isHovered && (
                    <div
                      className={`pointer-events-none absolute w-52 rounded-md border border-stone-300 bg-[#F8F5F0] p-2.5 text-left shadow-md ${
                        alignTooltipAbove ? 'bottom-full mb-2' : 'top-full mt-2'
                      } ${alignTooltipLeft ? 'right-0' : 'left-1/2 -translate-x-1/2'}`}
                    >
                      <p className="text-[10px] font-semibold text-[#9A3412]">
                        {translateCategory(site.category)} · {site.elevationMeters}m
                      </p>
                      <p className="mt-0.5 font-serif text-sm font-semibold text-[#1C1917] leading-tight">
                        {localizedName}
                      </p>
                      <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-[#9A3412]">
                        <span>{t('mapClickMarkerHint')}</span>
                        <ArrowRight className="h-3 w-3" />
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#9A3412]" />
              <span>{t('mapLegendActive')}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#1C1917]" />
              <span>{t('mapLegendMonument')}</span>
            </span>
          </div>
          <span>{t('mapHint')}</span>
        </div>
      </div>

      {/* Right Column: Selected Site Inspector & Multi-Stop Route Planner */}
      <div className="lg:col-span-5 space-y-6">
        {/* Selected Site Quick Card */}
        <div className="rounded-lg border border-stone-300 bg-[#F8F5F0] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-[#9A3412]">
                {trMap[`dist:${selectedSite.id}`] || selectedSite.district} · {selectedSite.elevationMeters}m
              </p>
              <h4 className="mt-1 font-serif text-2xl font-semibold text-[#1C1917]">
                {trMap[`name:${selectedSite.id}`] || selectedSite.name}
              </h4>
              <p className="mt-0.5 font-mono text-xs text-stone-500 tabular-nums">
                {selectedSite.coordinates.label}
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleItineraryStop(selectedSite.id)}
              className={`inline-flex items-center gap-1 rounded border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                itineraryIds.includes(selectedSite.id)
                  ? 'border-[#9A3412] bg-[#9A3412]/10 text-[#9A3412]'
                  : 'border-stone-300 bg-white text-stone-800 hover:border-stone-400'
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>
                {itineraryIds.includes(selectedSite.id) ? t('mapInTrail') : t('mapAddTrail')}
              </span>
            </button>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-stone-700">
            {trMap[`sum:${selectedSite.id}`] || selectedSite.summary}
          </p>

          {/* Direct Corridor Connections from this site */}
          <div className="mt-4 border-t border-stone-200 pt-3">
            <p className="text-xs font-semibold text-stone-700 mb-2">
              {t('mapDirectConnections')}
            </p>
            <div className="space-y-2">
              {connectedCorridors.map((c) => {
                const otherId = selectedSite && c.fromId === selectedSite.id ? c.toId : c.fromId;
                const other = sites.find((s) => s.id === otherId);
                if (!other) return null;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedSiteId(other.id)}
                    className="flex w-full items-center justify-between gap-2 rounded border border-stone-200 bg-[#EFEAE1]/60 px-3 py-2 text-left text-xs hover:border-[#9A3412] transition-colors"
                  >
                    <div>
                      <p className="font-medium text-stone-900">
                        → {trMap[`name:${other.id}`] || other.name}
                      </p>
                      <p className="text-stone-600">{trMap[`corr:${c.id}`] || c.corridorName}</p>
                    </div>
                    <div className="text-right font-mono text-stone-700 tabular-nums shrink-0">
                      <p>{c.distanceKm} km</p>
                      <p className="text-[11px] text-stone-500">
                        {c.walkingMin ? `${c.walkingMin}m walk` : `${c.transitMin}m transit`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-stone-200 pt-4">
            <button
              type="button"
              onClick={() => onOpenSiteTab(selectedSite.id)}
              className="inline-flex items-center gap-2 rounded-md bg-[#9A3412] px-4 py-2 text-xs font-medium text-white hover:bg-[#7C2D12] transition-colors whitespace-nowrap"
            >
              <span>{t('mapOpenTourTab')}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <a
              href={`?site=${selectedSite.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3.5 py-2 text-xs font-medium text-stone-800 hover:border-stone-500 transition-colors whitespace-nowrap"
            >
              <span>{t('mapNewBrowserTab')}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Multi-Stop Trail Summary */}
        <div className="rounded-lg border border-stone-300 bg-[#EFEAE1] p-5">
          <div className="flex items-center justify-between gap-2 border-b border-stone-300/80 pb-3">
            <div className="flex items-center gap-2">
              <RouteIcon className="h-4 w-4 text-[#9A3412]" />
              <h4 className="font-serif text-xl font-semibold text-[#1C1917]">
                {t('mapCustomTrailTitle')}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setItineraryIds([selectedSite.id])}
              className="inline-flex items-center gap-1 text-xs font-medium text-stone-600 hover:text-stone-900"
            >
              <RotateCcw className="h-3 w-3" />
              <span>{t('mapClear')}</span>
            </button>
          </div>

          {/* Numeric Summary */}
          <div className="mt-3 grid grid-cols-3 gap-3 border-b border-stone-300/80 pb-3">
            <div>
              <p className="text-[11px] text-stone-600">{t('mapStops')}</p>
              <p className="font-mono text-lg font-semibold text-[#1C1917] tabular-nums">
                {itineraryIds.length}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-stone-600">{t('mapDistance')}</p>
              <p className="font-mono text-lg font-semibold text-[#1C1917] tabular-nums">
                {totals.km.toFixed(1)} km
              </p>
            </div>
            <div>
              <p className="text-[11px] text-stone-600">{t('mapEstTransit')}</p>
              <p className="font-mono text-lg font-semibold text-[#1C1917] tabular-nums">
                {totals.transitMin} min
              </p>
            </div>
          </div>

          <div className="mt-3 space-y-2.5">
            {itineraryIds.map((id, index) => {
              const s = sites.find((site) => site.id === id);
              if (!s) return null;
              const nextLeg = itineraryLegs[index];
              return (
                <div key={`${id}-${index}`} className="text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedSiteId(s.id)}
                      className="flex items-center gap-2 font-medium text-stone-900 hover:text-[#9A3412] text-left"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#9A3412] font-mono text-[10px] text-white tabular-nums">
                        {index + 1}
                      </span>
                      <span>{trMap[`name:${s.id}`] || s.name}</span>
                    </button>
                    {itineraryIds.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setItineraryIds((prev) => prev.filter((item) => item !== id))
                        }
                        className="text-stone-500 hover:text-stone-900"
                      >
                        {t('mapRemove')}
                      </button>
                    )}
                  </div>
                  {nextLeg && (
                    <div className="ml-2.5 mt-1 border-l border-stone-300 pl-4 py-1 text-[11px] text-stone-600">
                      <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                        {nextLeg.corridor?.walkingMin ? (
                          <Footprints className="h-3 w-3 text-[#9A3412]" />
                        ) : (
                          <Compass className="h-3 w-3 text-[#9A3412]" />
                        )}
                        {nextLeg.estKm} km ·{' '}
                        {nextLeg.corridor?.walkingMin
                          ? `${nextLeg.corridor.walkingMin} min walk / ${nextLeg.estTransitMin} min ride`
                          : `${nextLeg.estTransitMin} min transit`}
                      </span>
                      {nextLeg.corridor && (
                        <p className="mt-0.5 text-stone-500">
                          {trMap[`hl:${nextLeg.corridor.id}`] || nextLeg.corridor.highlights}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-2 text-[11px] text-stone-600">
            <MapPin className="h-3.5 w-3.5 text-[#9A3412] shrink-0" />
            <span>{t('mapTrailFooter1')}</span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-stone-600">
            <Clock className="h-3.5 w-3.5 text-[#9A3412] shrink-0" />
            <span>{t('mapTrailFooter2')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
