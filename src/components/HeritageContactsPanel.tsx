import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import {
  Building2,
  Check,
  Copy,
  Edit3,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserCheck,
  Users,
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

interface PersonEmail {
  value?: string;
}

interface PersonPhone {
  value?: string;
}

interface PersonOrg {
  name?: string;
  title?: string;
}

interface PersonAddress {
  formattedValue?: string;
}

interface PersonBirthday {
  text?: string;
  date?: { year?: number; month?: number; day?: number };
}

interface PersonGender {
  formattedValue?: string;
  value?: string;
}

interface GooglePerson {
  resourceName: string;
  etag?: string;
  names?: { displayName?: string; givenName?: string; familyName?: string }[];
  emailAddresses?: PersonEmail[];
  phoneNumbers?: PersonPhone[];
  organizations?: PersonOrg[];
  addresses?: PersonAddress[];
  biographies?: { value?: string }[];
  birthdays?: PersonBirthday[];
  genders?: PersonGender[];
  photos?: { url?: string }[];
}

type ContactSource = 'connections' | 'other' | 'directory';

type PendingMutation =
  | {
      type: 'create';
      givenName: string;
      familyName: string;
      email: string;
      phone: string;
      organization: string;
      note: string;
    }
  | {
      type: 'update';
      person: GooglePerson;
      givenName: string;
      familyName: string;
      email: string;
      phone: string;
      organization: string;
      note: string;
    }
  | {
      type: 'delete';
      person: GooglePerson;
      displayName: string;
    };

interface HeritageContactsPanelProps {
  focusedSite?: HeritageSite | null;
}

export const HeritageContactsPanel: React.FC<HeritageContactsPanelProps> = ({
  focusedSite,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [needsAuth, setNeedsAuth] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [sourceTab, setSourceTab] = useState<ContactSource>('connections');
  const [myProfile, setMyProfile] = useState<GooglePerson | null>(null);
  const [connections, setConnections] = useState<GooglePerson[]>([]);
  const [otherContacts, setOtherContacts] = useState<GooglePerson[]>([]);
  const [directoryPeople, setDirectoryPeople] = useState<GooglePerson[]>([]);
  const [loadingContacts, setLoadingContacts] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { sites } = useHeritageSites();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCompanionIds, setSelectedCompanionIds] = useState<string[]>([]);
  const [selectedSiteForShare, setSelectedSiteForShare] = useState<string>(
    focusedSite?.id ?? sites[0]?.id ?? ''
  );
  const [copiedInvite, setCopiedInvite] = useState<boolean>(false);

  // Add / Edit form state
  const [editorOpen, setEditorOpen] = useState<boolean>(false);
  const [editingPerson, setEditingPerson] = useState<GooglePerson | null>(null);
  const [formGivenName, setFormGivenName] = useState<string>('');
  const [formFamilyName, setFormFamilyName] = useState<string>('');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formOrg, setFormOrg] = useState<string>('');
  const [formNote, setFormNote] = useState<string>('');

  // Explicit confirmation dialog before any create / update / delete mutation
  const [pendingMutation, setPendingMutation] = useState<PendingMutation | null>(null);
  const [isMutating, setIsMutating] = useState<boolean>(false);

  useEffect(() => {
    if (focusedSite) {
      setSelectedSiteForShare(focusedSite.id);
    }
  }, [focusedSite]);

  const fetchPeopleData = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }

    setLoadingContacts(true);
    setApiError(null);
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [meRes, connRes, otherRes, dirRes] = await Promise.allSettled([
        fetch(
          'https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses,phoneNumbers,organizations,addresses,birthdays,genders,photos',
          { headers }
        ),
        fetch(
          'https://people.googleapis.com/v1/people/me/connections?pageSize=100&personFields=names,emailAddresses,phoneNumbers,organizations,addresses,biographies,photos',
          { headers }
        ),
        fetch(
          'https://people.googleapis.com/v1/otherContacts?pageSize=50&readMask=names,emailAddresses,phoneNumbers',
          { headers }
        ),
        fetch(
          'https://people.googleapis.com/v1/people:listDirectoryPeople?pageSize=50&readMask=names,emailAddresses,phoneNumbers,organizations&sources=DIRECTORY_SOURCE_TYPE_DOMAIN_PROFILE',
          { headers }
        ),
      ]);

      if (meRes.status === 'fulfilled') {
        if (meRes.value.status === 401) {
          clearAccessToken();
          setNeedsAuth(true);
          setLoadingContacts(false);
          return;
        }
        if (meRes.value.ok) {
          setMyProfile((await meRes.value.json()) as GooglePerson);
        }
      }

      if (connRes.status === 'fulfilled') {
        if (connRes.value.status === 401) {
          clearAccessToken();
          setNeedsAuth(true);
          setLoadingContacts(false);
          return;
        }
        if (connRes.value.ok) {
          const data = await connRes.value.json();
          setConnections(Array.isArray(data.connections) ? data.connections : []);
        } else {
          const errBody = await connRes.value.json().catch(() => ({}));
          setApiError(
            errBody?.error?.message ||
              'Unable to load Google Contacts. Ensure the People API is enabled and permissions are granted.'
          );
        }
      }

      if (otherRes.status === 'fulfilled' && otherRes.value.ok) {
        const data = await otherRes.value.json();
        setOtherContacts(Array.isArray(data.otherContacts) ? data.otherContacts : []);
      }

      if (dirRes.status === 'fulfilled' && dirRes.value.ok) {
        const data = await dirRes.value.json();
        setDirectoryPeople(Array.isArray(data.people) ? data.people : []);
      }
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : 'Failed to communicate with Google People API.'
      );
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = initAuth(
      (authedUser) => {
        setUser(authedUser);
        setNeedsAuth(false);
        void fetchPeopleData();
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, [fetchPeopleData]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setNeedsAuth(false);
        await fetchPeopleData();
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
    setMyProfile(null);
    setConnections([]);
    setOtherContacts([]);
    setDirectoryPeople([]);
    setSelectedCompanionIds([]);
    setNeedsAuth(true);
  };

  const getDisplayName = (p: GooglePerson) =>
    p.names?.[0]?.displayName ||
    [p.names?.[0]?.givenName, p.names?.[0]?.familyName].filter(Boolean).join(' ') ||
    p.emailAddresses?.[0]?.value ||
    'Unnamed Contact';

  const activeList = useMemo(() => {
    const raw =
      sourceTab === 'connections'
        ? connections
        : sourceTab === 'other'
        ? otherContacts
        : directoryPeople;
    const q = searchTerm.trim().toLowerCase();
    if (!q) return raw;
    return raw.filter((p) => {
      const name = getDisplayName(p).toLowerCase();
      const email = (p.emailAddresses?.[0]?.value || '').toLowerCase();
      const phone = (p.phoneNumbers?.[0]?.value || '').toLowerCase();
      const org = (p.organizations?.[0]?.name || '').toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        org.includes(q)
      );
    });
  }, [sourceTab, connections, otherContacts, directoryPeople, searchTerm]);

  const openCreateModal = () => {
    setEditingPerson(null);
    setFormGivenName('');
    setFormFamilyName('');
    setFormEmail('');
    setFormPhone('');
    setFormOrg('');
    setFormNote('');
    setEditorOpen(true);
  };

  const openEditModal = (person: GooglePerson) => {
    setEditingPerson(person);
    setFormGivenName(person.names?.[0]?.givenName || getDisplayName(person));
    setFormFamilyName(person.names?.[0]?.familyName || '');
    setFormEmail(person.emailAddresses?.[0]?.value || '');
    setFormPhone(person.phoneNumbers?.[0]?.value || '');
    setFormOrg(person.organizations?.[0]?.name || '');
    setFormNote(person.biographies?.[0]?.value || '');
    setEditorOpen(true);
  };

  const handleEditorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formGivenName.trim() && !formEmail.trim()) return;

    if (editingPerson) {
      setPendingMutation({
        type: 'update',
        person: editingPerson,
        givenName: formGivenName.trim(),
        familyName: formFamilyName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        organization: formOrg.trim(),
        note: formNote.trim(),
      });
    } else {
      setPendingMutation({
        type: 'create',
        givenName: formGivenName.trim(),
        familyName: formFamilyName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        organization: formOrg.trim(),
        note: formNote.trim(),
      });
    }
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

    try {
      if (pendingMutation.type === 'create') {
        const body: Record<string, unknown> = {
          names: [
            {
              givenName: pendingMutation.givenName,
              familyName: pendingMutation.familyName,
            },
          ],
        };
        if (pendingMutation.email) {
          body.emailAddresses = [{ value: pendingMutation.email }];
        }
        if (pendingMutation.phone) {
          body.phoneNumbers = [{ value: pendingMutation.phone }];
        }
        if (pendingMutation.organization) {
          body.organizations = [{ name: pendingMutation.organization }];
        }
        if (pendingMutation.note) {
          body.biographies = [{ value: pendingMutation.note }];
        }

        const res = await fetch('https://people.googleapis.com/v1/people:createContact', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error?.message || 'Failed to create contact.');
        }
        setEditorOpen(false);
        await fetchPeopleData();
      } else if (pendingMutation.type === 'update') {
        const updatePersonFields = [
          'names',
          'emailAddresses',
          'phoneNumbers',
          'organizations',
          'biographies',
        ].join(',');

        const body: Record<string, unknown> = {
          etag: pendingMutation.person.etag,
          names: [
            {
              givenName: pendingMutation.givenName,
              familyName: pendingMutation.familyName,
            },
          ],
          emailAddresses: pendingMutation.email ? [{ value: pendingMutation.email }] : [],
          phoneNumbers: pendingMutation.phone ? [{ value: pendingMutation.phone }] : [],
          organizations: pendingMutation.organization
            ? [{ name: pendingMutation.organization }]
            : [],
          biographies: pendingMutation.note ? [{ value: pendingMutation.note }] : [],
        };

        const res = await fetch(
          `https://people.googleapis.com/v1/${pendingMutation.person.resourceName}:updateContact?updatePersonFields=${updatePersonFields}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
          }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error?.message || 'Failed to update contact.');
        }
        setEditorOpen(false);
        setEditingPerson(null);
        await fetchPeopleData();
      } else if (pendingMutation.type === 'delete') {
        const res = await fetch(
          `https://people.googleapis.com/v1/${pendingMutation.person.resourceName}:deleteContact`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error?.message || 'Failed to delete contact.');
        }
        setSelectedCompanionIds((prev) =>
          prev.filter((id) => id !== pendingMutation.person.resourceName)
        );
        await fetchPeopleData();
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Contact update failed.');
    } finally {
      setIsMutating(false);
      setPendingMutation(null);
    }
  };

  const toggleCompanion = (resourceName: string) => {
    setSelectedCompanionIds((prev) =>
      prev.includes(resourceName)
        ? prev.filter((id) => id !== resourceName)
        : [...prev, resourceName]
    );
  };

  const shareSite =
    sites.find((s) => s.id === selectedSiteForShare) || sites[0];

  const selectedCompanions = useMemo(() => {
    const all = [...connections, ...otherContacts, ...directoryPeople];
    return selectedCompanionIds
      .map((id) => all.find((p) => p.resourceName === id))
      .filter((p): p is GooglePerson => Boolean(p));
  }, [selectedCompanionIds, connections, otherContacts, directoryPeople]);

  const copyTrailInvite = async () => {
    if (!shareSite) return;
    const names = selectedCompanions.map(getDisplayName).join(', ');
    const primaryRoute = shareSite.routes[0];
    const text = [
      `Kathmandu Heritage Trail Invite: ${shareSite.name} (${shareSite.nativeName})`,
      names ? `Companions: ${names}` : '',
      primaryRoute
        ? `Recommended Route: ${primaryRoute.mode} from ${primaryRoute.origin} (${primaryRoute.distanceKm} km, ${primaryRoute.durationMin} min)`
        : '',
      `Coordinates: ${shareSite.coordinates.label}`,
      `Explore 360° Tour & Audio Guide: ${window.location.origin}/?site=${shareSite.slug}`,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopiedInvite(true);
      window.setTimeout(() => setCopiedInvite(false), 2500);
    } catch {
      // Clipboard fallback ignored if blocked
    }
  };

  return (
    <div className="rounded-lg border border-stone-300 bg-[#F8F5F0] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-300/80 pb-5">
        <div>
          <p className="text-xs font-medium text-[#9A3412]">
            Google Contacts & Travel Companions
          </p>
          <h3 className="mt-1 font-serif text-2xl sm:text-3xl font-semibold text-[#1C1917]">
            Invite Companions & Manage Local Heritage Guides
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-stone-700">
            Connect your Google Contacts to pick companions for Kathmandu heritage walks, inspect contact details, or save trusted local guides.
          </p>
        </div>

        {!needsAuth && user && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right text-xs">
              <p className="font-medium text-[#1C1917]">
                {myProfile?.names?.[0]?.displayName || user.displayName || 'Connected Account'}
              </p>
              <p className="text-stone-600">
                {myProfile?.emailAddresses?.[0]?.value || user.email}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 hover:border-stone-500 transition-colors whitespace-nowrap"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>

      {/* Sign-In State */}
      {needsAuth ? (
        <div className="mt-6 flex flex-col items-start justify-between gap-6 rounded-lg border border-stone-300 bg-[#EFEAE1] p-6 sm:flex-row sm:items-center">
          <div className="max-w-xl">
            <h4 className="font-serif text-xl font-semibold text-[#1C1917]">
              Sign in with Google to access Contacts
            </h4>
            <p className="mt-1 text-sm text-stone-700">
              Your access token is held strictly in memory for this session. Once signed in, you can browse your Google Contacts, Workspace directory, and save or edit Kathmandu guide contacts with confirmation.
            </p>
            {authError && (
              <p className="mt-2 text-xs font-medium text-[#9A3412]">{authError}</p>
            )}
          </div>
          <GoogleSignInButton
            onClick={handleLogin}
            disabled={isLoggingIn}
            label={isLoggingIn ? 'Signing in…' : 'Sign in with Google'}
          />
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* Profile Summary Strip (from user.* read scopes) */}
          {myProfile && (
            <div className="grid grid-cols-1 gap-4 rounded-lg border border-stone-300 bg-[#EFEAE1] p-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
              <div>
                <p className="text-stone-500">Account Emails</p>
                <p className="mt-0.5 font-medium text-[#1C1917] truncate">
                  {myProfile.emailAddresses?.map((e) => e.value).filter(Boolean).join(', ') || '—'}
                </p>
              </div>
              <div>
                <p className="text-stone-500">Phone & Organization</p>
                <p className="mt-0.5 font-medium text-[#1C1917] truncate">
                  {myProfile.phoneNumbers?.[0]?.value ||
                    myProfile.organizations?.[0]?.name ||
                    'Not listed on profile'}
                </p>
              </div>
              <div>
                <p className="text-stone-500">Address</p>
                <p className="mt-0.5 font-medium text-[#1C1917] truncate">
                  {myProfile.addresses?.[0]?.formattedValue || 'Not listed on profile'}
                </p>
              </div>
              <div>
                <p className="text-stone-500">Birthday / Gender</p>
                <p className="mt-0.5 font-medium text-[#1C1917] truncate">
                  {[
                    myProfile.birthdays?.[0]?.text ||
                      (myProfile.birthdays?.[0]?.date
                        ? `${myProfile.birthdays[0].date.month}/${myProfile.birthdays[0].date.day}`
                        : null),
                    myProfile.genders?.[0]?.formattedValue || myProfile.genders?.[0]?.value,
                  ]
                    .filter(Boolean)
                    .join(' · ') || 'Not listed on profile'}
                </p>
              </div>
            </div>
          )}

          {apiError && (
            <div className="rounded-md border border-[#9A3412]/40 bg-[#9A3412]/10 p-3 text-xs text-[#9A3412]">
              {apiError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Contacts Browser */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Source Filter Tabs */}
                <div className="flex items-center gap-1 rounded-md border border-stone-300 bg-[#EFEAE1] p-1">
                  <button
                    type="button"
                    onClick={() => setSourceTab('connections')}
                    className={`rounded px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                      sourceTab === 'connections'
                        ? 'bg-white text-[#1C1917] shadow-sm'
                        : 'text-stone-600 hover:text-[#1C1917]'
                    }`}
                  >
                    My Contacts ({connections.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceTab('other')}
                    className={`rounded px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                      sourceTab === 'other'
                        ? 'bg-white text-[#1C1917] shadow-sm'
                        : 'text-stone-600 hover:text-[#1C1917]'
                    }`}
                  >
                    Other ({otherContacts.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceTab('directory')}
                    className={`rounded px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                      sourceTab === 'directory'
                        ? 'bg-white text-[#1C1917] shadow-sm'
                        : 'text-stone-600 hover:text-[#1C1917]'
                    }`}
                  >
                    Directory ({directoryPeople.length})
                  </button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void fetchPeopleData()}
                    disabled={loadingContacts}
                    className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 hover:border-stone-500 transition-colors whitespace-nowrap"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loadingContacts ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="inline-flex items-center gap-1.5 rounded-md bg-[#9A3412] px-3 py-2 text-xs font-medium text-white hover:bg-[#7C2D12] transition-colors whitespace-nowrap"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Guide / Contact</span>
                  </button>
                </div>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search contacts by name, email, phone, or organization…"
                  className="w-full rounded-md border border-stone-300 bg-white py-2 pl-9 pr-3 text-sm text-[#1C1917]"
                />
              </div>

              {/* Contact List */}
              {loadingContacts ? (
                <div className="rounded-lg border border-stone-300 bg-white p-8 text-center text-sm text-stone-600">
                  Loading contacts from Google People API…
                </div>
              ) : activeList.length === 0 ? (
                <div className="rounded-lg border border-stone-300 bg-white p-8 text-center text-sm text-stone-600">
                  No contacts found in this view.
                </div>
              ) : (
                <div className="divide-y divide-stone-200 rounded-lg border border-stone-300 bg-white max-h-[420px] overflow-y-auto">
                  {activeList.map((person) => {
                    const name = getDisplayName(person);
                    const email = person.emailAddresses?.[0]?.value;
                    const phone = person.phoneNumbers?.[0]?.value;
                    const org = person.organizations?.[0]?.name;
                    const isSelected = selectedCompanionIds.includes(person.resourceName);
                    const canMutate = sourceTab === 'connections';

                    return (
                      <div
                        key={person.resourceName}
                        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-stone-50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[#1C1917] truncate">
                            {name}
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600">
                            {email && (
                              <span className="inline-flex items-center gap-1 truncate">
                                <Mail className="h-3 w-3 text-[#9A3412]" />
                                {email}
                              </span>
                            )}
                            {phone && (
                              <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                                <Phone className="h-3 w-3 text-[#9A3412]" />
                                {phone}
                              </span>
                            )}
                            {org && (
                              <span className="inline-flex items-center gap-1">
                                <Building2 className="h-3 w-3 text-[#9A3412]" />
                                {org}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleCompanion(person.resourceName)}
                            className={`inline-flex items-center gap-1 rounded border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                              isSelected
                                ? 'border-[#9A3412] bg-[#9A3412] text-white'
                                : 'border-stone-300 bg-[#F8F5F0] text-stone-700 hover:border-[#9A3412]'
                            }`}
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>{isSelected ? 'Selected' : 'Invite'}</span>
                          </button>

                          {canMutate && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditModal(person)}
                                className="rounded border border-stone-300 p-1.5 text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                                aria-label={`Edit ${name}`}
                                title="Edit contact"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setPendingMutation({
                                    type: 'delete',
                                    person,
                                    displayName: name,
                                  })
                                }
                                className="rounded border border-stone-300 p-1.5 text-stone-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                                aria-label={`Delete ${name}`}
                                title="Delete contact"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Sidebar: Selected Trail Companions & Share Summary */}
            <div className="lg:col-span-4 rounded-lg border border-stone-300 bg-[#EFEAE1] p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 border-b border-stone-300/80 pb-3">
                  <Users className="h-4 w-4 text-[#9A3412]" />
                  <h4 className="font-serif text-xl font-semibold text-[#1C1917]">
                    Heritage Trip Group ({selectedCompanions.length})
                  </h4>
                </div>

                <label className="mt-4 block text-xs font-medium text-stone-700">
                  Destination to Share
                  <select
                    value={selectedSiteForShare}
                    onChange={(e) => setSelectedSiteForShare(e.target.value)}
                    className="mt-1.5 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-[#1C1917]"
                  >
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>

                {shareSite && (
                <div className="mt-4 rounded-md border border-stone-300 bg-[#F8F5F0] p-3 text-xs text-stone-700 space-y-1">
                  <p className="font-semibold text-[#1C1917] flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[#9A3412]" />
                    <span>{shareSite.name}</span>
                  </p>
                  {shareSite.routes[0] && (
                  <p>
                    Route: {shareSite.routes[0].mode} · {shareSite.routes[0].distanceKm} km (
                    {shareSite.routes[0].durationMin} min)
                  </p>
                  )}
                  <p className="font-mono text-[11px] text-stone-500 tabular-nums">
                    {shareSite.coordinates.label}
                  </p>
                </div>
                )}

                <div className="mt-4">
                  <p className="text-xs font-semibold text-stone-700 mb-2">
                    Invited Companions
                  </p>
                  {selectedCompanions.length === 0 ? (
                    <p className="text-xs text-stone-600">
                      Click “Invite” next to any contact to include them in your heritage route invite.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {selectedCompanions.map((p) => (
                        <li
                          key={p.resourceName}
                          className="flex items-center justify-between gap-2 rounded border border-stone-300 bg-white px-2.5 py-1.5 text-xs"
                        >
                          <span className="truncate font-medium text-[#1C1917]">
                            {getDisplayName(p)}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleCompanion(p.resourceName)}
                            className="text-stone-400 hover:text-stone-800"
                            aria-label={`Remove ${getDisplayName(p)}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={copyTrailInvite}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#1C1917] px-4 py-2.5 text-xs font-medium text-white hover:bg-[#9A3412] transition-colors whitespace-nowrap"
              >
                {copiedInvite ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>
                  {copiedInvite ? 'Copied Route Invite' : 'Copy Route & 360° Tour Invite'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Contact Modal */}
      {editorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-editor-title"
        >
          <div className="w-full max-w-md rounded-lg border border-stone-300 bg-[#F8F5F0] p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-300 pb-3">
              <h4 id="contact-editor-title" className="font-serif text-2xl font-semibold text-[#1C1917]">
                {editingPerson ? 'Edit Google Contact' : 'New Google Contact'}
              </h4>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="rounded p-1 text-stone-500 hover:bg-stone-200"
                aria-label="Close contact editor"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditorSubmit} className="mt-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-medium text-stone-700">
                  First Name *
                  <input
                    type="text"
                    required
                    value={formGivenName}
                    onChange={(e) => setFormGivenName(e.target.value)}
                    className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-[#1C1917]"
                  />
                </label>
                <label className="block text-xs font-medium text-stone-700">
                  Last Name
                  <input
                    type="text"
                    value={formFamilyName}
                    onChange={(e) => setFormFamilyName(e.target.value)}
                    className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-[#1C1917]"
                  />
                </label>
              </div>

              <label className="block text-xs font-medium text-stone-700">
                Email Address
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-[#1C1917]"
                />
              </label>

              <label className="block text-xs font-medium text-stone-700">
                Phone Number
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-[#1C1917]"
                />
              </label>

              <label className="block text-xs font-medium text-stone-700">
                Organization / Role (e.g. Licensed Heritage Guide)
                <input
                  type="text"
                  value={formOrg}
                  onChange={(e) => setFormOrg(e.target.value)}
                  className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-[#1C1917]"
                />
              </label>

              <label className="block text-xs font-medium text-stone-700">
                Notes
                <textarea
                  rows={2}
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-[#1C1917]"
                />
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-300">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="rounded-md border border-stone-300 bg-white px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[#9A3412] px-4 py-2 text-xs font-medium text-white hover:bg-[#7C2D12]"
                >
                  Review & Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mandatory Explicit Confirmation Modal for Create / Update / Delete */}
      {pendingMutation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-mutation-title"
        >
          <div className="w-full max-w-md rounded-lg border border-stone-300 bg-[#F8F5F0] p-6 shadow-2xl">
            <h4 id="confirm-mutation-title" className="font-serif text-2xl font-semibold text-[#1C1917]">
              {pendingMutation.type === 'delete'
                ? 'Confirm Contact Deletion'
                : pendingMutation.type === 'update'
                ? 'Confirm Contact Update'
                : 'Confirm New Contact'}
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-stone-700">
              {pendingMutation.type === 'delete' && (
                <>
                  Are you sure you want to permanently delete{' '}
                  <strong className="text-[#1C1917]">{pendingMutation.displayName}</strong>{' '}
                  from your Google Contacts? This action cannot be undone.
                </>
              )}
              {pendingMutation.type === 'update' && (
                <>
                  Update Google Contact{' '}
                  <strong className="text-[#1C1917]">
                    {pendingMutation.givenName} {pendingMutation.familyName}
                  </strong>{' '}
                  with email{' '}
                  <span className="font-mono text-xs">{pendingMutation.email || 'none'}</span> and
                  phone <span className="font-mono text-xs">{pendingMutation.phone || 'none'}</span>?
                </>
              )}
              {pendingMutation.type === 'create' && (
                <>
                  Add{' '}
                  <strong className="text-[#1C1917]">
                    {pendingMutation.givenName} {pendingMutation.familyName}
                  </strong>{' '}
                  to your Google Contacts?
                </>
              )}
            </p>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-stone-300 pt-4">
              <button
                type="button"
                disabled={isMutating}
                onClick={() => setPendingMutation(null)}
                className="rounded-md border border-stone-300 bg-white px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isMutating}
                onClick={() => void executeConfirmedMutation()}
                className={`rounded-md px-4 py-2 text-xs font-medium text-white transition-colors ${
                  pendingMutation.type === 'delete'
                    ? 'bg-red-700 hover:bg-red-800'
                    : 'bg-[#9A3412] hover:bg-[#7C2D12]'
                }`}
              >
                {isMutating
                  ? 'Applying…'
                  : pendingMutation.type === 'delete'
                  ? 'Delete Contact'
                  : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
