import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import { HeritageCategory, HeritageSite } from '../data/heritageSites';
import { db, handleFirestoreError, OperationType } from './testimonialsDb';

import budhanilkanthaImg from '../assets/images/budhanilkantha_temple_real.jpg';
import kumariGharImg from '../assets/images/kumari_ghar_real.jpg';
import kirtipurImg from '../assets/images/kirtipur_bagh_bhairab_real.jpg';
import kopanImg from '../assets/images/kopan_monastery_real.jpg';
import kathmanduDurbarImg from '../assets/images/kathmandu_durbar_panorama_1794711180968.jpg';
import swayambhunathImg from '../assets/images/swayambhunath_panorama_1794711182286.jpg';
import boudhanathImg from '../assets/images/boudhanath_panorama_1794711181887.jpg';
import pashupatinathImg from '../assets/images/pashupatinath_panorama_1794711183372.jpg';

const COLLECTION_NAME = 'managed_heritage_sites';

export const HERITAGE_CATEGORIES: HeritageCategory[] = [
  'Royal Plaza',
  'Buddhist Stupa',
  'Hindu Sanctuary',
  'Hilltop Shrine',
];

export interface PresetHeritagePhoto {
  key: string;
  label: string;
  src: string;
}

export const HERITAGE_IMAGE_PRESETS: PresetHeritagePhoto[] = [
  { key: 'preset:budhanilkantha', label: 'Budhanilkantha Sanctuary (CC BY-SA)', src: budhanilkanthaImg },
  { key: 'preset:kumari-ghar', label: 'Kumari Ghar Courtyard (CC BY-SA)', src: kumariGharImg },
  { key: 'preset:kirtipur', label: 'Kirtipur Bagh Bhairab (CC BY-SA)', src: kirtipurImg },
  { key: 'preset:kopan', label: 'Kopan Monastery Ridge (CC BY-SA)', src: kopanImg },
  { key: 'preset:durbar', label: 'Kathmandu Palace Courtyard', src: kathmanduDurbarImg },
  { key: 'preset:swayambhunath', label: 'Swayambhunath Ridge Panorama', src: swayambhunathImg },
  { key: 'preset:boudhanath', label: 'Boudhanath Stupa Kora', src: boudhanathImg },
  { key: 'preset:pashupatinath', label: 'Bagmati Riverfront Shrines', src: pashupatinathImg },
];

const WATERMARKED_STOCK_HOSTS = [
  'shutterstock',
  'gettyimages',
  'istockphoto',
  'alamy',
  '123rf',
  'dreamstime',
  'depositphotos',
  'vecteezy',
  'bigstockphoto',
  'pond5',
];

export function resolveHeritageImageSrc(value: string): string {
  const trimmed = value.trim();
  const preset = HERITAGE_IMAGE_PRESETS.find((p) => p.key === trimmed);
  if (preset) return preset.src;
  return trimmed;
}

export function validateHeritageImageUrl(raw: string): { valid: boolean; reason?: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { valid: false, reason: 'Image URL cannot be empty.' };
  if (HERITAGE_IMAGE_PRESETS.some((p) => p.key === trimmed)) {
    return { valid: true };
  }
  const lower = trimmed.toLowerCase();
  if (WATERMARKED_STOCK_HOSTS.some((host) => lower.includes(host))) {
    return {
      valid: false,
      reason: 'Watermarked commercial stock URLs are blocked. Please use a royalty-free original HTTPS image URL or preset.',
    };
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { valid: false, reason: 'Image URL must begin with https://' };
    }
    return { valid: true };
  } catch {
    return { valid: false, reason: `"${trimmed.slice(0, 40)}" is not a valid image URL.` };
  }
}

export interface ManagedHeritageRecord {
  id: string;
  authorUid: string;
  actionType: 'add' | 'hide';
  targetSiteId: string;
  name: string;
  category: HeritageCategory;
  imageUrls: string[];
  description: string;
  district: string;
  era: string;
  createdMs: number;
}

export interface AddHeritageSiteInput {
  authorUid: string;
  name: string;
  category: HeritageCategory;
  imageUrls: string[];
  description: string;
  district?: string;
  era?: string;
}

function clampStr(val: string, max: number): string {
  return val.trim().slice(0, max);
}

function slugifySiteName(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return base || 'heritage-site';
}

