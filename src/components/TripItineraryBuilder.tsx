import React, { useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Calendar,
  Check,
  Clock,
  Compass,
  FileDown,
  Footprints,
  MapPin,
  Plus,
  Printer,
  RotateCcw,
  Route as RouteIcon,
  Trash2,
} from 'lucide-react';
import {
  HeritageSite,
  TRAIL_CORRIDORS,
  TrailCorridor,
} from '../data/heritageSites';
import { UIStringKey, useLanguage, useTranslatedTexts } from '../utils/i18n';
import { useHeritageSites } from '../utils/heritageSitesContext';

export type TripTravelMode = 'balanced' | 'walking' | 'taxi';

interface TripItineraryBuilderProps {
  itineraryIds: string[];
  onChangeItineraryIds: React.Dispatch<React.SetStateAction<string[]>>;
  onOpenSiteTab: (siteId: string) => void;
}

interface ComputedLeg {
  from: HeritageSite;
  to: HeritageSite;
  corridor: TrailCorridor | null;
  distanceKm: number;
  travelMin: number;
  modeNote: string;
}

const TRAVEL_MODES: {
  id: TripTravelMode;
  labelKey: UIStringKey;
  subtitleKey: UIStringKey;
}[] = [
  {
    id: 'balanced',
    labelKey: 'itineraryModeBalanced',
    subtitleKey: 'itineraryModeBalancedSub',
  },
  {
    id: 'walking',
    labelKey: 'itineraryModeWalk',
    subtitleKey: 'itineraryModeWalkSub',
  },
  {
    id: 'taxi',
    labelKey: 'itineraryModeTaxi',
    subtitleKey: 'itineraryModeTaxiSub',
  },
];

const TRIP_PRESETS: {
  id: string;
  labelKey: UIStringKey;
  siteIds: string[];
}[] = [
  {
    id: 'sacred-loop',
    labelKey: 'presetSacredLoop',
    siteIds: ['swayambhunath', 'kathmandu-durbar-square', 'pashupatinath', 'boudhanath'],
  },
  {
    id: 'malla-kingdoms',
    labelKey: 'presetMalla',
    siteIds: ['kathmandu-durbar-square', 'patan-durbar-square', 'bhaktapur-durbar-square', 'changu-narayan'],
  },
  {
    id: 'complete-7',
    labelKey: 'presetAll7',
    siteIds: [
      'swayambhunath',
      'kathmandu-durbar-square',
      'patan-durbar-square',
      'pashupatinath',
      'boudhanath',
      'changu-narayan',
      'bhaktapur-durbar-square',
    ],
  },
];

function formatDuration(totalMinutes: number): string {
  const hrs = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);
  if (hrs === 0) return `${mins} min`;
  if (mins === 0) return `${hrs} hr`;
  return `${hrs} hr ${mins} min`;
}

