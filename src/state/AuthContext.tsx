/**
 * Music-account connection state (Spotify OR Apple Music) shared across
 * the app. Each user connects their own personal account.
 */
import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';

import {
  ALL_PROVIDERS,
  getActiveProvider,
  getProvider,
  setActiveProvider,
  type MusicProviderId,
} from '@/services/music';
import {logger} from '@/utils/logger';

export interface ProviderOption {
  id: MusicProviderId;
  label: string;
  available: boolean;
}

interface AuthContextValue {
  loading: boolean;
  /** The provider the user connected, or null. */
  providerId: MusicProviderId | null;
  providerLabel: string | null;
  connected: boolean;
  /** e.g. "Yuval (Premium)" / "Apple Music (subscribed)". */
  accountLabel: string | null;
  /** Whether the account tier can play full tracks at alarm time. */
  canPlayFullTracks: boolean;
  providers: ProviderOption[];
  connect: (id: MusicProviderId) => Promise<void>;
  disconnect: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [loading, setLoading] = useState(true);
  const [providerId, setProviderId] = useState<MusicProviderId | null>(null);
  const [connected, setConnected] = useState(false);
  const [accountLabel, setAccountLabel] = useState<string | null>(null);
  const [canPlay, setCanPlay] = useState(false);
  const [providers, setProviders] = useState<ProviderOption[]>([]);

  const refreshState = useCallback(async () => {
    const options: ProviderOption[] = await Promise.all(
      ALL_PROVIDERS.map(async p => ({
        id: p.id,
        label: p.label,
        available: await p.isAvailable().catch(() => false),
      })),
    );
    setProviders(options);

    const active = await getActiveProvider();
    if (active && (await active.isConnected().catch(() => false))) {
      setProviderId(active.id);
      setConnected(true);
      setAccountLabel(await active.getAccountLabel().catch(() => null));
      setCanPlay(await active.canPlayFullTracks().catch(() => false));
    } else {
      setProviderId(null);
      setConnected(false);
      setAccountLabel(null);
      setCanPlay(false);
    }
  }, []);

  useEffect(() => {
    refreshState()
      .catch(e => logger.warn('Auth refresh failed', e))
      .finally(() => setLoading(false));
  }, [refreshState]);

  const connect = useCallback(
    async (id: MusicProviderId) => {
      const provider = getProvider(id);
      await provider.connect();
      await setActiveProvider(id);
      await refreshState();
    },
    [refreshState],
  );

  const disconnect = useCallback(async () => {
    const active = await getActiveProvider();
    if (active) {
      await active.disconnect();
    }
    await setActiveProvider(null);
    await refreshState();
  }, [refreshState]);

  const value = useMemo(
    () => ({
      loading,
      providerId,
      providerLabel: providerId ? getProvider(providerId).label : null,
      connected,
      accountLabel,
      canPlayFullTracks: canPlay,
      providers,
      connect,
      disconnect,
    }),
    [loading, providerId, connected, accountLabel, canPlay, providers, connect, disconnect],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
