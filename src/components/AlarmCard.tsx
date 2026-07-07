import React from 'react';
import {Pressable, StyleSheet, Switch, Text, View} from 'react-native';

import type {Alarm} from '@/types';
import {colors, radius, spacing} from '@/theme/theme';
import {formatDays, formatTime, formatUntil, nextOccurrence} from '@/utils/time';

const SOURCE_LABELS: Record<Alarm['musicSourceType'], string> = {
  liked_songs: '♥ Liked Songs',
  top_tracks: '🔥 Top Tracks',
  playlist: '🎧 Playlist',
  artist: '🎤 Favorite Artist',
  random_library: '🎲 Random from Library',
};

const CHALLENGE_LABELS: Record<Alarm['challengeMode'], string> = {
  lyrics: '⌨️ Type lyrics',
  singing: '🎙 Sing along',
  dance: '💃 Dance',
  random: '🎲 Surprise me',
};

interface Props {
  alarm: Alarm;
  onPress: () => void;
  onToggle: (enabled: boolean) => void;
  onDelete: () => void;
}

export default function AlarmCard({alarm, onPress, onToggle, onDelete}: Props) {
  const next = alarm.enabled ? nextOccurrence(alarm) : null;

  return (
    <Pressable onPress={onPress} onLongPress={onDelete} style={styles.card}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={[styles.time, !alarm.enabled && styles.disabledText]}>
            {formatTime(alarm.time)}
          </Text>
          <Text style={styles.days}>
            {formatDays(alarm.daysOfWeek)}
            {alarm.label ? ` · ${alarm.label}` : ''}
          </Text>
          <Text style={styles.meta}>
            {SOURCE_LABELS[alarm.musicSourceType]} · {CHALLENGE_LABELS[alarm.challengeMode]}
          </Text>
          {next && <Text style={styles.next}>Rings {formatUntil(next)}</Text>}
        </View>
        <Switch
          value={alarm.enabled}
          onValueChange={onToggle}
          trackColor={{true: colors.primary, false: colors.border}}
          thumbColor={colors.textPrimary}
        />
      </View>
      <Text style={styles.hint}>Tap to edit · Long-press to delete</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {flexDirection: 'row', alignItems: 'center'},
  info: {flex: 1},
  time: {fontSize: 40, fontWeight: '800', color: colors.textPrimary},
  disabledText: {color: colors.textMuted},
  days: {fontSize: 14, color: colors.textSecondary, marginTop: 2},
  meta: {fontSize: 13, color: colors.textMuted, marginTop: spacing.xs},
  next: {fontSize: 13, color: colors.primary, marginTop: spacing.xs, fontWeight: '600'},
  hint: {fontSize: 11, color: colors.textMuted, marginTop: spacing.sm},
});
