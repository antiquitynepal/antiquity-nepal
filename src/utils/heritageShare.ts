import { HERITAGE_SITES, HeritageSite } from '../data/heritageSites';

export type QRTargetId = 'atlas' | string;

let liveSitesRegistry: HeritageSite[] = HERITAGE_SITES;

export function setLiveHeritageSitesRegistry(sites: HeritageSite[]): void {
  liveSitesRegistry = sites;
}

export function getLiveHeritageSitesRegistry(): HeritageSite[] {
  return liveSitesRegistry;
}

export function findHeritageSite(
  targetId: QRTargetId,
  sites: HeritageSite[] = liveSitesRegistry
): HeritageSite | null {
  if (targetId === 'atlas') return null;
  return sites.find((s) => s.id === targetId || s.slug === targetId) ?? null;
}

export function buildHeritageShareUrl(
  targetId: QRTargetId = 'atlas',
  sites: HeritageSite[] = liveSitesRegistry
): string {
  if (typeof window === 'undefined') {
    return targetId === 'atlas'
      ? 'https://kathmandu-heritage-atlas.app/'
      : `https://kathmandu-heritage-atlas.app/?site=${targetId}`;
  }
  const url = new URL(window.location.href);
  url.hash = '';
  url.searchParams.delete('view');
  if (targetId === 'atlas') {
    url.searchParams.delete('site');
  } else {
    const site = findHeritageSite(targetId, sites);
    url.searchParams.set('site', site ? site.slug : targetId);
  }
  return url.toString();
}

export interface HeritageSharePayload {
  site: HeritageSite | null;
  title: string;
  subtitle: string;
  message: string;
  url: string;
}

export function getHeritageSharePayload(
  targetId: QRTargetId = 'atlas',
  sites: HeritageSite[] = liveSitesRegistry
): HeritageSharePayload {
  const site = findHeritageSite(targetId, sites);
  const url = buildHeritageShareUrl(targetId, sites);

  if (site) {
    return {
      site,
      title: `${site.name} — Suraj Giri's Kathmandu Heritage Atlas`,
      subtitle: `${site.district} · ${site.category}`,
      message: `Explore ${site.name} (${site.district}) in 360° interactive views, arrival routes, and audio guides on Suraj Giri's Kathmandu Heritage Atlas:`,
      url,
    };
  }

  return {
    site: null,
    title: "Suraj Giri's Kathmandu Heritage Atlas — 360° Tours & Routes",
    subtitle: `${sites.length} Heritage Zones · Antiquity Nepal`,
    message:
      `Explore Kathmandu Valley's ${sites.length} heritage sites in 360° panoramas, interactive routes, audio guides, and trip itineraries on Suraj Giri's Kathmandu Heritage Atlas:`,
    url,
  };
}
