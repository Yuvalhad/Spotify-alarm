/**
 * Spotify connection state shared across the app.
 */
import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';

import {
  isSpotifyConnected,
  loginWithSpotify,
  logoutSpotify,
} from '@/services/spotify/spotifyAuth';
import {getMe} from '@/services/spotify/spotifyApi';
import type {SpotifyUserProfile} from '@/services/spotify/spotifyTypes';
import {logger} from '@/utils/logger';

interface AuthContextValue {
  loading: boolean;
  connected: boolean;
  profile: SpotifyUserProfile | null;
  isPremium: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [profile, setProfile] = useState<SpotifyUserProfile | null>(null);

  const refreshProfile = useCallback(async () => {
    try {
      const me = await getMe();
      setProfile(me);
    } catch (e) {
      logger.warn('Failed to load Spotify profile', e);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const isConnected = await isSpotifyConnected();
      setConnected(isConnected);
      if (isConnected) {
        await refreshProfile();
      }
      setLoading(false);
    })();
  }, [refreshProfile]);

  const connect = useCallback(async () => {
    await loginWithSpotify();
    setConnected(true);
    await refreshProfile();
  }, [refreshProfile]);

  const disconnect = useCallback(async () => {
    await logoutSpotify();
    setConnected(false);
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      loading,
      connected,
      profile,
      isPremium: profile?.product === 'premium',
      connect,
      disconnect,
    }),
    [loading, connected, profile, connect, disconnect],
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
