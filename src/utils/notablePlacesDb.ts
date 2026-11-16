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
import { db, handleFirestoreError, OperationType } from './testimonialsDb';

export const ADMIN_EMAIL = 'antiquitynepal@gmail.com';
const COLLECTION_NAME = 'notable_places';

export type NotablePlaceCategory =
  | 'Hindu Sanctuary'
  | 'Living Tradition'
  | 'Buddhist Site'
  | 'Historic Town'
  | 'Cultural Landmark';

export interface NotablePlaceDoc {
  id: string;
  authorUid: string;
  name: string;
  location: string;
  category: NotablePlaceCategory;
  era: string;
  image: string;
  distanceKm: number;
  distanceLabel: string;
  walkingDistance: string;
  transportation: string;
  commodities: string[];
  mapPos: { x: number; y: number };
}

export interface NewNotablePlaceInput {
  authorUid: string;
  name: string;
  location: string;
  category: NotablePlaceCategory;
  era: string;
  image: string;
  distanceKm: number;
  distanceLabel: string;
  walkingDistance: string;
  transportation: string;
  commodities: string[];
  mapX: number;
  mapY: number;
  history: string;
  visitingNote: string;
}

export interface PublishedNotablePlace extends NotablePlaceDoc {
  history: string;
  visitingNote: string;
  isDefault: false;
}

function clampStr(raw: string, max: number): string {
  return raw.trim().slice(0, max);
}

export function isVerifiedAdminEmail(email?: string | null, emailVerified?: boolean | null): boolean {
  return Boolean(emailVerified && email && email.toLowerCase() === ADMIN_EMAIL);
}

export function subscribePublicNotablePlaces(
  onData: (items: PublishedNotablePlace[]) => void,
  onError: (err: Error) => void
): () => void {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('visibility', '==', 'public')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const rows: Array<{ item: PublishedNotablePlace; createdMs: number }> = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data() as Record<string, unknown>;
        const createdTs = d.createdAt;
        const createdMs = createdTs instanceof Timestamp ? createdTs.toMillis() : 0;

        const categoryVal = d.category as NotablePlaceCategory;
        const validCategory: NotablePlaceCategory =
          categoryVal === 'Hindu Sanctuary' ||
          categoryVal === 'Living Tradition' ||
          categoryVal === 'Buddhist Site' ||
          categoryVal === 'Historic Town' ||
          categoryVal === 'Cultural Landmark'
            ? categoryVal
            : 'Cultural Landmark';

        const rawCommodities = Array.isArray(d.commodities)
          ? d.commodities.filter((c): c is string => typeof c === 'string' && c.trim().length > 0).slice(0, 12)
          : ['Local tea shops', 'Drinking water access'];

        rows.push({
          createdMs,
          item: {
            id: typeof d.id === 'string' ? d.id : docSnap.id,
            authorUid: typeof d.authorUid === 'string' ? d.authorUid : '',
            name: typeof d.name === 'string' ? d.name : 'Heritage Site',
            location: typeof d.location === 'string' ? d.location : 'Kathmandu Valley',
            category: validCategory,
            era: typeof d.era === 'string' ? d.era : 'Kathmandu Valley Heritage',
            image: typeof d.image === 'string' ? d.image : 'preset:budhanilkantha',
            distanceKm: typeof d.distanceKm === 'number' ? d.distanceKm : 3.5,
            distanceLabel:
              typeof d.distanceLabel === 'string' ? d.distanceLabel : 'Kathmandu Basin',
            walkingDistance:
              typeof d.walkingDistance === 'string' ? d.walkingDistance : 'Accessible on foot',
            transportation:
              typeof d.transportation === 'string' ? d.transportation : 'Local bus or taxi',
            commodities: rawCommodities.length > 0 ? rawCommodities : ['Resting pavilion'],
            mapPos: {
              x: typeof d.mapX === 'number' ? Math.min(950, Math.max(50, d.mapX)) : 465,
              y: typeof d.mapY === 'number' ? Math.min(390, Math.max(40, d.mapY)) : 232,
            },
            history: typeof d.history === 'string' ? d.history : '',
            visitingNote:
              typeof d.visitingNote === 'string' ? d.visitingNote : 'Open daily during daylight hours.',
            isDefault: false,
          },
        });
      });

      rows.sort((a, b) => b.createdMs - a.createdMs);
      onData(rows.map((r) => r.item));
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

export async function publishNotablePlace(input: NewNotablePlaceInput): Promise<string> {
  const safeUid = input.authorUid.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 48) || 'admin';
  const rand = Math.random().toString(36).slice(2, 8);
  const placeId = `place_${safeUid}_${Date.now()}_${rand}`;
  const path = `${COLLECTION_NAME}/${placeId}`;

  const cleanCommodities = input.commodities
    .map((c) => clampStr(c, 120))
    .filter(Boolean)
    .slice(0, 12);
  if (cleanCommodities.length === 0) {
    cleanCommodities.push('Local tea shops', 'Resting pavilion');
  }

  const payload = {
    id: placeId,
    authorUid: input.authorUid,
    name: clampStr(input.name, 120),
    location: clampStr(input.location, 140),
    category: input.category,
    era: clampStr(input.era || 'Kathmandu Valley Heritage', 120),
    image: clampStr(input.image || 'preset:budhanilkantha', 500),
    distanceKm: Number(Math.min(100, Math.max(0.1, input.distanceKm)).toFixed(1)),
    distanceLabel: clampStr(input.distanceLabel, 100),
    walkingDistance: clampStr(input.walkingDistance, 260),
    transportation: clampStr(input.transportation, 260),
    commodities: cleanCommodities,
    mapX: Math.round(Math.min(950, Math.max(50, input.mapX))),
    mapY: Math.round(Math.min(390, Math.max(40, input.mapY))),
    history: clampStr(input.history, 2000),
    visitingNote: clampStr(input.visitingNote || 'Open daily during daylight hours.', 400),
    visibility: 'public' as const,
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, COLLECTION_NAME, placeId), payload);
    return placeId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function removeNotablePlace(placeId: string): Promise<void> {
  const path = `${COLLECTION_NAME}/${placeId}`;
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, placeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
