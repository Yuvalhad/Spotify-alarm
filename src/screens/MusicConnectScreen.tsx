/**
 * Connect your music: the user picks Spotify OR Apple Music and signs in
 * with their own personal account.
 *  - Spotify: OAuth PKCE in the system browser (both platforms).
 *  - Apple Music: MusicKit authorization - the Apple ID already on the
 *    device (iOS; Android marked as coming later).
 */
import React, {useState} from 'react';
import {Platform, ScrollView, StyleSheet, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import PrimaryButton from '@/components/PrimaryButton';
import type {RootStackParamList} from '@/navigation/types';
import {useAuth} from '@/state/AuthContext';
import {SPOTIFY_CLIENT_ID, SPOTIFY_SCOPES} from '@/services/spotify/spotifyAuth';
import type {MusicProviderId} from '@/services/music';
import {colors, radius, spacing, typography} from '@/theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'MusicConnect'>;

/** True until the developer pastes a real Client ID into src/config.ts. */
const SPOTIFY_CLIENT_ID_MISSING = SPOTIFY_CLIENT_ID.startsWith('PASTE_');

export default function MusicConnectScreen({navigation}: Props) {
  const {connected, providerId, providerLabel, accountLabel, canPlayFullTracks, providers, connect, disconnect} =
    useAuth();
  const [busy, setBusy] = useState<MusicProviderId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (id: MusicProviderId) => {
    setBusy(id);
    setError(null);
    try {
      await connect(id);
      navigation.goBack();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      setError(
        msg.toLowerCase().includes('cancel')
          ? null // user cancelled - not an error
          : msg || 'Connection failed. Check your network and try again.',
      );
    } finally {
      setBusy(null);
    }
  };

  const appleAvailable = providers.find(p => p.id === 'apple_music')?.available ?? false;

  if (connected) {
    return (
      <View style={styles.screen}>
        <Text style={styles.emoji}>{providerId === 'apple_music' ? '🍎' : '🎧'}</Text>
        <Text style={typography.title}>Connected to {providerLabel}</Text>
        <Text style={styles.body}>
          {accountLabel ?? ''}
          {!canPlayFullTracks &&
            '\n\nHeads up: playing full songs at alarm time requires ' +
              (providerId === 'apple_music' ? 'an Apple Music subscription' : 'Spotify Premium') +
              '. Your alarms will use the built-in fallback sound instead.'}
        </Text>
        <PrimaryButton
          title="Disconnect"
          variant="danger"
          onPress={async () => {
            await disconnect();
          }}
          style={styles.button}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.emoji}>🎵</Text>
      <Text style={typography.title}>Connect your music</Text>
      <Text style={styles.body}>
        Wake up to songs from your own library. Pick your service - you sign in with your
        personal account, and your credentials never touch this app.
      </Text>

      {/* Spotify */}
      <View style={styles.providerCard}>
        <Text style={styles.providerName}>🎧 Spotify</Text>
        <Text style={styles.providerNote}>
          Official Spotify login in your browser. Full-song playback requires Premium.
        </Text>
        {SPOTIFY_CLIENT_ID_MISSING && (
          <Text style={styles.error}>
            Setup needed: this build has no Spotify Client ID yet (src/config.ts, see
            docs/SPOTIFY_SETUP.md).
          </Text>
        )}
        <PrimaryButton
          title="Continue with Spotify"
          onPress={() => handleConnect('spotify')}
          loading={busy === 'spotify'}
          disabled={SPOTIFY_CLIENT_ID_MISSING || busy !== null}
          style={styles.providerButton}
        />
      </View>

      {/* Apple Music */}
      <View style={styles.providerCard}>
        <Text style={styles.providerName}>🍎 Apple Music</Text>
        <Text style={styles.providerNote}>
          {appleAvailable
            ? 'Uses the Apple ID already signed in on this iPhone - one tap, no passwords. ' +
              'Full-song playback requires an Apple Music subscription.'
            : Platform.OS === 'android'
              ? 'Coming to Android soon - available on iPhone for now.'
              : 'Not available in this build (MusicKit module not linked - see docs/APPLE_MUSIC_SETUP.md).'}
        </Text>
        <PrimaryButton
          title="Continue with Apple Music"
          onPress={() => handleConnect('apple_music')}
          loading={busy === 'apple_music'}
          disabled={!appleAvailable || busy !== null}
          style={styles.providerButton}
        />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.scopes}>
        Spotify access requested:{'\n'}
        {SPOTIFY_SCOPES.map(s => `• ${s}`).join('\n')}
        {'\n\n'}Apple Music access: media library authorization only (managed by iOS).
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  content: {padding: spacing.lg, paddingBottom: spacing.xxl},
  emoji: {fontSize: 56, marginTop: spacing.xl, marginBottom: spacing.md},
  body: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: spacing.md,
    lineHeight: 22,
  },
  providerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  providerName: {fontSize: 18, fontWeight: '800', color: colors.textPrimary},
  providerNote: {fontSize: 13, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 19},
  providerButton: {marginTop: spacing.md},
  scopes: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xl,
    lineHeight: 19,
    fontFamily: 'monospace',
  },
  error: {color: colors.danger, marginTop: spacing.md, fontSize: 13},
  button: {marginTop: spacing.xl},
});
