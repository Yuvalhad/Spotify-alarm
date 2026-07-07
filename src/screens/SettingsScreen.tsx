/**
 * Settings: Spotify connection, permission health-check, fallback sound,
 * test alarm, privacy, logout.
 */
import React, {useCallback, useEffect, useState} from 'react';
import {Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import PrimaryButton from '@/components/PrimaryButton';
import type {RootStackParamList} from '@/navigation/types';
import type {Alarm} from '@/types';
import {useAuth} from '@/state/AuthContext';
import {useAlarms} from '@/state/AlarmsContext';
import {alarmScheduler} from '@/services/alarms/alarmScheduler';
import {FALLBACK_SOUNDS} from '@/services/audio/fallbackSound';
import {
  getPermissionsSnapshot,
  openBatteryOptimizationSettings,
  openExactAlarmSettings,
  requestMicrophonePermission,
  requestNotificationPermission,
  type PermissionsSnapshot,
} from '@/services/permissions/permissions';
import {loadSettings, saveSettings} from '@/services/storage/settingsStorage';
import {colors, radius, spacing} from '@/theme/theme';
import {generateId} from '@/utils/random';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({navigation}: Props) {
  const {connected, profile, isPremium, disconnect} = useAuth();
  const {alarms} = useAlarms();
  const [perms, setPerms] = useState<PermissionsSnapshot | null>(null);
  const [fallbackSound, setFallbackSound] = useState('classic_beep');

  const refresh = useCallback(async () => {
    const [snapshot, settings] = await Promise.all([getPermissionsSnapshot(), loadSettings()]);
    setPerms(snapshot);
    setFallbackSound(settings.defaultFallbackSound);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const testAlarm = async () => {
    // Use the first alarm as a template, or a sane default.
    const template: Alarm = alarms[0] ?? {
      id: `test-${generateId()}`,
      time: {hour: 0, minute: 0},
      daysOfWeek: [],
      enabled: true,
      musicSourceType: 'top_tracks',
      trackPickStrategy: 'random',
      challengeMode: 'lyrics',
      difficulty: 'easy',
      gradualVolumeEnabled: false,
      fallbackSound,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await alarmScheduler.scheduleTestAlarm(template, 10);
    Alert.alert(
      'Test alarm scheduled',
      'The alarm will ring in ~10 seconds. Lock your phone to test the real experience.',
    );
  };

  const selectFallback = async (key: string) => {
    setFallbackSound(key);
    await saveSettings({defaultFallbackSound: key});
  };

  const permBadge = (state?: string) => (state === 'granted' ? '✅' : '❌');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Spotify */}
      <Text style={styles.section}>Spotify</Text>
      <View style={styles.card}>
        <Text style={styles.cardText}>
          {connected
            ? `Connected as ${profile?.display_name ?? profile?.id ?? 'unknown'} (${
                isPremium ? 'Premium' : 'Free'
              })`
            : 'Not connected'}
        </Text>
        {connected && !isPremium && (
          <Text style={styles.warn}>
            Free account: alarms will ring with the built-in sound. Full-song playback
            requires Premium.
          </Text>
        )}
        <PrimaryButton
          title={connected ? 'Manage connection' : 'Connect Spotify'}
          variant="secondary"
          onPress={() => navigation.navigate('SpotifyLogin')}
          style={styles.cardButton}
        />
      </View>

      {/* Permissions */}
      <Text style={styles.section}>Permissions</Text>
      <View style={styles.card}>
        <Pressable style={styles.permRow} onPress={() => requestNotificationPermission().then(refresh)}>
          <Text style={styles.cardText}>Notifications</Text>
          <Text style={styles.badge}>{permBadge(perms?.notifications)}</Text>
        </Pressable>
        {Platform.OS === 'android' && (
          <Pressable style={styles.permRow} onPress={() => openExactAlarmSettings().then(refresh)}>
            <Text style={styles.cardText}>Alarms & reminders (exact alarms)</Text>
            <Text style={styles.badge}>{permBadge(perms?.exactAlarm)}</Text>
          </Pressable>
        )}
        <Pressable style={styles.permRow} onPress={() => requestMicrophonePermission().then(refresh)}>
          <Text style={styles.cardText}>Microphone (sing-along challenge)</Text>
          <Text style={styles.badge}>{permBadge(perms?.microphone)}</Text>
        </Pressable>
        {Platform.OS === 'android' && (
          <PrimaryButton
            title="Battery optimization settings"
            variant="secondary"
            onPress={openBatteryOptimizationSettings}
            style={styles.cardButton}
          />
        )}
        <Text style={styles.hint}>
          Tap a row to request / open settings. On some Android devices you must also exclude
          WakeTune from battery optimization for reliable alarms.
        </Text>
      </View>

      {/* Fallback sound */}
      <Text style={styles.section}>Fallback alarm sound</Text>
      <View style={styles.card}>
        <Text style={styles.hint}>
          Used whenever Spotify can't play (no Premium, no device, offline).
        </Text>
        <View style={styles.chipWrap}>
          {FALLBACK_SOUNDS.map(s => (
            <Pressable
              key={s.key}
              onPress={() => selectFallback(s.key)}
              style={[styles.chip, fallbackSound === s.key && styles.chipActive]}>
              <Text
                style={[styles.chipText, fallbackSound === s.key && styles.chipTextActive]}>
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Test */}
      <Text style={styles.section}>Testing</Text>
      <View style={styles.card}>
        <PrimaryButton title="🔔 Test alarm (rings in 10s)" onPress={testAlarm} />
      </View>

      {/* Privacy */}
      <Text style={styles.section}>Privacy</Text>
      <View style={styles.card}>
        <Text style={styles.hint}>
          • Everything is stored on your device — there is no WakeTune server.{'\n'}
          • Spotify tokens live in the secure keychain and are used only to talk to Spotify's
          official API.{'\n'}
          • Microphone audio is analyzed in real time on-device for the sing-along challenge
          and is never recorded or uploaded.{'\n'}
          • Motion sensor data never leaves your device.{'\n'}
          • You can revoke WakeTune's Spotify access anytime.
        </Text>
        <PrimaryButton
          title="Revoke access on spotify.com"
          variant="secondary"
          onPress={() => Linking.openURL('https://www.spotify.com/account/apps/')}
          style={styles.cardButton}
        />
      </View>

      {/* Logout */}
      {connected && (
        <PrimaryButton
          title="Log out of Spotify"
          variant="danger"
          onPress={() =>
            Alert.alert('Log out?', 'Alarms will use the built-in sound until you reconnect.', [
              {text: 'Cancel', style: 'cancel'},
              {text: 'Log out', style: 'destructive', onPress: disconnect},
            ])
          }
          style={styles.logout}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  content: {padding: spacing.md, paddingBottom: spacing.xxl},
  section: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardText: {fontSize: 15, color: colors.textPrimary},
  cardButton: {marginTop: spacing.md, minHeight: 44},
  warn: {fontSize: 13, color: colors.warning, marginTop: spacing.sm},
  hint: {fontSize: 13, color: colors.textMuted, lineHeight: 20},
  permRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  badge: {fontSize: 16},
  chipWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md},
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {backgroundColor: colors.primary, borderColor: colors.primary},
  chipText: {color: colors.textSecondary, fontSize: 14, fontWeight: '600'},
  chipTextActive: {color: colors.onPrimary},
  logout: {marginTop: spacing.xl},
});