function addMinutesToClock(startTimeStr: string, offsetMinutes: number): string {
  const match = startTimeStr.match(/^(\d{1,2}):(\d{2})$/);
  const baseHours = match ? Number.parseInt(match[1], 10) : 8;
  const baseMins = match ? Number.parseInt(match[2], 10) : 0;
  const total = (baseHours * 60 + baseMins + offsetMinutes) % (24 * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} NPT`;
}

function pdfSafeText(input: string): string {
  return input
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2014/g, ' -- ')
    .replace(/\u2013/g, '-')
    .replace(/\u2022|\u00B7/g, ' | ')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const ATLAS_LOGO_URL =
  '/assets/aistudio/6e112a5a-e7c6-4593-b7d8-3cb913521721_11255886.webp';

async function loadLogoPngDataUrl(): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const size = 128;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(img, 0, 0, size, size);
          resolve(canvas.toDataURL('image/png'));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = ATLAS_LOGO_URL;
    } catch {
      resolve(null);
    }
  });
}

export const TripItineraryBuilder: React.FC<TripItineraryBuilderProps> = ({
  itineraryIds,
  onChangeItineraryIds,
  onOpenSiteTab,
}) => {
  const { t, translateCategory } = useLanguage();
  const [travelMode, setTravelMode] = useState<TripTravelMode>('balanced');
  const [tripTitle, setTripTitle] = useState<string>(
    'Kathmandu Valley Heritage Circuit'
  );
  const [travelerName, setTravelerName] = useState<string>('');
  const [tripDate, setTripDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [startTime, setStartTime] = useState<string>('08:30');
  const [pdfNotice, setPdfNotice] = useState<string | null>(null);

  const { sites } = useHeritageSites();

  const itineraryTextMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of sites) {
      map[`name:${s.id}`] = s.name;
      map[`dist:${s.id}`] = s.district;
      map[`hours:${s.id}`] = s.visitingHours;
    }
    return map;
  }, [sites]);
  const trSites = useTranslatedTexts(itineraryTextMap);
  const siteName = (s: HeritageSite) => trSites[`name:${s.id}`] || s.name;
  const siteDistrict = (s: HeritageSite) => trSites[`dist:${s.id}`] || s.district;
  const siteHours = (s: HeritageSite) => trSites[`hours:${s.id}`] || s.visitingHours;

  const orderedSites = useMemo(() => {
    return itineraryIds
      .map((id) => sites.find((s) => s.id === id))
      .filter((s): s is HeritageSite => Boolean(s));
  }, [itineraryIds, sites]);

  const legs = useMemo<ComputedLeg[]>(() => {
    const computed: ComputedLeg[] = [];
    for (let i = 0; i < orderedSites.length - 1; i++) {
      const from = orderedSites[i];
      const to = orderedSites[i + 1];
      const corridor =
        TRAIL_CORRIDORS.find(
          (c) =>
            (c.fromId === from.id && c.toId === to.id) ||
            (c.fromId === to.id && c.toId === from.id)
        ) ?? null;

      const dx = (to.coordinates.lng - from.coordinates.lng) * 98;
      const dy = (to.coordinates.lat - from.coordinates.lat) * 111;
      const straightKm = Math.max(1.2, Number(Math.hypot(dx, dy).toFixed(1)));
      const distanceKm = corridor
        ? corridor.distanceKm
        : Number((straightKm * 1.25).toFixed(1));

      let travelMin: number;
      let modeNote: string;

      if (travelMode === 'walking') {
        travelMin = corridor?.walkingMin ?? Math.round(distanceKm * 14 + 5);
        modeNote = 'Pedestrian walk';
      } else if (travelMode === 'taxi') {
        travelMin = corridor
          ? Math.max(8, Math.round(corridor.transitMin * 0.78))
          : Math.max(10, Math.round(distanceKm * 3.1 + 5));
        modeNote = 'Taxi / private car';
      } else {
        // Balanced: walk short corridors <= 3.5 km, transit/taxi beyond
        if (corridor?.walkingMin && distanceKm <= 3.5) {
          travelMin = corridor.walkingMin;
          modeNote = 'Heritage walk';
        } else {
          travelMin = corridor
            ? corridor.transitMin
            : Math.round(distanceKm * 3.8 + 6);
          modeNote = 'Local transit / taxi';
        }
      }

      computed.push({
        from,
        to,
        corridor,
        distanceKm,
        travelMin,
        modeNote,
      });
    }
    return computed;
  }, [orderedSites, travelMode]);

  const totals = useMemo(() => {
    const totalKm = legs.reduce((sum, leg) => sum + leg.distanceKm, 0);
    const totalTravelMin = legs.reduce((sum, leg) => sum + leg.travelMin, 0);
    const totalVisitMin = orderedSites.length * 60; // ~60 min recommended per monument
    return {
      totalKm: Number(totalKm.toFixed(1)),
      totalTravelMin,
      totalVisitMin,
      totalElapsedMin: totalTravelMin + totalVisitMin,
    };
  }, [legs, orderedSites.length]);

  const toggleSiteSelection = (siteId: string) => {
    onChangeItineraryIds((prev) =>
      prev.includes(siteId)
        ? prev.filter((id) => id !== siteId)
        : [...prev, siteId]
    );
  };

  const moveStop = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= itineraryIds.length) return;
    onChangeItineraryIds((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const reverseOrder = () => {
    onChangeItineraryIds((prev) => [...prev].reverse());
  };

  const handleGeneratePdf = async () => {
    if (orderedSites.length === 0) return;

    const logoPngDataUrl = await loadLogoPngDataUrl();

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 16;
    const contentWidth = pageWidth - marginX * 2;
    let y = 18;

    const drawHeaderBanner = () => {
      doc.setFillColor(248, 245, 240);
      doc.rect(0, 0, pageWidth, 34, 'F');
      doc.setDrawColor(154, 52, 18);
      doc.setLineWidth(0.6);
      doc.line(marginX, 34, pageWidth - marginX, 34);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(154, 52, 18);
      doc.text(
        "SURAJ GIRI'S KATHMANDU HERITAGE ATLAS  |  ANTIQUITY NEPAL",
        marginX,
        13
      );

      doc.setFont('times', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(28, 25, 23);
      doc.text(
        pdfSafeText(tripTitle.trim() || 'Kathmandu Heritage Itinerary'),
        marginX,
        23
      );

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(87, 83, 78);
      const modeObj = TRAVEL_MODES.find((m) => m.id === travelMode);
      const modeLabel = pdfSafeText(modeObj ? t(modeObj.labelKey) : 'Walk + Transit') || 'Walk + Transit';
      const metaParts = [
        `Date: ${tripDate || 'Flexible'}`,
        `Start: ${startTime} NPT`,
        `Mode: ${modeLabel}`,
        travelerName.trim() ? `Traveler: ${pdfSafeText(travelerName)}` : null,
      ].filter(Boolean);
      doc.text(metaParts.join('   |   '), marginX, 30);

      y = 42;
    };

    const ensureSpace = (neededMm: number) => {
      if (y + neededMm > pageHeight - 18) {
        doc.addPage();
        y = 18;
      }
    };

    drawHeaderBanner();

    // Summary Metrics Strip
    doc.setFillColor(239, 234, 225);
    doc.setDrawColor(214, 211, 209);
    doc.roundedRect(marginX, y, contentWidth, 18, 2, 2, 'FD');

    const colW = contentWidth / 4;
    const summaryMetrics = [
      { label: 'TOTAL STOPS', value: `${orderedSites.length} Monuments` },
      { label: 'TOTAL DISTANCE', value: `${totals.totalKm.toFixed(1)} km` },
      { label: 'EST. TRAVEL TIME', value: formatDuration(totals.totalTravelMin) },
      {
        label: 'FULL TRIP (W/ VISITS)',
        value: formatDuration(totals.totalElapsedMin),
      },
    ];

    summaryMetrics.forEach((item, idx) => {
      const cx = marginX + colW * idx + 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(120, 113, 108);
      doc.text(item.label, cx, y + 6.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(28, 25, 23);
      doc.text(item.value, cx, y + 13.5);
    });

    y += 26;

    // Ordered Stops & Between-Stop Route Legs
    let cumulativeMin = 0;
    let cumulativeKm = 0;

    orderedSites.forEach((site, idx) => {
      ensureSpace(34);
      const arrivalClock = addMinutesToClock(startTime, cumulativeMin);

      // Stop Number Circle
      doc.setFillColor(154, 52, 18);
      doc.circle(marginX + 4.5, y + 4.5, 4.2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text(String(idx + 1).padStart(2, '0'), marginX + 4.5, y + 5.7, {
        align: 'center',
      });

      // Stop Header
      doc.setFont('times', 'bold');
      doc.setFontSize(13.5);
      doc.setTextColor(28, 25, 23);
      doc.text(pdfSafeText(site.name), marginX + 12, y + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(154, 52, 18);
      doc.text(`Arrive ~${arrivalClock}`, pageWidth - marginX, y + 4.5, {
        align: 'right',
      });

      // Site Meta Line
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(87, 83, 78);
      doc.text(
        pdfSafeText(
          `${site.category} | ${site.district} | Elev. ${site.elevationMeters}m | Cumulative: ${cumulativeKm.toFixed(1)} km`
        ),
        marginX + 12,
        y + 10
      );

      // Hours & Entry Fee Line
      doc.setFontSize(8);
      doc.setTextColor(68, 64, 60);
      doc.text(
        pdfSafeText(
          `Hours: ${site.visitingHours} | Entry: Foreign ${site.entryFees.foreign} / SAARC ${site.entryFees.saarc}`
        ),
        marginX + 12,
        y + 15
      );

      // Primary arrival tip
      const arrivalTip = site.routes[0]?.overview ?? site.summary;
      const wrappedTip = doc.splitTextToSize(
        pdfSafeText(`Site Note: ${arrivalTip}`),
        contentWidth - 14
      ) as string[];
      doc.setFontSize(8);
      doc.setTextColor(87, 83, 78);
      const tipLines = wrappedTip.slice(0, 2);
      doc.text(tipLines, marginX + 12, y + 20);

      y += 20 + tipLines.length * 4;

      cumulativeMin += 60; // Allocate ~1 hr monument exploration

      // Leg to next site
      const nextLeg = legs[idx];
      if (nextLeg) {
        ensureSpace(16);
        doc.setDrawColor(214, 211, 209);
        doc.setFillColor(248, 245, 240);
        doc.roundedRect(marginX + 12, y, contentWidth - 12, 12, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(154, 52, 18);
        doc.text(
          pdfSafeText(
            `Next Leg -> ${nextLeg.to.name}: ${nextLeg.distanceKm} km | Est. ${nextLeg.travelMin} min (${nextLeg.modeNote})`
          ),
          marginX + 15,
          y + 5
        );

        const corridorText = pdfSafeText(
          nextLeg.corridor
            ? `${nextLeg.corridor.corridorName} -- ${nextLeg.corridor.highlights}`
            : 'Direct Kathmandu Valley basin transfer via main ring/arterial corridors'
        );
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(87, 83, 78);
        doc.text(corridorText.slice(0, 98), marginX + 15, y + 9.8);

        cumulativeMin += nextLeg.travelMin;
        cumulativeKm += nextLeg.distanceKm;
        y += 16;
      } else {
        y += 4;
      }
    });

    // Footer on all pages
    const pageCount = doc.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      doc.setDrawColor(214, 211, 209);
      doc.line(marginX, pageHeight - 15, pageWidth - marginX, pageHeight - 15);
      if (logoPngDataUrl) {
        doc.addImage(logoPngDataUrl, 'PNG', marginX, pageHeight - 13, 9, 9);
      }
      const textStartX = logoPngDataUrl ? marginX + 11.5 : marginX;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(120, 113, 108);
      doc.text(
        "Suraj Giri's Kathmandu Heritage Atlas | Designed and managed by Suraj Giri as Antiquity Nepal",
        textStartX,
        pageHeight - 7.5
      );
      doc.text(`Page ${p} of ${pageCount}`, pageWidth - marginX, pageHeight - 7.5, {
        align: 'right',
      });
    }

    const safeSlug = tripTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'kathmandu-heritage-itinerary';

    doc.save(`${safeSlug}.pdf`);
    setPdfNotice(
      `Generated printable PDF (${safeSlug}.pdf) with ${orderedSites.length} stops, ${totals.totalKm.toFixed(1)} km total distance, and ${formatDuration(totals.totalTravelMin)} travel time.`
    );
  };

  return (
    <div
      id="trip-itinerary-builder"
      className="mt-10 rounded-lg border border-stone-300 bg-[#EFEAE1] p-5 sm:p-6"
    >
      {/* Header & Preset Circuit Bar */}
      <div className="flex flex-col gap-4 border-b border-stone-300/80 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9A3412]">
            {t('itineraryEyebrow')}
          </p>
          <h3 className="mt-1 font-serif text-2xl sm:text-3xl font-semibold text-[#1C1917]">
            {t('itineraryTitle')}
          </h3>
          <p className="mt-1 max-w-2xl text-xs sm:text-sm text-stone-700">
            {t('itineraryDesc')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {TRIP_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChangeItineraryIds(preset.siteIds)}
              className="rounded border border-stone-300 bg-[#F8F5F0] px-3 py-1.5 text-xs font-medium text-stone-800 hover:border-[#9A3412] hover:text-[#9A3412] transition-colors whitespace-nowrap"
            >
              {t(preset.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {pdfNotice && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-emerald-700/30 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-900 print:hidden">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-700 shrink-0" />
            <span>{pdfNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setPdfNotice(null)}
            className="font-medium text-emerald-800 hover:underline"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Two-Column Workspace */}
      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        {/* Left Column (5 cols): Site Selector Checklist & Trip Settings */}
        <div className="lg:col-span-5 space-y-5 print:hidden">
          {/* Site Directory Multi-Select */}
          <div className="rounded-md border border-stone-300 bg-[#F8F5F0] p-4">
            <div className="flex items-center justify-between gap-2 border-b border-stone-200 pb-2.5">
              <span className="text-xs font-semibold text-[#1C1917]">
                {t('itineraryStep1')} ({itineraryIds.length} / {sites.length})
              </span>
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() =>
                    onChangeItineraryIds(sites.map((s) => s.id))
                  }
                  className="font-medium text-[#9A3412] hover:underline"
                >
                  {t('itinerarySelectAll')}
                </button>
                <span className="text-stone-400">·</span>
                <button
                  type="button"
                  onClick={() => onChangeItineraryIds([])}
                  className="text-stone-600 hover:text-[#1C1917]"
                >
                  {t('itineraryClear')}
                </button>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {sites.map((site) => {
                const orderIdx = itineraryIds.indexOf(site.id);
                const selected = orderIdx !== -1;
                return (
                  <button
                    key={site.id}
                    type="button"
                    onClick={() => toggleSiteSelection(site.id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-left transition-colors ${
                      selected
                        ? 'border-[#9A3412] bg-white'
                        : 'border-stone-200 bg-white/60 hover:border-stone-400'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold tabular-nums ${
                          selected
                            ? 'bg-[#9A3412] text-white'
                            : 'border border-stone-300 bg-[#F8F5F0] text-stone-500'
                        }`}
                      >
                        {selected ? orderIdx + 1 : <Plus className="h-3 w-3" />}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-[#1C1917]">
                          {siteName(site)}
                        </p>
                        <p className="truncate text-[11px] text-stone-500">
                          {siteDistrict(site).split('·')[0].trim()} · {translateCategory(site.category)}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-[11px] text-stone-500 shrink-0 tabular-nums">
                      {site.elevationMeters}m
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Travel Mode & Trip Details */}
          <div className="rounded-md border border-stone-300 bg-[#F8F5F0] p-4 space-y-4">
            <p className="text-xs font-semibold text-[#1C1917] border-b border-stone-200 pb-2">
              {t('itineraryStep2')}
            </p>

            <div className="grid grid-cols-1 gap-2">
              {TRAVEL_MODES.map((m) => {
                const active = travelMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setTravelMode(m.id)}
                    className={`rounded border px-3 py-2 text-left transition-colors ${
                      active
                        ? 'border-[#9A3412] bg-white'
                        : 'border-stone-200 bg-white/60 hover:border-stone-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#1C1917]">
                        {t(m.labelKey)}
                      </span>
                      {active && (
                        <Check className="h-3.5 w-3.5 text-[#9A3412]" />
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-stone-600">
                      {t(m.subtitleKey)}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-1">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-stone-700 mb-1">
                  {t('itineraryTitleInput')}
                </label>
                <input
                  type="text"
                  value={tripTitle}
                  onChange={(e) => setTripTitle(e.target.value)}
                  className="w-full rounded border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-[#1C1917]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-stone-700 mb-1">
                  {t('itineraryDate')}
                </label>
                <input
                  type="date"
                  value={tripDate}
                  onChange={(e) => setTripDate(e.target.value)}
                  className="w-full rounded border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-mono text-[#1C1917]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-stone-700 mb-1">
                  {t('itineraryStartTime')}
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-mono text-[#1C1917]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-stone-700 mb-1">
                  {t('itineraryTraveler')}
                </label>
                <input
                  type="text"
                  value={travelerName}
                  onChange={(e) => setTravelerName(e.target.value)}
                  placeholder="e.g. Suraj & Companions"
                  className="w-full rounded border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-[#1C1917] placeholder:text-stone-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Ordered Route Sequence, Totals & PDF Export */}
        <div className="lg:col-span-7 space-y-4">
          {/* Live Route Summary Metrics + PDF Export Actions */}
          <div className="rounded-md border border-stone-300 bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9A3412]">
                  {t('itineraryOverviewEyebrow')}
                </p>
                <h4 className="mt-0.5 font-serif text-2xl font-semibold text-[#1C1917]">
                  {tripTitle || 'Kathmandu Heritage Circuit'}
                </h4>
                <p className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-stone-600">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-[#9A3412]" />
                    <span>{tripDate}</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-[#9A3412]" />
                    <span>{t('itineraryStarts')} {startTime} NPT</span>
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={reverseOrder}
                  disabled={orderedSites.length < 2}
                  title={t('itineraryReverse')}
                  className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-[#F8F5F0] px-3 py-2 text-xs font-medium text-stone-800 hover:border-stone-500 disabled:opacity-40 transition-colors"
                >
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  <span>{t('itineraryReverse')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  disabled={orderedSites.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-[#1C1917] hover:border-stone-500 disabled:opacity-40 transition-colors"
                >
                  <Printer className="h-3.5 w-3.5 text-[#9A3412]" />
                  <span>{t('itineraryPrint')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => void handleGeneratePdf()}
                  disabled={orderedSites.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#9A3412] px-4 py-2 text-xs font-medium text-white hover:bg-[#7C2D12] disabled:opacity-40 transition-colors whitespace-nowrap"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  <span>{t('itineraryDownloadPdf')}</span>
                </button>
              </div>
            </div>

            {/* 4-Stat Totals Strip */}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 border-b border-stone-200 pb-4">
              <div className="rounded border border-stone-200 bg-[#F8F5F0] p-3">
                <p className="text-[11px] text-stone-600">{t('itinerarySelectedStops')}</p>
                <p className="mt-0.5 font-mono text-xl font-semibold text-[#1C1917] tabular-nums">
                  {orderedSites.length}
                </p>
              </div>
              <div className="rounded border border-stone-200 bg-[#F8F5F0] p-3">
                <p className="text-[11px] text-stone-600">{t('itineraryTotalDist')}</p>
                <p className="mt-0.5 font-mono text-xl font-semibold text-[#9A3412] tabular-nums">
                  {totals.totalKm.toFixed(1)} km
                </p>
              </div>
              <div className="rounded border border-stone-200 bg-[#F8F5F0] p-3">
                <p className="text-[11px] text-stone-600">{t('itineraryEstTravel')}</p>
                <p className="mt-0.5 font-mono text-xl font-semibold text-[#1C1917] tabular-nums">
                  {formatDuration(totals.totalTravelMin)}
                </p>
              </div>
              <div className="rounded border border-stone-200 bg-[#F8F5F0] p-3">
                <p className="text-[11px] text-stone-600">{t('itineraryEstDay')}</p>
                <p className="mt-0.5 font-mono text-xl font-semibold text-[#1C1917] tabular-nums">
                  {orderedSites.length > 0 ? formatDuration(totals.totalElapsedMin) : '0 min'}
                </p>
              </div>
            </div>

            {/* Ordered Stop List with Reordering & Leg Estimates */}
            {orderedSites.length === 0 ? (
              <div className="py-10 text-center">
                <RouteIcon className="mx-auto h-7 w-7 text-stone-400" />
                <p className="mt-2 font-serif text-xl font-semibold text-[#1C1917]">
                  {t('itineraryEmptyTitle')}
                </p>
                <p className="mt-1 text-xs text-stone-600">
                  {t('itineraryEmptyDesc')}
                </p>
                <button
                  type="button"
                  onClick={() => onChangeItineraryIds(TRIP_PRESETS[0].siteIds)}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-[#F8F5F0] px-3.5 py-2 text-xs font-medium text-[#1C1917] hover:border-[#9A3412]"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-[#9A3412]" />
                  <span>{t('itineraryLoadLoop')}</span>
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {(() => {
                  let runningClockOffset = 0;
                  return orderedSites.map((site, idx) => {
                    const arriveAt = addMinutesToClock(startTime, runningClockOffset);
                    runningClockOffset += 60;
                    const leg = legs[idx];
                    if (leg) {
                      runningClockOffset += leg.travelMin;
                    }

                    return (
                      <div key={site.id}>
                        {/* Heritage Site Stop Card */}
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-stone-300 bg-[#F8F5F0] px-4 py-3">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1C1917] font-mono text-xs font-semibold text-white tabular-nums">
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => onOpenSiteTab(site.id)}
                                  className="font-serif text-lg font-semibold text-[#1C1917] hover:text-[#9A3412] text-left transition-colors"
                                >
                                  {siteName(site)}
                                </button>
                                <span className="font-mono text-[11px] font-semibold text-[#9A3412] tabular-nums">
                                  {t('itineraryArrive')} {arriveAt}
                                </span>
                              </div>
                              <p className="text-[11px] text-stone-600 flex flex-wrap items-center gap-x-2">
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-[#9A3412]" />
                                  <span>{siteDistrict(site)}</span>
                                </span>
                                <span>·</span>
                                <span>{t('itineraryHours')}: {siteHours(site)}</span>
                              </p>
                            </div>
                          </div>

                          {/* Arrange Order Controls */}
                          <div className="flex items-center gap-1 print:hidden">
                            <button
                              type="button"
                              onClick={() => moveStop(idx, -1)}
                              disabled={idx === 0}
                              aria-label={`Move ${site.name} earlier`}
                              className="rounded border border-stone-300 bg-white p-1.5 text-stone-700 hover:border-[#9A3412] hover:text-[#9A3412] disabled:opacity-35"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveStop(idx, 1)}
                              disabled={idx === orderedSites.length - 1}
                              aria-label={`Move ${site.name} later`}
                              className="rounded border border-stone-300 bg-white p-1.5 text-stone-700 hover:border-[#9A3412] hover:text-[#9A3412] disabled:opacity-35"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleSiteSelection(site.id)}
                              aria-label={`Remove ${site.name} from itinerary`}
                              className="rounded border border-stone-300 bg-white p-1.5 text-stone-500 hover:border-[#9A3412] hover:text-[#9A3412]"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Between-Stop Transit / Distance Connector */}
                        {leg && (
                          <div className="ml-5 border-l-2 border-dashed border-[#9A3412]/50 pl-5 py-2 my-1 text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-stone-200 bg-white px-3 py-2">
                              <div className="flex items-center gap-2 text-stone-800">
                                {travelMode === 'walking' ||
                                (travelMode === 'balanced' &&
                                  leg.corridor?.walkingMin &&
                                  leg.distanceKm <= 3.5) ? (
                                  <Footprints className="h-3.5 w-3.5 text-[#9A3412] shrink-0" />
                                ) : (
                                  <Compass className="h-3.5 w-3.5 text-[#9A3412] shrink-0" />
                                )}
                                <span className="font-medium">
                                  {t('itineraryTo')} {siteName(leg.to)}
                                </span>
                                <span className="text-[11px] text-stone-500">
                                  ({t(TRAVEL_MODES.find((m) => m.id === travelMode)?.labelKey ?? 'itineraryModeBalanced')})
                                </span>
                              </div>
                              <span className="font-mono text-xs font-semibold text-[#9A3412] tabular-nums">
                                {leg.distanceKm} km · {leg.travelMin} min
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            )}

            {/* Institutional Itinerary Card & Print Footer */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-4 text-xs text-stone-600">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/aistudio/6e112a5a-e7c6-4593-b7d8-3cb913521721_11255886.webp"
                  alt="Kathmandu Heritage Atlas Logo"
                  referrerPolicy="no-referrer"
                  className="h-11 w-11 aspect-square rounded object-contain bg-[#22292A] border border-stone-300 shrink-0"
                />
                <div>
                  <p className="font-serif text-sm font-semibold text-[#1C1917]">
                    {t('brandTitle')}
                  </p>
                  <p className="text-[11px] text-stone-600">
                    {t('footerManagedBy')}
                  </p>
                </div>
              </div>
              <span className="hidden print:inline font-mono text-[11px] text-stone-500">
                Printed Heritage Circuit · Antiquity Nepal
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
