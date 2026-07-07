import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {colors, radius, spacing} from '@/theme/theme';

interface Props {
  title: string;
  prompt: string;
  /** 0..1 progress for singing/dance meters. */
  progress?: number;
  children?: React.ReactNode;
}

export default function ChallengeCard({title, prompt, progress, children}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.prompt}>{prompt}</Text>
      {typeof progress === 'number' && (
        <View style={styles.meterTrack}>
          <View style={[styles.meterFill, {width: `${Math.round(progress * 100)}%`}]} />
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {fontSize: 22, fontWeight: '800', color: colors.primary},
  prompt: {fontSize: 17, color: colors.textPrimary, marginTop: spacing.sm, lineHeight: 24},
  meterTrack: {
    height: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceElevated,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
});