export function subscribeManagedHeritageSites(
  onData: (records: ManagedHeritageRecord[]) => void,
  onError: (err: Error) => void
): () => void {
  const q = query(collection(db, COLLECTION_NAME), where('visibility', '==', 'public'));

  return onSnapshot(
    q,
    (snapshot) => {
      const records: ManagedHeritageRecord[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data() as Record<string, unknown>;
        const createdTs = d.createdAt;
        const createdMs = createdTs instanceof Timestamp ? createdTs.toMillis() : 0;

        const rawCategory = d.category as HeritageCategory;
        const validCategory: HeritageCategory = HERITAGE_CATEGORIES.includes(rawCategory)
          ? rawCategory
          : 'Royal Plaza';

        const actionType: 'add' | 'hide' = d.actionType === 'hide' ? 'hide' : 'add';
        const rawImages = Array.isArray(d.imageUrls)
          ? d.imageUrls.filter((u): u is string => typeof u === 'string' && u.trim().length > 0).slice(0, 5)
          : ['preset:budhanilkantha'];

        records.push({
          id: typeof d.id === 'string' ? d.id : docSnap.id,
          authorUid: typeof d.authorUid === 'string' ? d.authorUid : '',
          actionType,
          targetSiteId: typeof d.targetSiteId === 'string' ? d.targetSiteId : docSnap.id,
          name: typeof d.name === 'string' ? d.name : 'Heritage Monument',
          category: validCategory,
          imageUrls: rawImages.length > 0 ? rawImages : ['preset:budhanilkantha'],
          description: typeof d.description === 'string' ? d.description : '',
          district: typeof d.district === 'string' && d.district ? d.district : 'Kathmandu Valley',
          era: typeof d.era === 'string' && d.era ? d.era : 'Historic Kathmandu Valley',
          createdMs,
        });
      });

      records.sort((a, b) => a.createdMs - b.createdMs);
      onData(records);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function addManagedHeritageSite(input: AddHeritageSiteInput): Promise<string> {
  const slugBase = slugifySiteName(input.name);
  const rand = Math.random().toString(36).slice(2, 6);
  const recordId = `site_${slugBase}_${Date.now()}_${rand}`.slice(0, 120);
  const path = `${COLLECTION_NAME}/${recordId}`;

  const cleanUrls = input.imageUrls
    .map((u) => clampStr(u, 600))
    .filter(Boolean)
    .slice(0, 5);
  if (cleanUrls.length === 0) {
    cleanUrls.push('preset:budhanilkantha');
  }

  const payload = {
    id: recordId,
    authorUid: input.authorUid,
    actionType: 'add' as const,
    targetSiteId: `${slugBase}-${rand}`,
    name: clampStr(input.name, 140),
    category: input.category,
    imageUrls: cleanUrls,
    description: clampStr(input.description, 2000),
    district: clampStr(input.district || 'Kathmandu Valley · Curated Addition', 140),
    era: clampStr(input.era || 'Kathmandu Valley Heritage', 120),
    visibility: 'public' as const,
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, COLLECTION_NAME, recordId), payload);
    return recordId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function hideBuiltInHeritageSite(
  authorUid: string,
  builtInSite: HeritageSite
): Promise<string> {
  const recordId = `hide_${builtInSite.id}`.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120);
  const path = `${COLLECTION_NAME}/${recordId}`;

  const payload = {
    id: recordId,
    authorUid,
    actionType: 'hide' as const,
    targetSiteId: builtInSite.id,
    name: clampStr(builtInSite.name, 140),
    category: builtInSite.category,
    imageUrls: ['preset:durbar'],
    description: clampStr(builtInSite.summary, 2000),
    district: clampStr(builtInSite.district, 140),
    era: clampStr(builtInSite.era, 120),
    visibility: 'public' as const,
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, COLLECTION_NAME, recordId), payload);
    return recordId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function removeManagedHeritageRecord(recordId: string): Promise<void> {
  const path = `${COLLECTION_NAME}/${recordId}`;
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, recordId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function hydrateManagedHeritageSite(record: ManagedHeritageRecord): HeritageSite {
  const resolvedImages = record.imageUrls.map(resolveHeritageImageSrc);
  const primaryImage = resolvedImages[0] || budhanilkanthaImg;
  const siteId = record.targetSiteId;
  const desc = record.description.trim();

  // Compute deterministic coordinates inside Kathmandu Basin bounds for SVG Route Map placement
  let hash = 0;
  for (let i = 0; i < siteId.length; i++) {
    hash = (hash * 31 + siteId.charCodeAt(i)) % 10000;
  }
  const mapX = 280 + (hash % 390);
  const mapY = 120 + (Math.floor(hash / 7) % 190);
  const lat = Number((27.67 + ((hash % 80) / 1000)).toFixed(4));
  const lng = Number((85.29 + (((hash >> 3) % 90) / 1000)).toFixed(4));

  return {
    id: siteId,
    slug: siteId,
    name: record.name,
    nativeName: record.name,
    district: record.district || 'Kathmandu Valley · Curated Addition',
    category: record.category,
    era: record.era || 'Kathmandu Valley Heritage',
    foundedYear: record.era || 'Curated Entry',
    elevationMeters: 1365,
    coordinates: {
      lat,
      lng,
      label: `${lat}° N, ${lng}° E`,
    },
    mapPos: {
      x: mapX,
      y: mapY,
    },
    unescoRef: 'Antiquity Nepal Curated',
    visitingHours: 'Daily · 06:00 – 18:00 NPT',
    entryFees: {
      foreign: 'NPR 500–1,000 (Site Dependent)',
      saarc: 'NPR 150–300',
      nepali: 'Free',
    },
    panoramaImage: primaryImage,
    galleryImages: resolvedImages,
    summary: desc,
    quote: {
      text: desc.length > 160 ? `${desc.slice(0, 157)}...` : desc,
      attribution: `Curated by ${record.district || 'Antiquity Nepal'}`,
    },
    historicalEssay: [desc],
    viewpoints: [
      {
        id: `${siteId}-courtyard`,
        title: `${record.name} — Courtyard View`,
        subtitle: `${record.category} · 360° Horizon Inspection`,
        initialYaw: 0,
        initialPitch: 2,
        defaultFov: 74,
        atmosphereTint: 'golden',
      },
    ],
    hotspots: [
      {
        id: `${siteId}-main-sanctuary`,
        viewpointId: `${siteId}-courtyard`,
        yaw: 12,
        pitch: 4,
        title: `${record.name} Precinct`,
        category: record.category,
        period: record.era || 'Kathmandu Heritage',
        description: desc,
        architecturalNote: `Categorized under ${record.category} in ${record.district}.`,
        audioChapterIndex: 0,
      },
    ],
    routes: [
      {
        id: `${siteId}-walk`,
        mode: 'Walking Trail',
        origin: 'Thamel / Basantapur Central Hub',
        distanceKm: 3.2,
        durationMin: 38,
        elevationGainM: 45,
        difficulty: 'Gentle',
        bestWindow: '06:30 – 09:00 NPT',
        overview: `Direct pedestrian approach linking central Kathmandu lanes with ${record.name}.`,
        waypoints: [
          {
            step: 1,
            landmark: 'Central Kathmandu Chowk',
            instruction: `Proceed along the valley heritage corridor toward ${record.district}.`,
          },
          {
            step: 2,
            landmark: `${record.name} Entrance`,
            instruction: `Arrive at the main sanctuary threshold of ${record.name}.`,
          },
        ],
      },
      {
        id: `${siteId}-taxi`,
        mode: 'Taxi / Cycle',
        origin: 'Central Kathmandu / Durbar Marg',
        distanceKm: 4.5,
        durationMin: 18,
        elevationGainM: 45,
        difficulty: 'Gentle',
        bestWindow: 'Morning or Late Afternoon',
        overview: `Quick vehicle or cycle transfer to ${record.name} perimeter.`,
        waypoints: [
          {
            step: 1,
            landmark: 'Valley Ring / Arterial Road',
            instruction: `Take local road directly toward ${record.district}.`,
          },
        ],
      },
    ],
    timeline: [
      {
        year: record.era || 'Historic Era',
        era: record.category,
        title: `${record.name} Recorded in Valley Atlas`,
        detail: desc,
      },
    ],
    architecturalFeatures: [
      {
        name: `${record.name} Primary Ensemble`,
        material: 'Brick, carved timber & dressed stone',
        detail: desc,
      },
    ],
    audioChapters: [
      {
        id: `${siteId}-ch1`,
        number: '01',
        title: `Introduction to ${record.name}`,
        durationSec: 120,
        narratorRole: 'Antiquity Nepal Field Curators',
        ambientProfile:
          record.category === 'Buddhist Stupa' ? 'singing-bowl' : 'temple-bells',
        script: [desc],
      },
    ],
    visitorNotes: {
      dressCode: 'Modest shoulders and knees recommended; remove leather footwear inside inner shrines.',
      etiquette: 'Circumambulate stupas clockwise and observe quiet reverence around active shrines.',
      photography: 'Exterior courtyard photography permitted unless otherwise signed.',
      majorFestival: 'Indra Jatra, Buddha Jayanti & seasonal valley processions',
    },
  };
}
