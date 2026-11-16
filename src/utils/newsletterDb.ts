import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './testimonialsDb';

const COLLECTION_NAME = 'newsletter_subscribers';

// Synchronized verbatim with firebase-blueprint.json NewsletterSubscriber schema
export const MAX_EMAIL_LENGTH = 160;
export const EMAIL_PATTERN = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

export type SupportedNewsletterLocale = 'en' | 'fr' | 'es' | 'ja' | 'zh' | 'pt';

export function normalizeAndValidateEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (email.length < 5 || email.length > MAX_EMAIL_LENGTH) return null;
  if (!EMAIL_PATTERN.test(email)) return null;
  return email;
}

function generateSubscriberId(): string {
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)
      : Math.random().toString(36).slice(2, 12);
  return `sub_${Date.now()}_${rand}`;
}

export async function subscribeToNewsletter(
  rawEmail: string,
  locale: SupportedNewsletterLocale
): Promise<{ subscriberId: string; email: string }> {
  const email = normalizeAndValidateEmail(rawEmail);
  if (!email) {
    throw new Error('INVALID_EMAIL');
  }

  const subscriberId = generateSubscriberId();
  const path = `${COLLECTION_NAME}/${subscriberId}`;

  const payload = {
    id: subscriberId,
    email,
    locale,
    source: 'footer' as const,
    status: 'active' as const,
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, COLLECTION_NAME, subscriberId), payload);
    return { subscriberId, email };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}
