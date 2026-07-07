import React from 'react';
import {Image, Linking, Pressable, StyleSheet, Text, View} from 'react-native';

import type {Track} from '@/types';
import {colors, radius, spacing} from '@/theme/theme';

interface Props {
  track: Track;
  subtitle?: string;
}

/**
 * Spotify attribution compliance: tapping the card opens the track in the
 * Spotify app (content shown from Spotify must link back to Spotify).
 */
function openInSpotify(track: Track): void {
  Linking.openURL(track.uri).catch(() =>
    Linking.openURL(`https://open.spotify.com/track/${track.id}`).catch(() => undefined),
  );
}

export default function SpotifyTrackCard({track, subtitle}: Props) {
  return (
    <Pressable
      style={styles.card}
      onPress={() => openInSpotify(track)}
      accessibilityLabel={`Open ${track.title} in Spotify`}>
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
        <Text style={styles.openLink}>Open in Spotify ↗</Text>
      </View>
    </Pressable>
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
  openLink: {fontSize: 11, color: colors.textMuted, marginTop: spacing.xs},
});
