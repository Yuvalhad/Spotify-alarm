import React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';

import type {Track} from '@/types';
import {colors, radius, spacing} from '@/theme/theme';

interface Props {
  track: Track;
  subtitle?: string;
}

export default function SpotifyTrackCard({track, subtitle}: Props) {
  return (
    <View style={styles.card}>
      {track.albumArtUrl ? (
        <Image source={{uri: track.albumArtUrl}} style={styles.art} />
      ) : (
        <View style={[styles.art, styles.artPlaceholder]}>
          <Text style={styles.artEmoji}>🎵</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {track.artist}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  art: {width: 72, height: 72, borderRadius: radius.sm},
  artPlaceholder: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artEmoji: {fontSize: 28},
  info: {flex: 1, marginLeft: spacing.md},
  title: {fontSize: 18, fontWeight: '700', color: colors.textPrimary},
  artist: {fontSize: 15, color: colors.textSecondary, marginTop: 2},
  subtitle: {fontSize: 12, color: colors.primary, marginTop: spacing.xs},
});
