import 'dotenv/config';
import path from 'node:path';
import express from 'express';
import type { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

interface GroundedSource {
  title: string;
  uri: string;
}

interface KathmanduWeatherPayload {
  temperatureC: number | null;
  condition: string;
  humidity: string;
  wind: string;
  visibilityOrAdvice: string;
  bestWalkWindow: string;
  observedAt: string;
  summaryText: string;
  sources: GroundedSource[];
  searchQueries: string[];
}

const PORT = Number(process.env.PORT) || 3000;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

let cachedWeather: {
  data: KathmanduWeatherPayload;
  fetchedAt: number;
} | null = null;

function createGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please check the Settings > Secrets panel.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function parseWeatherJson(rawText: string): Partial<KathmanduWeatherPayload> {
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {};
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    const tempVal =
      typeof parsed.temperatureC === 'number'
        ? parsed.temperatureC
        : typeof parsed.temperatureC === 'string'
        ? Number.parseFloat(parsed.temperatureC)
        : null;

    return {
      temperatureC: tempVal !== null && !Number.isNaN(tempVal) ? tempVal : null,
      condition:
        typeof parsed.condition === 'string' ? parsed.condition : undefined,
      humidity:
        typeof parsed.humidity === 'string' ? parsed.humidity : undefined,
      wind: typeof parsed.wind === 'string' ? parsed.wind : undefined,
      visibilityOrAdvice:
        typeof parsed.visibilityOrAdvice === 'string'
          ? parsed.visibilityOrAdvice
          : undefined,
      bestWalkWindow:
        typeof parsed.bestWalkWindow === 'string'
          ? parsed.bestWalkWindow
          : undefined,
      observedAt:
        typeof parsed.observedAt === 'string' ? parsed.observedAt : undefined,
    };
  } catch {
    return {};
  }
}

