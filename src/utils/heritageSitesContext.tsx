import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { HERITAGE_SITES, HeritageCategory, HeritageSite } from '../data/heritageSites';
import {
  hydrateManagedHeritageSite,
  ManagedHeritageRecord,
  subscribeManagedHeritageSites,
} from './managedSitesDb';
import { setLiveHeritageSitesRegistry } from './heritageShare';

export interface HiddenBuiltInSummary {
  recordId: string;
  targetSiteId: string;
  name: string;
  category: HeritageCategory;
}

interface HeritageSitesContextValue {
  sites: HeritageSite[];
  builtInSites: HeritageSite[];
  hiddenBuiltInRecords: HiddenBuiltInSummary[];
  customSiteRecordMap: Record<string, string>;
  customRecords: ManagedHeritageRecord[];
  isLoading: boolean;
  syncError: string | null;
}

const HeritageSitesContext = createContext<HeritageSitesContextValue>({
  sites: HERITAGE_SITES,
  builtInSites: HERITAGE_SITES,
  hiddenBuiltInRecords: [],
  customSiteRecordMap: {},
  customRecords: [],
  isLoading: false,
  syncError: null,
});

export const HeritageSitesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [records, setRecords] = useState<ManagedHeritageRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeManagedHeritageSites(
      (items) => {
        setRecords(items);
        setIsLoading(false);
        setSyncError(null);
      },
      (err) => {
        setIsLoading(false);
        setSyncError(err.message);
      }
    );
    return () => unsubscribe();
  }, []);

  const value = useMemo<HeritageSitesContextValue>(() => {
    const hideRecords = records.filter((r) => r.actionType === 'hide');
    const addRecords = records.filter((r) => r.actionType === 'add');

    const hiddenIdSet = new Set(hideRecords.map((r) => r.targetSiteId));
    const visibleBuiltIns = HERITAGE_SITES.filter((s) => !hiddenIdSet.has(s.id));

    const customSiteRecordMap: Record<string, string> = {};
    const customSites: HeritageSite[] = addRecords.map((rec) => {
      customSiteRecordMap[rec.targetSiteId] = rec.id;
      return hydrateManagedHeritageSite(rec);
    });

    const combinedSites = [...visibleBuiltIns, ...customSites];

    // Keep share / QR canvas helpers synchronized with live HERITAGE_SITES list
    setLiveHeritageSitesRegistry(combinedSites);

    const hiddenBuiltInRecords: HiddenBuiltInSummary[] = hideRecords.map((r) => ({
      recordId: r.id,
      targetSiteId: r.targetSiteId,
      name: r.name,
      category: r.category,
    }));

    return {
      sites: combinedSites,
      builtInSites: HERITAGE_SITES,
      hiddenBuiltInRecords,
      customSiteRecordMap,
      customRecords: addRecords,
      isLoading,
      syncError,
    };
  }, [records, isLoading, syncError]);

  return (
    <HeritageSitesContext.Provider value={value}>
      {children}
    </HeritageSitesContext.Provider>
  );
};

export function useHeritageSites(): HeritageSitesContextValue {
  return useContext(HeritageSitesContext);
}
