import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import {
  Check,
  FileText,
  Inbox,
  LogOut,
  Mail,
  MailOpen,
  RefreshCw,
  Search,
  Send,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import {
  clearAccessToken,
  getAccessToken,
  googleSignIn,
  initAuth,
  logout,
} from '../utils/googleAuth';
import { GoogleSignInButton } from './GoogleSignInButton';
import { HeritageSite } from '../data/heritageSites';
import { useHeritageSites } from '../utils/heritageSitesContext';

interface GmailHeader {
  name: string;
  value: string;
}

interface GmailMessagePart {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailMessagePart[];
}

interface GmailMessageRaw {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  internalDate?: string;
  payload?: {
    headers?: GmailHeader[];
    mimeType?: string;
    body?: { data?: string };
    parts?: GmailMessagePart[];
  };
}

interface ParsedEmail {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  snippet: string;
  bodyText: string;
  isUnread: boolean;
  isStarred: boolean;
  labelIds: string[];
}

type MailboxFilter = 'INBOX' | 'SENT' | 'DRAFT' | 'STARRED';

type PendingGmailMutation =
  | {
      type: 'send';
      to: string;
      subject: string;
      body: string;
    }
  | {
      type: 'draft';
      to: string;
      subject: string;
      body: string;
    }
  | {
      type: 'trash';
      message: ParsedEmail;
    }
  | {
      type: 'modify';
      message: ParsedEmail;
      actionLabel: string;
      addLabelIds?: string[];
      removeLabelIds?: string[];
    };

interface HeritageGmailPanelProps {
  focusedSite?: HeritageSite | null;
}

function decodeBase64Url(input: string): string {
  try {
    const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
    const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
    const binary = atob(normalized + pad);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    return '';
  }
}

function encodeBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function extractPlainTextBody(payload?: GmailMessageRaw['payload']): string {
  if (!payload) return '';
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }
  const stack: GmailMessagePart[] = [...(payload.parts ?? [])];
  while (stack.length > 0) {
    const part = stack.shift();
    if (!part) continue;
    if (part.mimeType === 'text/plain' && part.body?.data) {
      return decodeBase64Url(part.body.data);
    }
    if (part.parts) {
      stack.push(...part.parts);
    }
  }
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data).replace(/<[^>]+>/g, ' ').trim();
  }
  return '';
}

function buildSiteItineraryDraft(site: HeritageSite): {
  subject: string;
  body: string;
} {
  const walk = site.routes[0];
  const transit = site.routes[1];
  const originUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?site=${site.slug}`
      : `?site=${site.slug}`;

  return {
    subject: `Kathmandu Heritage Trail: ${site.name} (${site.foundedYear})`,
    body: [
      `Namaste!`,
      ``,
      `Here is the Kathmandu Heritage Atlas dossier for ${site.name} (${site.nativeName}):`,
      `District: ${site.district} · Elev. ${site.elevationMeters}m`,
      `Visiting Hours: ${site.visitingHours}`,
      `Entry Fees: Foreign ${site.entryFees.foreign} | SAARC ${site.entryFees.saarc} | Nepali ${site.entryFees.nepali}`,
      ``,
      `Recommended Routes:`,
      walk
        ? `• ${walk.mode} from ${walk.origin}: ${walk.distanceKm} km (~${walk.durationMin} min) — ${walk.bestWindow}`
        : '',
      transit
        ? `• ${transit.mode} from ${transit.origin}: ${transit.distanceKm} km (~${transit.durationMin} min)`
        : '',
      ``,
      `Audio Guide Chapters (${site.audioChapters.length}):`,
      ...site.audioChapters.map(
        (ch, idx) => `  0${idx + 1}. ${ch.title}`
      ),
      ``,
      `Launch Interactive 360° Tour & Map:`,
      originUrl,
      ``,
      `— Sent via Suraj Giri's Kathmandu Heritage Atlas (Antiquity Nepal)`,
    ]
      .filter((line) => line !== undefined)
      .join('\n'),
  };
}

