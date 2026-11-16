import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocFromServer,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { VisitType, VisitorTestimonial } from '../data/testimonials';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore once on startup
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

const COLLECTION_NAME = 'visitor_testimonials';

function sanitizeIdPart(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 60);
  return cleaned || 'story';
}

function clampString(val: string, maxLen: number): string {
  return val.trim().slice(0, maxLen);
}

export function subscribePublicTestimonials(
  onData: (items: VisitorTestimonial[]) => void,
  onError: (err: Error) => void
): () => void {
  // Single equality filter needs no manual composite index and satisfies rules (`resource.data.visibility == 'public'`)
  const q = query(
    collection(db, COLLECTION_NAME),
    where('visibility', '==', 'public')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const rows: Array<{ item: VisitorTestimonial; createdMs: number }> = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data() as Record<string, unknown>;
        const createdTs = d.createdAt;
        const createdMs = createdTs instanceof Timestamp ? createdTs.toMillis() : 0;
        let visitLabel =
          typeof d.visitDateLabel === 'string' && d.visitDateLabel.trim()
            ? d.visitDateLabel
            : 'Recent Visit';

        if (!d.visitDateLabel && createdTs instanceof Timestamp) {
          visitLabel = createdTs.toDate().toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          });
        }

        rows.push({
          createdMs,
          item: {
            id: typeof d.id === 'string' ? d.id : docSnap.id,
            authorUid: typeof d.authorUid === 'string' ? d.authorUid : '',
            visitorName:
              typeof d.visitorName === 'string' ? d.visitorName : 'Kathmandu Traveler',
            originCountry:
              typeof d.originCountry === 'string' ? d.originCountry : 'International',
            visitType:
              d.visitType === 'Returning Explorer'
                ? 'Returning Explorer'
                : 'First-Time Visitor',
            visitedSiteId:
              typeof d.visitedSiteId === 'string' ? d.visitedSiteId : 'swayambhunath',
            visitedSiteName:
              typeof d.visitedSiteName === 'string'
                ? d.visitedSiteName
                : 'Kathmandu Valley',
            visitDateLabel: visitLabel,
            rating: typeof d.rating === 'number' ? Math.min(5, Math.max(1, d.rating)) : 5,
            headline: typeof d.headline === 'string' ? d.headline : '',
            story: typeof d.story === 'string' ? d.story : '',
            adviceForFirstTimers:
              typeof d.adviceForFirstTimers === 'string' ? d.adviceForFirstTimers : '',
            isCuratedEditorial: false,
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

export interface NewTestimonialInput {
  authorUid: string;
  visitorName: string;
  originCountry: string;
  visitType: VisitType;
  visitedSiteId: string;
  visitedSiteName: string;
  visitDateLabel: string;
  rating: number;
  headline: string;
  story: string;
  adviceForFirstTimers: string;
}

export async function publishTestimonial(input: NewTestimonialInput): Promise<string> {
  const safeUid = sanitizeIdPart(input.authorUid);
  const testimonialId = `${safeUid}_${Date.now()}`;
  const path = `${COLLECTION_NAME}/${testimonialId}`;

  const payload = {
    id: testimonialId,
    authorUid: input.authorUid,
    visitorName: clampString(input.visitorName, 80),
    originCountry: clampString(input.originCountry, 60),
    visitType: input.visitType,
    visitedSiteId: clampString(input.visitedSiteId, 80),
    visitedSiteName: clampString(input.visitedSiteName, 120),
    visitDateLabel: clampString(input.visitDateLabel || 'November 2026', 40),
    rating: Math.round(Math.min(5, Math.max(1, input.rating))),
    headline: clampString(input.headline, 140),
    story: clampString(input.story, 1600),
    adviceForFirstTimers: clampString(input.adviceForFirstTimers, 400),
    visibility: 'public',
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, COLLECTION_NAME, testimonialId), payload);
    return testimonialId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function removeOwnTestimonial(testimonialId: string): Promise<void> {
  const path = `${COLLECTION_NAME}/${testimonialId}`;
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, testimonialId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
