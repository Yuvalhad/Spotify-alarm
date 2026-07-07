/**
 * Create / edit an alarm: time, repeat days, music source (incl. playlist
 * picker), challenge mode, difficulty, gradual volume.
 */
import React, {useEffect, useMemo, useState} from 'react';
import {Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import PrimaryButton from '@/components/PrimaryButton';
import type {RootStackParamList} from '@/navigation/types';
import type {Alarm, ChallengeMode, Difficulty, MusicSourceType} from '@/types';
import {useAlarms} from '@/state/AlarmsContext';
import {useAuth} from '@/state/AuthContext';
import {getActiveProvider, type MusicPlaylist} from '@/services/music';
import {loadSettings} from '@/services/storage/settingsStorage';
import {colors, radius, spacing} from '@/theme/theme';
import {generateId} from '@/utils/random';
import {logger} from '@/utils/logger';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateAlarm'>;

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const SOURCES: {key: MusicSourceType; label: string}[] = [
  {key: 'liked_songs', label: '♥ Liked Songs'},
  {key: 'top_tracks', label: '🔥 Top Tracks'},
  {key: 'playlist', label: '🎧 Playlist'},
  {key: 'artist', label: '🎤 Favorite Artist'},
  {key: 'random_library', label: '🎲 Random'},
];

const CHALLENGES: {key: ChallengeMode; label: string}[] = [
  {key: 'lyrics', label: '⌨️ Type lyrics'},
  {key: 'singing', label: '🎙 Sing'},
  {key: 'dance', label: '💃 Dance'},
  {key: 'random', label: '🎲 Surprise'},
];

const DIFFICULTIES: {key: Difficulty; label: string}[] = [
  {key: 'easy', label: 'Easy'},
  {key: 'medium', label: 'Medium'},
  {key: 'hard', label: 'Hard'},
];

export default function CreateAlarmScreen({navigation, route}: Props) {
  const {alarms, saveAlarm} = useAlarms();
  const {connected} = useAuth();
  const editing = route.params?.alarmId
    ? alarms.find(a => a.id === route.params?.alarmId)
    : undefined;

  const [time, setTime] = useState(() => {
    const d = new Date();
    d.setHours(editing?.time.hour ?? 7, editing?.time.minute ?? 0, 0, 0);
    return d;
  });
  const [showTimePicker, setShowTimePicker] = useState(Platform.OS === 'ios');
  const [days, setDays] = useState<number[]>(editing?.daysOfWeek ?? []);
  const [source, setSource] = useState<MusicSourceType>(editing?.musicSourceType ?? 'top_tracks');
  const [playlistId, setPlaylistId] = useState<string | undefined>(editing?.musicPlaylistId);
  const [playlists, setPlaylists] = useState<MusicPlaylist[]>([]);
  const [challenge, setChallenge] = useState<ChallengeMode>(editing?.challengeMode ?? 'lyrics');
  const [difficulty, setDifficulty] = useState<Difficulty>(editing?.difficulty ?? 'easy');
  const [gradualVolume, setGradualVolume] = useState(editing?.gradualVolumeEnabled ?? true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (source === 'playlist' && connected && playlists.length === 0) {
      getActiveProvider()
        .then(provider => (provider ? provider.getPlaylists() : []))
        .then(setPlaylists)
        .catch(e => logger.warn('Failed to load playlists', e));
    }
  }, [source, connected, playlists.length]);

  const toggleDay = (day: number) =>
    setDays(prev => (prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]));

  const canSave = useMemo(
    () => source !== 'playlist' || !!playlistId,
    [source, playlistId],
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const settings = await loadSettings();
      const now = new Date().toISOString();
      const alarm: Alarm = {
        id: editing?.id ?? generateId(),
        time: {hour: time.getHours(), minute: time.getMinutes()},
        daysOfWeek: [...days].sort((a, b) => a - b),
        enabled: true,
        musicProvider: editing?.musicProvider ?? settings.musicProvider ?? undefined,
        musicSourceType: source,
        musicPlaylistId: source === 'playlist' ? playlistId : undefined,
        spotifyArtistId: editing?.spotifyArtistId,
        trackPickStrategy: editing?.trackPickStrategy ?? 'random',
        challengeMode: challenge,
        difficulty,
        gradualVolumeEnabled: gradualVolume,
        fallbackSound: editing?.fallbackSound ?? settings.defaultFallbackSound,
        createdAt: editing?.createdAt ?? now,
        updatedAt: now,
      };
      await saveAlarm(alarm);
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Time */}
      <Text style={styles.label}>Wake-up time</Text>
      {Platform.OS === 'android' && (
        <Pressable onPress={() => setShowTimePicker(true)} style={styles.timeButton}>
          <Text style={styles.timeText}>
            {String(time.getHours()).padStart(2, '0')}:{String(time.getMinutes()).padStart(2, '0')}
          </Text>
        </Pressable>
      )}
      {showTimePicker && (
        <DateTimePicker
          value={time}
          mode="time"
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          themeVariant="dark"
          onChange={(event, selected) => {
            if (Platform.OS === 'android') {
              setShowTimePicker(false);
            }
            if (selected) {
              setTime(selected);
            }
          }}
        />
      )}

      {/* Repeat days */}
      <Text style={styles.label}>Repeat</Text>
      <View style={styles.daysRow}>
        {DAYS.map((d, i) => (
          <Pressable
            key={i}
            onPress={() => toggleDay(i)}
            style={[styles.dayChip, days.includes(i) && styles.chipActive]}>
            <Text style={[styles.chipText, days.includes(i) && styles.chipTextActive]}>{d}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.hint}>{days.length === 0 ? 'Rings once' : 'Repeats weekly'}</Text>

      {/* Music source */}
      <Text style={styles.label}>Music source</Text>
      {!connected && (
        <Text style={styles.warning}>
          No music account connected — the alarm will use the built-in fallback sound.
        </Text>
      )}
      <View style={styles.chipWrap}>
        {SOURCES.map(s => (
          <Pressable
            key={s.key}
            onPress={() => setSource(s.key)}
            style={[styles.chip, source === s.key && styles.chipActive]}>
            <Text style={[styles.chipText, source === s.key && styles.chipTextActive]}>
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>
      {source === 'playlist' && (
        <View style={styles.chipWrap}>
          {playlists.length === 0 ? (
            <Text style={styles.hint}>
              {connected ? 'Loading playlists…' : 'Connect your music account to choose a playlist.'}
            </Text>
          ) : (
            playlists.map(p => (
              <Pressable
                key={p.id}
                onPress={() => setPlaylistId(p.id)}
                style={[styles.chip, playlistId === p.id && styles.chipActive]}>
                <Text
                  style={[styles.chipText, playlistId === p.id && styles.chipTextActive]}
                  numberOfLines={1}>
                  {p.name}
                </Text>
              </Pressable>
            ))
          )}
        </View>
      )}

      {/* Challenge */}
      <Text style={styles.label}>Wake-up challenge</Text>
      <View style={styles.chipWrap}>
        {CHALLENGES.map(c => (
          <Pressable
            key={c.key}
            onPress={() => setChallenge(c.key)}
            style={[styles.chip, challenge === c.key && styles.chipActive]}>
            <Text style={[styles.chipText, challenge === c.key && styles.chipTextActive]}>
              {c.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Difficulty */}
      <Text style={styles.label}>Difficulty</Text>
      <View style={styles.chipWrap}>
        {DIFFICULTIES.map(d => (
          <Pressable
            key={d.key}
            onPress={() => setDifficulty(d.key)}
            style={[styles.chip, difficulty === d.key && styles.chipActive]}>
            <Text style={[styles.chipText, difficulty === d.key && styles.chipTextActive]}>
              {d.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Volume */}
      <View style={styles.switchRow}>
        <View style={styles.switchInfo}>
          <Text style={styles.switchLabel}>Gradual volume</Text>
          <Text style={styles.hint}>Starts quiet and rises over ~45 seconds</Text>
        </View>
        <Switch
          value={gradualVolume}
          onValueChange={setGradualVolume}
          trackColor={{true: colors.primary, false: colors.border}}
        />
      </View>

      <PrimaryButton
        title={editing ? 'Save changes' : 'Save alarm'}
        onPress={handleSave}
        disabled={!canSave}
        loading={saving}
        style={styles.save}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  content: {padding: spacing.md, paddingBottom: spacing.xxl},
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timeButton: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  timeText: {fontSize: 48, fontWeight: '800', color: colors.textPrimary},
  daysRow: {flexDirection: 'row', justifyContent: 'space-between'},
  dayChip: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: '100%',
  },
  chipActive: {backgroundColor: colors.primary, borderColor: colors.primary},
  chipText: {color: colors.textSecondary, fontSize: 14, fontWeight: '600'},
  chipTextActive: {color: colors.onPrimary},
  hint: {fontSize: 13, color: colors.textMuted, marginTop: spacing.xs},
  warning: {fontSize: 13, color: colors.warning, marginBottom: spacing.sm},
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  switchInfo: {flex: 1},
  switchLabel: {fontSize: 16, fontWeight: '600', color: colors.textPrimary},
  save: {marginTop: spacing.xl},
});