async function fetchKathmanduWeather(): Promise<KathmanduWeatherPayload> {
  const ai = createGeminiClient();
  const prompt = [
    'Use Google Search right now to look up the current live weather forecast and air conditions for Kathmandu, Nepal.',
    'Report the current temperature in Celsius, sky/weather condition, relative humidity, wind speed, visibility or air quality note, and concise heritage walking guidance for outdoor monument visits (such as Swayambhunath, Durbar Squares, Pashupatinath, or Boudhanath).',
    'After checking live search results, output a single valid JSON object with these exact keys:',
    '{',
    '  "temperatureC": <number>,',
    '  "condition": "<short weather condition, e.g. Clear Sky / Light Haze / Partly Cloudy>",',
    '  "humidity": "<percentage string, e.g. 54%>",',
    '  "wind": "<wind speed & direction, e.g. 8 km/h W>",',
    '  "visibilityOrAdvice": "<1 concise sentence of practical outdoor heritage visit advice based on current weather>",',
    '  "bestWalkWindow": "<recommended outdoor window today, e.g. Clear morning light until 10:30 NPT>",',
    '  "observedAt": "<observation time or local Kathmandu time noted>"',
    '}',
  ].join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const rawText = (response.text ?? '').trim();
  const parsed = parseWeatherJson(rawText);

  const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
  const rawChunks = groundingMetadata?.groundingChunks ?? [];
  const seenUris = new Set<string>();
  const sources: GroundedSource[] = [];

  for (const chunk of rawChunks) {
    const uri = chunk.web?.uri;
    if (uri && !seenUris.has(uri)) {
      seenUris.add(uri);
      sources.push({
        title: chunk.web?.title || uri,
        uri,
      });
    }
  }

  const searchQueries = groundingMetadata?.webSearchQueries ?? [];

  return {
    temperatureC: parsed.temperatureC ?? null,
    condition: parsed.condition || 'Kathmandu Weather Update',
    humidity: parsed.humidity || 'N/A',
    wind: parsed.wind || 'N/A',
    visibilityOrAdvice:
      parsed.visibilityOrAdvice ||
      (rawText.length > 0 && !rawText.startsWith('{')
        ? rawText.slice(0, 220)
        : 'Check light layers for morning courtyard visits and valley ridge walks.'),
    bestWalkWindow: parsed.bestWalkWindow || 'Morning & late afternoon golden hour',
    observedAt:
      parsed.observedAt ||
      new Date().toLocaleTimeString('en-US', {
        timeZone: 'Asia/Kathmandu',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' NPT',
    summaryText: rawText,
    sources: sources.slice(0, 5),
    searchQueries,
  };
}

type SupportedTargetLanguage = 'fr' | 'es' | 'ja' | 'zh' | 'pt';

const TARGET_LANGUAGE_NAMES: Record<SupportedTargetLanguage, string> = {
  fr: 'French',
  es: 'Spanish',
  ja: 'Japanese',
  zh: 'Simplified Chinese',
  pt: 'Portuguese',
};

// In-memory translation cache: key = `${lang}:${sourceText}`
const translationCache = new Map<string, string>();
const MAX_TRANSLATION_CACHE_ENTRIES = 6000;

async function translateBatchWithGemini(
  targetLanguage: SupportedTargetLanguage,
  entries: Array<[string, string]>
): Promise<Record<string, string>> {
  const ai = createGeminiClient();
  const languageName = TARGET_LANGUAGE_NAMES[targetLanguage];

  const indexedPayload: Record<string, string> = {};
  entries.forEach(([, value], idx) => {
    indexedPayload[String(idx)] = value;
  });

  const prompt = [
    `You are an authoritative museum & architectural translator for "Suraj Giri's Kathmandu Heritage Atlas" (managed by Antiquity Nepal).`,
    `Translate each string value in the JSON object below from English into natural, editorial-grade ${languageName}.`,
    'Rules:',
    '1. Return ONLY a single valid JSON object mapping each exact numeric string key ("0", "1", ...) to its translated string.',
    '2. Preserve exact keys, numbers, units (km, min, m, NPT, NPR), and proper personal/organization names such as "Suraj Giri" and "Antiquity Nepal".',
    '3. For Japanese and Chinese, keep Latin names like "Suraj Giri" and "Antiquity Nepal" clear and accurate while translating surrounding prose naturally.',
    '4. Do not add markdown fences or commentary.',
    '',
    JSON.stringify(indexedPayload),
  ].join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    },
  });

  const rawText = (response.text ?? '')
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Translation model returned an unexpected non-JSON format.');
  }

  const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
  const result: Record<string, string> = {};

  entries.forEach(([originalKey, originalText], idx) => {
    const candidate = parsed[String(idx)];
    const translated =
      typeof candidate === 'string' && candidate.trim().length > 0
        ? candidate.trim()
        : originalText;
    result[originalKey] = translated;

    if (translationCache.size >= MAX_TRANSLATION_CACHE_ENTRIES) {
      const oldestKey = translationCache.keys().next().value;
      if (oldestKey) {
        translationCache.delete(oldestKey);
      }
    }
    translationCache.set(`${targetLanguage}:${originalText}`, translated);
  });

  return result;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/weather/kathmandu', async (req: Request, res: Response) => {
    try {
      const forceRefresh = req.query.refresh === 'true';
      if (
        !forceRefresh &&
        cachedWeather &&
        Date.now() - cachedWeather.fetchedAt < CACHE_TTL_MS
      ) {
        res.json({
          ...cachedWeather.data,
          cached: true,
        });
        return;
      }

      const weather = await fetchKathmanduWeather();
      cachedWeather = {
        data: weather,
        fetchedAt: Date.now(),
      };
      res.json({
        ...weather,
        cached: false,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to fetch Kathmandu weather via Google Search grounding.';
      const status =
        message.includes('PERMISSION_DENIED') || message.includes('API_KEY')
          ? 403
          : 500;
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/translate', async (req: Request, res: Response) => {
    try {
      const body = req.body as {
        targetLanguage?: string;
        items?: Record<string, unknown>;
      };

      const targetLanguage = body?.targetLanguage;
      if (
        targetLanguage !== 'fr' &&
        targetLanguage !== 'es' &&
        targetLanguage !== 'ja' &&
        targetLanguage !== 'zh' &&
        targetLanguage !== 'pt'
      ) {
        res.status(400).json({
          error:
            'Invalid targetLanguage. Supported languages: fr, es, ja, zh, pt.',
        });
        return;
      }

      const rawItems = body?.items;
      if (!rawItems || typeof rawItems !== 'object') {
        res.status(400).json({ error: 'Missing items dictionary to translate.' });
        return;
      }

      const translations: Record<string, string> = {};
      const uncachedEntries: Array<[string, string]> = [];

      for (const [key, val] of Object.entries(rawItems)) {
        if (typeof val !== 'string') continue;
        const trimmed = val.trim();
        if (!trimmed) {
          translations[key] = val;
          continue;
        }
        const cached = translationCache.get(`${targetLanguage}:${trimmed}`);
        if (cached) {
          translations[key] = cached;
        } else {
          uncachedEntries.push([key, trimmed]);
        }
      }

      // Translate uncached entries in chunks of 30 for clean reliability
      const CHUNK_SIZE = 30;
      for (let i = 0; i < uncachedEntries.length; i += CHUNK_SIZE) {
        const chunk = uncachedEntries.slice(i, i + CHUNK_SIZE);
        const chunkResult = await translateBatchWithGemini(targetLanguage, chunk);
        Object.assign(translations, chunkResult);
      }

      res.json({
        targetLanguage,
        translations,
        cachedCount: Object.keys(translations).length - uncachedEntries.length,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to translate heritage content.';
      const status =
        message.includes('PERMISSION_DENIED') || message.includes('API_KEY')
          ? 403
          : 500;
      res.status(status).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kathmandu Heritage Atlas server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
