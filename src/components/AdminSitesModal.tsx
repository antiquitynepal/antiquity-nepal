import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  AlertCircle,
  Check,
  Image as ImageIcon,
  Lock,
  LogIn,
  LogOut,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { HeritageCategory, HeritageSite } from '../data/heritageSites';
import { googleSignIn, initAuth, logout } from '../utils/googleAuth';
import { ADMIN_EMAIL, isVerifiedAdminEmail } from '../utils/notablePlacesDb';
import {
  addManagedHeritageSite,
  HERITAGE_CATEGORIES,
  HERITAGE_IMAGE_PRESETS,
  hideBuiltInHeritageSite,
  removeManagedHeritageRecord,
  resolveHeritageImageSrc,
  validateHeritageImageUrl,
} from '../utils/managedSitesDb';
import { useHeritageSites } from '../utils/heritageSitesContext';
import { useLanguage } from '../utils/i18n';

interface AdminSitesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSiteAdded?: (siteId: string) => void;
  onSiteRemoved?: (siteId: string) => void;
}

export const AdminSitesModal: React.FC<AdminSitesModalProps> = ({
  isOpen,
  onClose,
  onSiteAdded,
  onSiteRemoved,
}) => {
  const { t, translateCategory } = useLanguage();
  const {
    sites,
    hiddenBuiltInRecords,
    customSiteRecordMap,
    syncError,
  } = useHeritageSites();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Add Heritage Site form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<HeritageCategory>('Royal Plaza');
  const [imageInputs, setImageInputs] = useState<string[]>(['preset:budhanilkantha']);
  const [description, setDescription] = useState('');
  const [district, setDistrict] = useState('');
  const [era, setEra] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Two-step removal state
  const [confirmRemoveSiteId, setConfirmRemoveSiteId] = useState<string | null>(null);
  const [busySiteId, setBusySiteId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = initAuth(
      (user) => {
        setCurrentUser(user);
        setAuthError(null);
      },
      () => {
        setCurrentUser(null);
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isAuthorizedAdmin = isVerifiedAdminEmail(
    currentUser?.email,
    currentUser?.emailVerified
  );

  const handleAdminSignIn = async () => {
    setSigningIn(true);
    setAuthError(null);
    try {
      await googleSignIn();
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Unable to complete Google Sign-In.'
      );
    } finally {
      setSigningIn(false);
    }
  };

  const handleAdminSignOut = async () => {
    try {
      await logout();
      setCurrentUser(null);
      setConfirmRemoveSiteId(null);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to sign out.');
    }
  };

  const handleImageChange = (idx: number, val: string) => {
    setImageInputs((prev) => prev.map((item, i) => (i === idx ? val : item)));
  };

  const handleAddImageSlot = () => {
    setImageInputs((prev) => (prev.length < 5 ? [...prev, ''] : prev));
  };

  const handleRemoveImageSlot = (idx: number) => {
    setImageInputs((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!isAuthorizedAdmin || !currentUser) {
      setFormError(`Restricted to verified personnel (${ADMIN_EMAIL}).`);
      return;
    }

    const cleanName = name.trim();
    const cleanDesc = description.trim();
    const cleanUrls = imageInputs.map((u) => u.trim()).filter(Boolean);

    if (cleanName.length < 2) {
      setFormError('Please enter a heritage site name (at least 2 characters).');
      return;
    }
    if (cleanUrls.length === 0) {
      setFormError('Please provide at least one watermark-free image URL or preset.');
      return;
    }
    for (const url of cleanUrls) {
      const check = validateHeritageImageUrl(url);
      if (!check.valid) {
        setFormError(check.reason || 'Invalid image URL.');
        return;
      }
    }
    if (cleanDesc.length < 10) {
      setFormError('Please provide a clear site description (at least 10 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const recordId = await addManagedHeritageSite({
        authorUid: currentUser.uid,
        name: cleanName,
        category,
        imageUrls: cleanUrls,
        description: cleanDesc,
        district: district.trim() || undefined,
        era: era.trim() || undefined,
      });
      setFormSuccess(`"${cleanName}" added to the live HERITAGE_SITES directory.`);
      setName('');
      setCategory('Royal Plaza');
      setImageInputs(['preset:budhanilkantha']);
      setDescription('');
      setDistrict('');
      setEra('');
      if (onSiteAdded) {
        onSiteAdded(recordId);
      }
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Unable to save heritage site.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveSite = async (site: HeritageSite) => {
    if (!isAuthorizedAdmin || !currentUser) return;
    setBusySiteId(site.id);
    setFormError(null);
    try {
      const customRecordId = customSiteRecordMap[site.id];
      if (customRecordId) {
        await removeManagedHeritageRecord(customRecordId);
      } else {
        await hideBuiltInHeritageSite(currentUser.uid, site);
      }
      setConfirmRemoveSiteId(null);
      setFormSuccess(`Removed "${site.name}" from the active HERITAGE_SITES directory.`);
      if (onSiteRemoved) {
        onSiteRemoved(site.id);
      }
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Unable to remove heritage site.'
      );
    } finally {
      setBusySiteId(null);
    }
  };

  const handleRestoreBuiltIn = async (recordId: string, siteName: string) => {
    if (!isAuthorizedAdmin) return;
    setBusySiteId(recordId);
    setFormError(null);
    try {
      await removeManagedHeritageRecord(recordId);
      setFormSuccess(`Restored "${siteName}" back into HERITAGE_SITES.`);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Unable to restore built-in site.'
      );
    } finally {
      setBusySiteId(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-sites-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden rounded-lg border border-stone-300 bg-[#F8F5F0] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-stone-300 bg-[#EFEAE1] px-6 py-4 shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#9A3412]/30 bg-white text-[#9A3412]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9A3412]">
                {t('adminSitesEyebrow')}
              </p>
              <h2
                id="admin-sites-modal-title"
                className="font-serif text-xl sm:text-2xl font-semibold text-[#1C1917] leading-tight"
              >
                {t('adminSitesTitle')}
              </h2>
              <p className="mt-0.5 text-xs text-stone-600">
                {t('adminSitesDesc')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Administrator modal"
            className="rounded p-1.5 text-stone-600 hover:bg-stone-200 hover:text-[#1C1917] shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Authorization Gate Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-300 bg-white px-4 py-3">
            {!currentUser ? (
              <>
                <div className="flex items-start gap-2.5 min-w-0">
                  <Lock className="mt-0.5 h-4 w-4 text-[#9A3412] shrink-0" />
                  <div className="text-xs text-stone-700">
                    <p className="font-semibold text-[#1C1917]">
                      {t('adminSitesRestrictedTitle')}
                    </p>
                    <p className="mt-0.5">
                      {t('adminSitesRestrictedDesc', { email: ADMIN_EMAIL })}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void handleAdminSignIn()}
                  disabled={signingIn}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#9A3412] px-4 py-2 text-xs font-semibold text-white hover:bg-[#7C2D12] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>{signingIn ? 'Signing in…' : t('adminNotableSignIn')}</span>
                </button>
              </>
            ) : !isAuthorizedAdmin ? (
              <>
                <div className="flex items-start gap-2.5 min-w-0">
                  <AlertCircle className="mt-0.5 h-4 w-4 text-[#9A3412] shrink-0" />
                  <div className="text-xs text-stone-700">
                    <p className="font-semibold text-[#9A3412]">
                      {t('adminSitesRestrictedTitle')}
                    </p>
                    <p className="mt-0.5">
                      {t('adminSitesWrongEmail', {
                        email: currentUser.email || 'unknown account',
                        admin: ADMIN_EMAIL,
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => void handleAdminSignIn()}
                    disabled={signingIn}
                    className="inline-flex items-center gap-1.5 rounded-md bg-[#9A3412] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#7C2D12] transition-colors whitespace-nowrap"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Switch Account</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleAdminSignOut()}
                    className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:border-stone-500 whitespace-nowrap"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>{t('adminNotableSignOut')}</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2.5 text-xs">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="font-semibold text-[#1C1917]">
                      Verified Authorized Personnel
                    </p>
                    <p className="text-stone-600">{currentUser.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void handleAdminSignOut()}
                  className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-[#F8F5F0] px-3 py-1.5 text-xs font-medium text-stone-700 hover:border-[#9A3412] hover:text-[#9A3412] transition-colors whitespace-nowrap"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>{t('adminNotableSignOut')}</span>
                </button>
              </>
            )}
          </div>

          {(authError || syncError || formError) && (
            <div className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 px-3.5 py-2.5 text-xs text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{formError || authError || syncError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="flex items-start gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-900">
              <Check className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          {/* Authorized Workspace: Two Clean Columns (Add Site + Active Directory List) */}
          {isAuthorizedAdmin && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Left: Add Heritage Site Form */}
              <form
                onSubmit={(e) => void handleSubmitAdd(e)}
                className="lg:col-span-6 space-y-4 rounded-lg border border-stone-300 bg-white p-5"
              >
                <div className="border-b border-stone-200 pb-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9A3412]">
                    Create Entry
                  </p>
                  <h3 className="font-serif text-lg font-semibold text-[#1C1917]">
                    {t('adminSitesAddHeading')}
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    Heritage Site Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Bungamati Rato Machhendranath Temple"
                    maxLength={140}
                    className="w-full rounded-md border border-stone-300 bg-[#F8F5F0] px-3 py-2 text-xs text-[#1C1917] placeholder:text-stone-400"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-stone-800 mb-1">
                      Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as HeritageCategory)}
                      className="w-full rounded-md border border-stone-300 bg-[#F8F5F0] px-3 py-2 text-xs font-medium text-[#1C1917]"
                    >
                      {HERITAGE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {translateCategory(cat)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-800 mb-1">
                      Era / Founding Period (optional)
                    </label>
                    <input
                      type="text"
                      value={era}
                      onChange={(e) => setEra(e.target.value)}
                      placeholder="e.g. Licchavi / Malla (16th c.)"
                      maxLength={120}
                      className="w-full rounded-md border border-stone-300 bg-[#F8F5F0] px-3 py-2 text-xs text-[#1C1917] placeholder:text-stone-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    District / Location (optional)
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. Lalitpur South · Bungamati"
                    maxLength={140}
                    className="w-full rounded-md border border-stone-300 bg-[#F8F5F0] px-3 py-2 text-xs text-[#1C1917] placeholder:text-stone-400"
                  />
                </div>

                {/* Image URLs (1 to 5 URLs or watermark-free presets) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="block text-xs font-semibold text-stone-800">
                      Image URLs (1–5 watermark-free HTTPS URLs or presets) *
                    </label>
                    {imageInputs.length < 5 && (
                      <button
                        type="button"
                        onClick={handleAddImageSlot}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#9A3412] hover:underline"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add Image URL</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {imageInputs.map((val, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="h-9 w-12 shrink-0 overflow-hidden rounded border border-stone-300 bg-stone-100 flex items-center justify-center">
                          {val.trim() ? (
                            <img
                              src={resolveHeritageImageSrc(val)}
                              alt={`Preview ${idx + 1}`}
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-stone-400" />
                          )}
                        </div>
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => handleImageChange(idx, e.target.value)}
                          placeholder="https://upload.wikimedia.org/... or preset:budhanilkantha"
                          maxLength={600}
                          className="flex-1 min-w-0 rounded-md border border-stone-300 bg-[#F8F5F0] px-2.5 py-1.5 text-xs text-[#1C1917] placeholder:text-stone-400"
                        />
                        {imageInputs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveImageSlot(idx)}
                            aria-label={`Remove image URL ${idx + 1}`}
                            className="rounded p-1.5 text-stone-500 hover:bg-stone-100 hover:text-red-700"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Quick watermark-free verified preset selector for slot 0 */}
                  <div className="pt-1">
                    <p className="text-[11px] text-stone-500 mb-1">
                      Or apply a verified Wikimedia / Atlas photo as primary image:
                    </p>
                    <select
                      value={
                        HERITAGE_IMAGE_PRESETS.some((p) => p.key === imageInputs[0])
                          ? imageInputs[0]
                          : ''
                      }
                      onChange={(e) => {
                        if (e.target.value) handleImageChange(0, e.target.value);
                      }}
                      className="w-full rounded border border-stone-300 bg-[#EFEAE1] px-2.5 py-1.5 text-[11px] font-medium text-stone-800"
                    >
                      <option value="">Select verified watermark-free photo…</option>
                      {HERITAGE_IMAGE_PRESETS.map((preset) => (
                        <option key={preset.key} value={preset.key}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    Site Description & Historical Context *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Concise architectural summary, sacred lineage, and visitor significance..."
                    maxLength={2000}
                    className="w-full rounded-md border border-stone-300 bg-[#F8F5F0] px-3 py-2 text-xs text-[#1C1917] placeholder:text-stone-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#9A3412] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#7C2D12] disabled:opacity-60 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>{submitting ? 'Saving Site…' : 'Add Site to HERITAGE_SITES'}</span>
                </button>
              </form>

              {/* Right: Live Active HERITAGE_SITES Management */}
              <div className="lg:col-span-6 flex flex-col gap-4">
                <div className="rounded-lg border border-stone-300 bg-white p-5 flex-1">
                  <div className="border-b border-stone-200 pb-3 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9A3412]">
                        Live Directory Control
                      </p>
                      <h3 className="font-serif text-lg font-semibold text-[#1C1917]">
                        {t('adminSitesManageHeading', { count: sites.length })}
                      </h3>
                    </div>
                  </div>

                  {sites.length === 0 ? (
                    <p className="py-8 text-center text-xs text-stone-500">
                      No active heritage sites in directory. Add a site or restore a built-in monument below.
                    </p>
                  ) : (
                    <ul className="mt-3 divide-y divide-stone-200 max-h-[420px] overflow-y-auto pr-1">
                      {sites.map((site) => {
                        const isCustom = Boolean(customSiteRecordMap[site.id]);
                        const isConfirming = confirmRemoveSiteId === site.id;
                        const isBusy = busySiteId === site.id;
                        const imgCount = site.galleryImages?.length ?? 1;
                        return (
                          <li
                            key={site.id}
                            className="flex items-center justify-between gap-3 py-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={site.panoramaImage}
                                alt={site.name}
                                referrerPolicy="no-referrer"
                                className="h-12 w-16 shrink-0 rounded border border-stone-300 object-cover bg-stone-100"
                              />
                              <div className="min-w-0">
                                <p className="truncate font-serif text-sm font-semibold text-[#1C1917]">
                                  {site.name}
                                </p>
                                <p className="truncate text-[11px] text-stone-600">
                                  {translateCategory(site.category)} ·{' '}
                                  {isCustom ? 'Admin Added' : 'Built-in'} · {imgCount}{' '}
                                  {imgCount === 1 ? 'image' : 'images'}
                                </p>
                              </div>
                            </div>

                            <div className="shrink-0">
                              {isConfirming ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => void handleRemoveSite(site)}
                                    className="rounded bg-red-700 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-red-800 disabled:opacity-50"
                                  >
                                    {isBusy ? 'Removing…' : 'Confirm'}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => setConfirmRemoveSiteId(null)}
                                    className="rounded border border-stone-300 bg-white px-2 py-1 text-[11px] font-medium text-stone-700 hover:bg-stone-100"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => setConfirmRemoveSiteId(site.id)}
                                  className="inline-flex items-center gap-1 rounded border border-stone-300 bg-[#F8F5F0] px-2.5 py-1 text-[11px] font-medium text-stone-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700 transition-colors"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  <span>Remove</span>
                                </button>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {/* Restore Removed Built-In Sites */}
                {hiddenBuiltInRecords.length > 0 && (
                  <div className="rounded-lg border border-stone-300 bg-[#EFEAE1] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-700 mb-2">
                      Removed Built-In Monuments ({hiddenBuiltInRecords.length})
                    </p>
                    <ul className="space-y-2">
                      {hiddenBuiltInRecords.map((rec) => (
                        <li
                          key={rec.recordId}
                          className="flex items-center justify-between gap-2 rounded border border-stone-300 bg-white px-3 py-2 text-xs"
                        >
                          <div className="min-w-0">
                            <span className="font-medium text-[#1C1917] truncate block">
                              {rec.name}
                            </span>
                            <span className="text-[11px] text-stone-500">
                              {translateCategory(rec.category)}
                            </span>
                          </div>
                          <button
                            type="button"
                            disabled={busySiteId === rec.recordId}
                            onClick={() =>
                              void handleRestoreBuiltIn(rec.recordId, rec.name)
                            }
                            className="inline-flex items-center gap-1 rounded border border-[#9A3412]/40 bg-[#9A3412]/10 px-2.5 py-1 text-[11px] font-semibold text-[#9A3412] hover:bg-[#9A3412]/20 shrink-0"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Restore</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