export const HeritageGmailPanel: React.FC<HeritageGmailPanelProps> = ({
  focusedSite,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [needsAuth, setNeedsAuth] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [mailboxFilter, setMailboxFilter] = useState<MailboxFilter>('INBOX');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [messages, setMessages] = useState<ParsedEmail[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const { sites } = useHeritageSites();

  // Composer state
  const initialDraftSite = focusedSite ?? sites[0];
  const [composerSiteId, setComposerSiteId] = useState<string>(
    initialDraftSite?.id ?? ''
  );
  const [composeTo, setComposeTo] = useState<string>('');
  const [composeSubject, setComposeSubject] = useState<string>(() =>
    initialDraftSite
      ? buildSiteItineraryDraft(initialDraftSite).subject
      : 'Kathmandu Valley Heritage Trail Notes'
  );
  const [composeBody, setComposeBody] = useState<string>(() =>
    initialDraftSite
      ? buildSiteItineraryDraft(initialDraftSite).body
      : ''
  );
  const [composerError, setComposerError] = useState<string | null>(null);

  // Explicit confirmation dialog before any Gmail mutation (send, draft, trash, modify)
  const [pendingMutation, setPendingMutation] =
    useState<PendingGmailMutation | null>(null);
  const [isMutating, setIsMutating] = useState<boolean>(false);

  const applySiteTemplate = useCallback(
    (siteId: string) => {
      setComposerSiteId(siteId);
      const site = sites.find((s) => s.id === siteId) ?? sites[0];
      if (!site) return;
      const template = buildSiteItineraryDraft(site);
      setComposeSubject(template.subject);
      setComposeBody(template.body);
    },
    [sites]
  );

  useEffect(() => {
    if (focusedSite) {
      applySiteTemplate(focusedSite.id);
    }
  }, [focusedSite, applySiteTemplate]);

  const fetchGmailMessages = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }

    setLoadingMessages(true);
    setApiError(null);
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const listParams = new URLSearchParams({
        maxResults: '12',
        labelIds: mailboxFilter,
      });
      if (searchQuery.trim()) {
        listParams.set('q', searchQuery.trim());
      }

      const listRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?${listParams.toString()}`,
        { headers }
      );

      if (listRes.status === 401) {
        clearAccessToken();
        setNeedsAuth(true);
        setLoadingMessages(false);
        return;
      }

      if (!listRes.ok) {
        const errBody = await listRes.json().catch(() => ({}));
        throw new Error(
          errBody?.error?.message ||
            `Gmail request returned status ${listRes.status}.`
        );
      }

      const listData = (await listRes.json()) as {
        messages?: { id: string; threadId: string }[];
      };
      const refs = listData.messages ?? [];

      if (refs.length === 0) {
        setMessages([]);
        setSelectedMessageId(null);
        setLoadingMessages(false);
        return;
      }

      const detailedResults = await Promise.allSettled(
        refs.map((ref) =>
          fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${ref.id}?format=full`,
            { headers }
          ).then(async (r) => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return (await r.json()) as GmailMessageRaw;
          })
        )
      );

      const parsed: ParsedEmail[] = [];
      for (const item of detailedResults) {
        if (item.status !== 'fulfilled') continue;
        const msg = item.value;
        const hdrs = msg.payload?.headers ?? [];
        const getHdr = (name: string) =>
          hdrs.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ||
          '';
        const labels = msg.labelIds ?? [];
        const plainBody = extractPlainTextBody(msg.payload);

        parsed.push({
          id: msg.id,
          threadId: msg.threadId,
          from: getHdr('From') || 'Unknown Sender',
          to: getHdr('To') || '',
          subject: getHdr('Subject') || '(No Subject)',
          date: getHdr('Date') || '',
          snippet: msg.snippet || '',
          bodyText: plainBody || msg.snippet || '',
          isUnread: labels.includes('UNREAD'),
          isStarred: labels.includes('STARRED'),
          labelIds: labels,
        });
      }

      setMessages(parsed);
      setSelectedMessageId((prev) =>
        prev && parsed.some((m) => m.id === prev) ? prev : parsed[0]?.id ?? null
      );
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : 'Unable to fetch Gmail messages.'
      );
    } finally {
      setLoadingMessages(false);
    }
  }, [mailboxFilter, searchQuery]);

  useEffect(() => {
    const unsubscribe = initAuth(
      (authedUser) => {
        setUser(authedUser);
        setNeedsAuth(false);
        void fetchGmailMessages();
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, [fetchGmailMessages]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setNeedsAuth(false);
        await fetchGmailMessages();
      }
    } catch (err) {
      setAuthError(
        err instanceof Error
          ? err.message
          : 'Google sign-in was cancelled or failed.'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setMessages([]);
    setSelectedMessageId(null);
    setNeedsAuth(true);
  };

  const selectedMessage = useMemo(
    () => messages.find((m) => m.id === selectedMessageId) ?? null,
    [messages, selectedMessageId]
  );

  const requestSendOrDraft = (mode: 'send' | 'draft') => {
    setComposerError(null);
    const trimmedTo = composeTo.trim();
    const trimmedSubject = composeSubject.trim();
    const trimmedBody = composeBody.trim();

    if (mode === 'send' && !trimmedTo) {
      setComposerError('Please enter at least one recipient email address.');
      return;
    }
    if (!trimmedSubject) {
      setComposerError('Please enter an email subject line.');
      return;
    }
    if (!trimmedBody) {
      setComposerError('Please enter a message body.');
      return;
    }

    setPendingMutation({
      type: mode,
      to: trimmedTo,
      subject: trimmedSubject,
      body: trimmedBody,
    });
  };

  const buildRawMimeEmail = (to: string, subject: string, body: string) => {
    const encodedSubject = `=?UTF-8?B?${btoa(
      unescape(encodeURIComponent(subject))
    )}?=`;
    const lines = [
      to ? `To: ${to}` : '',
      `Subject: ${encodedSubject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: 8bit',
      '',
      body,
    ]
      .filter((line, idx) => idx > 0 || line !== '')
      .join('\r\n');

    return encodeBase64Url(lines);
  };

  const executeConfirmedMutation = async () => {
    if (!pendingMutation) return;
    const token = getAccessToken();
    if (!token) {
      setPendingMutation(null);
      setNeedsAuth(true);
      return;
    }

    setIsMutating(true);
    setApiError(null);
    setStatusNotice(null);

    try {
      if (pendingMutation.type === 'send') {
        const raw = buildRawMimeEmail(
          pendingMutation.to,
          pendingMutation.subject,
          pendingMutation.body
        );
        const res = await fetch(
          'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ raw }),
          }
        );
        if (res.status === 401) {
          clearAccessToken();
          setNeedsAuth(true);
          return;
        }
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error?.message || 'Failed to send email via Gmail.');
        }
        setStatusNotice(`Email sent to ${pendingMutation.to}.`);
        setComposeTo('');
      } else if (pendingMutation.type === 'draft') {
        const raw = buildRawMimeEmail(
          pendingMutation.to,
          pendingMutation.subject,
          pendingMutation.body
        );
        const res = await fetch(
          'https://gmail.googleapis.com/gmail/v1/users/me/drafts',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: { raw } }),
          }
        );
        if (res.status === 401) {
          clearAccessToken();
          setNeedsAuth(true);
          return;
        }
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error?.message || 'Failed to save Gmail draft.');
        }
        setStatusNotice(`Saved “${pendingMutation.subject}” to your Gmail Drafts.`);
      } else if (pendingMutation.type === 'trash') {
        const res = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${pendingMutation.message.id}/trash`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.status === 401) {
          clearAccessToken();
          setNeedsAuth(true);
          return;
        }
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error?.message || 'Failed to move message to Trash.');
        }
        setStatusNotice(`Moved “${pendingMutation.message.subject}” to Trash.`);
      } else if (pendingMutation.type === 'modify') {
        const res = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${pendingMutation.message.id}/modify`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              addLabelIds: pendingMutation.addLabelIds ?? [],
              removeLabelIds: pendingMutation.removeLabelIds ?? [],
            }),
          }
        );
        if (res.status === 401) {
          clearAccessToken();
          setNeedsAuth(true);
          return;
        }
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error?.message || 'Failed to update Gmail labels.');
        }
        setStatusNotice(`Updated message (${pendingMutation.actionLabel}).`);
      }

      setPendingMutation(null);
      await fetchGmailMessages();
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : 'Gmail action failed.'
      );
      setPendingMutation(null);
    } finally {
      setIsMutating(false);
    }
  };

  if (needsAuth) {
    return (
      <div className="rounded-lg border border-stone-300 bg-[#EFEAE1] p-6 sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-medium text-[#9A3412]">
              Google Workspace · Gmail Integration
            </p>
            <h3 className="mt-1 font-serif text-2xl sm:text-3xl font-semibold text-[#1C1917]">
              Dispatch Heritage Itineraries &amp; Read Travel Mail
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-700">
              Connect your Gmail account to browse booking confirmations and guide correspondence, draft or send Kathmandu heritage trail dossiers, and manage labels—with explicit confirmation before every outgoing email or change.
            </p>
            {authError && (
              <p className="mt-3 rounded border border-[#9A3412]/40 bg-[#9A3412]/10 px-3 py-2 text-xs text-[#9A3412]">
                {authError}
              </p>
            )}
          </div>

          <div className="shrink-0">
            <GoogleSignInButton onClick={handleLogin} disabled={isLoggingIn} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connected Account Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-stone-300 bg-[#EFEAE1] px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1C1917] text-white">
            <Mail className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#1C1917]">
              Gmail Connected · {user?.displayName || user?.email}
            </p>
            <p className="text-[11px] text-stone-600">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => void fetchGmailMessages()}
            disabled={loadingMessages}
            className="inline-flex items-center gap-1.5 rounded border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-[#1C1917] hover:border-[#9A3412] transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loadingMessages ? 'animate-spin' : ''}`}
            />
            <span>Refresh Inbox</span>
          </button>

          <button
            type="button"
            onClick={() => void handleLogout()}
            className="inline-flex items-center gap-1.5 rounded border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:border-stone-500 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {statusNotice && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-700/30 bg-emerald-50 px-4 py-3 text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-700 shrink-0" />
            <span>{statusNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusNotice(null)}
            className="font-medium text-emerald-800 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {apiError && (
        <div className="rounded-lg border border-[#9A3412]/40 bg-[#9A3412]/10 px-4 py-3 text-xs text-[#9A3412]">
          {apiError}
        </div>
      )}

      {/* Two-Column Workspace: Heritage Itinerary Mail Composer + Gmail Reader */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        {/* Left Column (5 cols): Send / Draft Heritage Trail Email */}
        <div className="lg:col-span-5 rounded-lg border border-stone-300 bg-white p-5 space-y-4">
          <div className="border-b border-stone-200 pb-3">
            <p className="text-xs font-medium text-[#9A3412]">
              Heritage Trail Dispatch
            </p>
            <h3 className="mt-0.5 font-serif text-2xl font-semibold text-[#1C1917]">
              Email a Site Dossier
            </h3>
            <p className="mt-1 text-xs text-stone-600">
              Pre-load routes, fees, and 360° tour links for any Kathmandu monument, then send or save as a Gmail draft.
            </p>
          </div>

          {composerError && (
            <p className="rounded border border-[#9A3412]/40 bg-[#9A3412]/10 px-3 py-2 text-xs text-[#9A3412]">
              {composerError}
            </p>
          )}

          <div>
            <label className="block text-xs font-medium text-stone-800 mb-1">
              Pre-fill Monument Itinerary
            </label>
            <select
              value={composerSiteId}
              onChange={(e) => applySiteTemplate(e.target.value)}
              className="w-full rounded-md border border-stone-300 bg-[#F8F5F0] px-3 py-2 text-xs text-[#1C1917]"
            >
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.district.split('·')[0].trim()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-800 mb-1">
              Recipient Email (To)
            </label>
            <input
              type="email"
              value={composeTo}
              onChange={(e) => setComposeTo(e.target.value)}
              placeholder="companion@example.com"
              className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-xs text-[#1C1917] placeholder:text-stone-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-800 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={composeSubject}
              onChange={(e) => setComposeSubject(e.target.value)}
              className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-xs text-[#1C1917]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-800 mb-1">
              Message Body
            </label>
            <textarea
              rows={9}
              value={composeBody}
              onChange={(e) => setComposeBody(e.target.value)}
              className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 font-mono text-[11px] leading-relaxed text-[#1C1917]"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-stone-200 pt-3">
            <button
              type="button"
              onClick={() => requestSendOrDraft('draft')}
              className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-[#F8F5F0] px-3.5 py-2 text-xs font-medium text-[#1C1917] hover:border-stone-500 transition-colors"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Save Draft</span>
            </button>

            <button
              type="button"
              onClick={() => requestSendOrDraft('send')}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#9A3412] px-4 py-2 text-xs font-medium text-white hover:bg-[#7C2D12] transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Send via Gmail</span>
            </button>
          </div>
        </div>

        {/* Right Column (7 cols): Gmail Mailbox Browser & Reader */}
        <div className="lg:col-span-7 rounded-lg border border-stone-300 bg-white overflow-hidden">
          {/* Mailbox Controls */}
          <div className="flex flex-col gap-3 border-b border-stone-300 bg-[#EFEAE1] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'INBOX', label: 'Inbox', icon: Inbox },
                  { id: 'STARRED', label: 'Starred', icon: Star },
                  { id: 'SENT', label: 'Sent', icon: Send },
                  { id: 'DRAFT', label: 'Drafts', icon: FileText },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const active = mailboxFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setMailboxFilter(tab.id)}
                    className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-[#1C1917] text-white'
                        : 'bg-[#F8F5F0] text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void fetchGmailMessages();
              }}
              className="relative w-full sm:w-56"
            >
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Gmail…"
                aria-label="Search Gmail messages"
                className="w-full rounded-md border border-stone-300 bg-white py-1.5 pl-8 pr-3 text-xs text-[#1C1917] placeholder:text-stone-400"
              />
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[440px]">
            {/* Message List */}
            <div className="md:col-span-5 border-b md:border-b-0 md:border-r border-stone-200 max-h-[520px] overflow-y-auto divide-y divide-stone-200">
              {loadingMessages && messages.length === 0 ? (
                <div className="p-6 text-xs text-stone-600">
                  Loading Gmail messages…
                </div>
              ) : messages.length === 0 ? (
                <div className="p-6 text-xs text-stone-600">
                  No messages found in {mailboxFilter.toLowerCase()}.
                </div>
              ) : (
                messages.map((msg) => {
                  const active = msg.id === selectedMessageId;
                  return (
                    <button
                      key={msg.id}
                      type="button"
                      onClick={() => setSelectedMessageId(msg.id)}
                      className={`w-full p-3.5 text-left transition-colors ${
                        active ? 'bg-[#EFEAE1]' : 'hover:bg-[#F8F5F0]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`truncate text-xs ${
                            msg.isUnread
                              ? 'font-bold text-[#1C1917]'
                              : 'font-medium text-stone-700'
                          }`}
                        >
                          {msg.from.replace(/<[^>]+>/g, '').trim()}
                        </span>
                        {msg.isStarred && (
                          <Star className="h-3 w-3 fill-[#9A3412] text-[#9A3412] shrink-0" />
                        )}
                      </div>
                      <p
                        className={`mt-1 truncate text-xs ${
                          msg.isUnread
                            ? 'font-semibold text-[#9A3412]'
                            : 'text-[#1C1917]'
                        }`}
                      >
                        {msg.subject}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-stone-500">
                        {msg.snippet}
                      </p>
                    </button>
                  );
                })
              )}
            </div>

            {/* Selected Message Reader */}
            <div className="md:col-span-7 p-5 flex flex-col justify-between bg-[#F8F5F0]/50">
              {selectedMessage ? (
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-stone-200 pb-3">
                    <div className="min-w-0">
                      <h4 className="font-serif text-xl font-semibold text-[#1C1917] leading-snug">
                        {selectedMessage.subject}
                      </h4>
                      <p className="mt-1 text-xs text-stone-700">
                        <span className="font-semibold">From:</span> {selectedMessage.from}
                      </p>
                      {selectedMessage.to && (
                        <p className="text-[11px] text-stone-600">
                          <span className="font-semibold">To:</span> {selectedMessage.to}
                        </p>
                      )}
                      {selectedMessage.date && (
                        <p className="mt-0.5 font-mono text-[11px] text-stone-500">
                          {selectedMessage.date}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setPendingMutation({
                            type: 'modify',
                            message: selectedMessage,
                            actionLabel: selectedMessage.isUnread
                              ? 'Mark as Read'
                              : 'Mark as Unread',
                            addLabelIds: selectedMessage.isUnread ? [] : ['UNREAD'],
                            removeLabelIds: selectedMessage.isUnread
                              ? ['UNREAD']
                              : [],
                          })
                        }
                        className="inline-flex items-center gap-1 rounded border border-stone-300 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-700 hover:border-[#9A3412]"
                      >
                        <MailOpen className="h-3 w-3" />
                        <span>
                          {selectedMessage.isUnread ? 'Mark Read' : 'Mark Unread'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setPendingMutation({
                            type: 'modify',
                            message: selectedMessage,
                            actionLabel: selectedMessage.isStarred
                              ? 'Remove Star'
                              : 'Add Star',
                            addLabelIds: selectedMessage.isStarred ? [] : ['STARRED'],
                            removeLabelIds: selectedMessage.isStarred
                              ? ['STARRED']
                              : [],
                          })
                        }
                        className="inline-flex items-center gap-1 rounded border border-stone-300 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-700 hover:border-[#9A3412]"
                      >
                        <Star className="h-3 w-3" />
                        <span>{selectedMessage.isStarred ? 'Unstar' : 'Star'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setPendingMutation({
                            type: 'trash',
                            message: selectedMessage,
                          })
                        }
                        className="inline-flex items-center gap-1 rounded border border-stone-300 bg-white px-2.5 py-1 text-[11px] font-medium text-[#9A3412] hover:border-[#9A3412]"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Trash</span>
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 max-h-[340px] overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-stone-800">
                    {selectedMessage.bodyText}
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-stone-500">
                  Select an email message to read its contents.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Explicit User Confirmation Modal (Required before Send / Draft / Modify / Trash) */}
      {pendingMutation && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="gmail-confirm-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="w-full max-w-lg rounded-lg border border-stone-300 bg-[#F8F5F0] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-stone-300 pb-3">
              <div>
                <p className="text-xs font-medium text-[#9A3412]">
                  Gmail Action Confirmation
                </p>
                <h4
                  id="gmail-confirm-title"
                  className="mt-0.5 font-serif text-2xl font-semibold text-[#1C1917]"
                >
                  {pendingMutation.type === 'send'
                    ? 'Send Email via Gmail?'
                    : pendingMutation.type === 'draft'
                    ? 'Save Draft to Gmail?'
                    : pendingMutation.type === 'trash'
                    ? 'Move Message to Trash?'
                    : `${pendingMutation.actionLabel}?`}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setPendingMutation(null)}
                disabled={isMutating}
                aria-label="Cancel confirmation"
                className="rounded p-1 text-stone-500 hover:bg-stone-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2 text-xs text-stone-700">
              {pendingMutation.type === 'send' && (
                <>
                  <p>
                    You are about to send this heritage itinerary email from your connected Gmail account:
                  </p>
                  <div className="rounded border border-stone-300 bg-white p-3 space-y-1">
                    <p>
                      <span className="font-semibold">To:</span> {pendingMutation.to}
                    </p>
                    <p>
                      <span className="font-semibold">Subject:</span>{' '}
                      {pendingMutation.subject}
                    </p>
                    <p className="line-clamp-4 whitespace-pre-wrap text-stone-600 pt-1 border-t border-stone-200">
                      {pendingMutation.body}
                    </p>
                  </div>
                </>
              )}

              {pendingMutation.type === 'draft' && (
                <>
                  <p>
                    Save this message as a draft in your Gmail Drafts folder?
                  </p>
                  <div className="rounded border border-stone-300 bg-white p-3 space-y-1">
                    <p>
                      <span className="font-semibold">To:</span>{' '}
                      {pendingMutation.to || '(No recipient specified yet)'}
                    </p>
                    <p>
                      <span className="font-semibold">Subject:</span>{' '}
                      {pendingMutation.subject}
                    </p>
                  </div>
                </>
              )}

              {pendingMutation.type === 'trash' && (
                <p>
                  Are you sure you want to move{' '}
                  <span className="font-semibold text-[#1C1917]">
                    “{pendingMutation.message.subject}”
                  </span>{' '}
                  (from {pendingMutation.message.from}) to your Gmail Trash?
                </p>
              )}

              {pendingMutation.type === 'modify' && (
                <p>
                  Apply <span className="font-semibold">{pendingMutation.actionLabel}</span> to{' '}
                  <span className="font-semibold text-[#1C1917]">
                    “{pendingMutation.message.subject}”
                  </span>
                  ?
                </p>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingMutation(null)}
                disabled={isMutating}
                className="rounded-md border border-stone-300 bg-white px-4 py-2 text-xs font-medium text-stone-700 hover:border-stone-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void executeConfirmedMutation()}
                disabled={isMutating}
                className="rounded-md bg-[#9A3412] px-4 py-2 text-xs font-medium text-white hover:bg-[#7C2D12] disabled:opacity-50"
              >
                {isMutating
                  ? 'Processing…'
                  : pendingMutation.type === 'send'
                  ? 'Confirm & Send Email'
                  : pendingMutation.type === 'trash'
                  ? 'Move to Trash'
                  : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
