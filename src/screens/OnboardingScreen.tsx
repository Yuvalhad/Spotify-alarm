/**
 * Onboarding: what the app does, Spotify connect, permission requests, and an
 * HONEST explanation of iOS limitations (per product requirement).
 */
import React, {useState} from 'react';
import {Platform, ScrollView, StyleSheet, Switch, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import PrimaryButton from '@/components/PrimaryButton';
import type {RootStackParamList} from '@/navigation/types';
import {useAuth} from '@/state/AuthContext';
import {
  openExactAlarmSettings,
  requestMicrophonePermission,
  requestNotificationPermission,
  checkExactAlarmPermission,
} from '@/services/permissions/permissions';
import {saveSettings} from '@/services/storage/settingsStorage';
import {colors, spacing, typography} from '@/theme/theme';
import {logger} from '@/utils/logger';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export default function OnboardingScreen({navigation}: Props) {
  const {connected} = useAuth();
  const [notifGranted, setNotifGranted] = useState(false);
  const [micConsent, setMicConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  const requestPermissions = async () => {
    setBusy(true);
    try {
      const notif = await requestNotificationPermission();
      setNotifGranted(notif === 'granted');
      if (micConsent) {
        await requestMicrophonePermission();
      }
      if (Platform.OS === 'android') {
        const exact = await checkExactAlarmPermission();
        if (exact !== 'granted') {
          await openExactAlarmSettings();
        }
      }
    } catch (e) {
      logger.warn('Permission request failed', e);
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    await saveSettings({onboardingCompleted: true, micProcessingConsent: micConsent});
    navigation.reset({index: 0, routes: [{name: 'AlarmList'}]});
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.logo}>⏰🎵</Text>
      <Text style={typography.title}>WakeTune</Text>
      <Text style={styles.lead}>
        Wake up to a song you love from your Spotify — and the alarm won't stop until you
        prove you're really awake: type the lyrics, sing along, or dance.
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Connect Spotify</Text>
        <Text style={styles.sectionBody}>
          WakeTune picks a track from your Liked Songs, Top Tracks, playlists or favorite
          artists. Full-song playback requires Spotify Premium — otherwise we use a built-in
          alarm sound.
        </Text>
        <PrimaryButton
          title={connected ? '✓ Spotify connected' : 'Connect Spotify'}
          disabled={connected}
          onPress={() => navigation.navigate('SpotifyLogin')}
          style={styles.sectionButton}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Permissions</Text>
        <Text style={styles.sectionBody}>
          • Notifications — required, this is how the alarm rings.{'\n'}
          {Platform.OS === 'android'
            ? '• Alarms & reminders — required for exact alarm timing.\n'
            : ''}
          • Microphone — optional, only for the sing-along challenge. Audio is processed on
          your device and never recorded or uploaded.{'\n'}
          • Motion sensors — used for the dance challenge (no special permission needed).
        </Text>
        <View style={styles.consentRow}>
          <Text style={styles.consentText}>Enable sing-along challenge (microphone)</Text>
          <Switch
            value={micConsent}
            onValueChange={setMicConsent}
            trackColor={{true: colors.primary, false: colors.border}}
          />
        </View>
        <PrimaryButton
          title={notifGranted ? '✓ Permissions granted' : 'Grant permissions'}
          onPress={requestPermissions}
          loading={busy}
          variant="secondary"
          style={styles.sectionButton}
        />
      </View>

      {Platform.OS === 'ios' && (
        <View style={[styles.section, styles.warningBox]}>
          <Text style={styles.sectionTitle}>⚠️ A note about iPhone</Text>
          <Text style={styles.sectionBody}>
            iOS limits what apps can do while fully closed. For the most reliable wake-up:
            {'\n'}• Don't force-quit WakeTune before sleeping (leave it in the app switcher).
            {'\n'}• Allow notifications, and allow Time-Sensitive notifications in your Focus
            / Sleep mode settings.
            {'\n'}• If WakeTune is closed, the alarm rings as a notification first — Spotify
            starts playing when you open it.
          </Text>
        </View>
      )}

      <View style={[styles.section, styles.warningBox]}>
        <Text style={styles.sectionTitle}>🛟 Safety first</Text>
        <Text style={styles.sectionBody}>
          Do wake-up challenges in a safe place — never while driving and not near stairs.
          A hidden emergency stop (long-press 10 seconds) always exists.
        </Text>
      </View>

      <PrimaryButton title="Let's go →" onPress={finish} style={styles.cta} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  content: {padding: spacing.lg, paddingBottom: spacing.xxl},
  logo: {fontSize: 64, marginTop: spacing.xl, marginBottom: spacing.sm},
  lead: {...typography.body, color: colors.textSecondary, marginTop: spacing.md, lineHeight: 24},
  section: {marginTop: spacing.xl},
  sectionTitle: {fontSize: 18, fontWeight: '700', color: colors.textPrimary},
  sectionBody: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  sectionButton: {marginTop: spacing.md},
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  consentText: {flex: 1, fontSize: 15, color: colors.textPrimary, marginRight: spacing.md},
  warningBox: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cta: {marginTop: spacing.xl},
});
