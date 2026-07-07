/**
 * Spotify OAuth screen. The actual flow (Authorization Code + PKCE in the
 * system browser) lives in services/spotify/spotifyAuth.ts; tokens go to the
 * platform secure store only.
 */
import React, {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import PrimaryButton from '@/components/PrimaryButton';
import type {RootStackParamList} from '@/navigation/types';
import {useAuth} from '@/state/AuthContext';
import {SPOTIFY_SCOPES} from '@/services/spotify/spotifyAuth';
import {colors, spacing, typography} from '@/theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SpotifyLogin'>;

export default function SpotifyLoginScreen({navigation}: Props) {
  const {connected, profile, isPremium, connect, disconnect} = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setBusy(true);
    setError(null);
    try {
      await connect();
      navigation.goBack();
    } catch (e) {
      setError(
        e instanceof Error && e.message.includes('cancel')
          ? null // user cancelled the browser flow - not an error
          : 'Could not connect to Spotify. Check your connection and try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.emoji}>🎧</Text>
      <Text style={typography.title}>
        {connected ? `Hi, ${profile?.display_name ?? 'there'}!` : 'Connect your Spotify'}
      </Text>

      {connected ? (
        <>
          <Text style={styles.body}>
            Account type: {isPremium ? 'Premium ✓' : 'Free'}
            {'\n'}
            {!isPremium &&
              'Heads up: starting full songs at alarm time requires Spotify Premium. ' +
                'Your alarms will use the built-in fallback sound instead.'}
          </Text>
          <PrimaryButton
            title="Disconnect"
            variant="danger"
            onPress={async () => {
              await disconnect();
            }}
            style={styles.button}
          />
        </>
      ) : (
        <>
          <Text style={styles.body}>
            WakeTune uses Spotify's official login (OAuth). Your password never touches this
            app, and tokens are stored in your device's secure keychain.
          </Text>
          <Text style={styles.scopes}>
            Access requested:{'\n'}
            {SPOTIFY_SCOPES.map(s => `• ${s}`).join('\n')}
          </Text>
          {error && <Text style={styles.error}>{error}</Text>}
          <PrimaryButton
            title="Continue with Spotify"
            onPress={handleConnect}
            loading={busy}
            style={styles.button}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background, padding: spacing.lg},
  emoji: {fontSize: 56, marginTop: spacing.xl, marginBottom: spacing.md},
  body: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: spacing.md,
    lineHeight: 22,
  },
  scopes: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.md,
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  error: {color: colors.danger, marginTop: spacing.md},
  button: {marginTop: spacing.xl},
});
