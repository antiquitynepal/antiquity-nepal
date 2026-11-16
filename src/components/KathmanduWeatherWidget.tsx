import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Cloud,
  CloudRain,
  CloudSun,
  Compass,
  Droplets,
  ExternalLink,
  RefreshCw,
  Sun,
  Wind,
  X,
} from 'lucide-react';
import { useLanguage, useTranslatedTexts } from '../utils/i18n';

interface GroundedSource {
  title: string;
  uri: string;
}

interface WeatherData {
  temperatureC: number | null;
  condition: string;
  humidity: string;
  wind: string;
  visibilityOrAdvice: string;
  bestWalkWindow: string;
  observedAt: string;
  sources: GroundedSource[];
}

function renderConditionIcon(condition: string) {
  const c = condition.toLowerCase();
  if (c.includes('rain') || c.includes('shower') || c.includes('drizzle')) {
    return <CloudRain className="h-3.5 w-3.5 text-[#9A3412] shrink-0" />;
  }
  if (c.includes('cloud') || c.includes('overcast')) {
    return <Cloud className="h-3.5 w-3.5 text-[#9A3412] shrink-0" />;
  }
  if (c.includes('haze') || c.includes('partly') || c.includes('mist') || c.includes('fog')) {
    return <CloudSun className="h-3.5 w-3.5 text-[#9A3412] shrink-0" />;
  }
  return <Sun className="h-3.5 w-3.5 text-[#9A3412] shrink-0" />;
}

export const KathmanduWeatherWidget: React.FC = () => {
  const { t } = useLanguage();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const weatherSourceMap = React.useMemo(
    () => ({
      condition: weather?.condition ?? '',
      visibilityOrAdvice: weather?.visibilityOrAdvice ?? '',
      bestWalkWindow: weather?.bestWalkWindow ?? '',
    }),
    [weather?.condition, weather?.visibilityOrAdvice, weather?.bestWalkWindow]
  );
  const translatedWeather = useTranslatedTexts(weatherSourceMap);

  const loadWeather = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = forceRefresh
        ? '/api/weather/kathmandu?refresh=true'
        : '/api/weather/kathmandu';
      const response = await fetch(url);
      const data = (await response.json()) as WeatherData & { error?: string };
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to fetch Kathmandu weather.');
      }
      setWeather(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load current Kathmandu weather.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWeather(false);
  }, [loadWeather]);

  // Close popover on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      {/* Compact Header Strip Control */}
      <div className="flex items-center gap-1 rounded border border-stone-300 bg-[#F8F5F0] px-2.5 py-1 text-xs text-[#1C1917]">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-label="Toggle Kathmandu weather and heritage visit planner details"
          className="inline-flex items-center gap-2 hover:text-[#9A3412] transition-colors whitespace-nowrap"
        >
          {loading && !weather ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#9A3412]" />
              <span className="text-stone-600">{t('weatherLoading')}</span>
            </>
          ) : error && !weather ? (
            <>
              <AlertCircle className="h-3.5 w-3.5 text-[#9A3412]" />
              <span className="text-stone-700">{t('weatherShortName')}</span>
            </>
          ) : weather ? (
            <>
              {renderConditionIcon(weather.condition)}
              <span className="font-mono font-bold text-[#1C1917] tabular-nums">
                {weather.temperatureC !== null ? `${Math.round(weather.temperatureC)}°C` : '—'}
              </span>
              <span className="text-stone-700 truncate max-w-[140px]">
                {translatedWeather.condition}
              </span>
              <span className="hidden lg:inline text-stone-400">·</span>
              <span className="hidden lg:inline text-[11px] font-medium text-[#9A3412]">
                {t('weatherShortName')}
              </span>
            </>
          ) : null}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            loadWeather(true);
          }}
          disabled={loading}
          title="Refresh live Kathmandu weather"
          aria-label="Refresh live Kathmandu weather"
          className="ml-1 rounded p-0.5 text-stone-500 hover:bg-stone-200 hover:text-[#1C1917] disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Grounded Weather & Visit Planning Popover */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-lg border border-stone-300 bg-[#F8F5F0] p-4 shadow-xl z-50 text-left">
          <div className="flex items-start justify-between gap-3 border-b border-stone-200 pb-3">
            <div>
              <p className="text-[11px] font-medium text-[#9A3412]">
                {t('weatherSubTitle')}
              </p>
              <h4 className="font-serif text-xl font-semibold text-[#1C1917]">
                {t('weatherTitle')}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close weather panel"
              className="rounded p-1 text-stone-500 hover:bg-stone-200 hover:text-[#1C1917]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {error && !weather ? (
            <div className="mt-3 space-y-2 text-xs text-stone-700">
              <p className="rounded border border-[#9A3412]/30 bg-[#9A3412]/10 p-2.5 text-[#9A3412]">
                {error}
              </p>
              <button
                type="button"
                onClick={() => loadWeather(true)}
                className="rounded border border-stone-300 bg-white px-3 py-1.5 font-medium text-[#1C1917] hover:border-[#9A3412]"
              >
                {t('weatherRetry')}
              </button>
            </div>
          ) : weather ? (
            <div className="mt-3 space-y-3 text-xs">
              <div className="flex items-baseline justify-between gap-3 rounded-md border border-stone-200 bg-[#EFEAE1] px-3.5 py-2.5">
                <div className="flex items-center gap-2.5">
                  {renderConditionIcon(weather.condition)}
                  <div>
                    <p className="font-mono text-2xl font-semibold text-[#1C1917] tabular-nums leading-none">
                      {weather.temperatureC !== null ? `${weather.temperatureC}°C` : 'N/A'}
                    </p>
                    <p className="mt-1 font-medium text-stone-800">{translatedWeather.condition}</p>
                  </div>
                </div>
                <span className="font-mono text-[11px] text-stone-600">
                  {weather.observedAt}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 rounded border border-stone-200 bg-white px-3 py-2">
                  <Droplets className="h-3.5 w-3.5 text-[#9A3412] shrink-0" />
                  <div>
                    <p className="text-[10px] text-stone-500">{t('weatherHumidity')}</p>
                    <p className="font-mono font-medium text-[#1C1917]">
                      {weather.humidity}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded border border-stone-200 bg-white px-3 py-2">
                  <Wind className="h-3.5 w-3.5 text-[#9A3412] shrink-0" />
                  <div>
                    <p className="text-[10px] text-stone-500">{t('weatherWind')}</p>
                    <p className="font-mono font-medium text-[#1C1917]">
                      {weather.wind}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded border border-stone-200 bg-white p-3 space-y-1.5">
                <p className="flex items-center gap-1.5 font-semibold text-[#1C1917]">
                  <Compass className="h-3.5 w-3.5 text-[#9A3412] shrink-0" />
                  <span>{t('weatherWalkPlanning')}</span>
                </p>
                <p className="text-stone-700 leading-relaxed">
                  {translatedWeather.visibilityOrAdvice}
                </p>
                <p className="text-[11px] font-medium text-[#9A3412]">
                  {t('weatherBestWindow')} {translatedWeather.bestWalkWindow}
                </p>
              </div>

              {/* Google Search Grounded Sources */}
              {weather.sources.length > 0 && (
                <div className="border-t border-stone-200 pt-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
                    {t('weatherGrounded')}
                  </p>
                  <ul className="space-y-1">
                    {weather.sources.map((src, idx) => (
                      <li key={`${src.uri}-${idx}`}>
                        <a
                          href={src.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-[#9A3412] hover:underline max-w-full"
                        >
                          <span className="truncate">{src.title}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
