import React from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle} from 'react-native';

import {colors, radius, spacing} from '@/theme/theme';

interface Props {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: ViewStyle;
}

export default function PrimaryButton({
  title,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  style,
}: Props) {
  const background =
    variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : colors.surfaceElevated;
  const textColor = variant === 'primary' ? colors.onPrimary : colors.textPrimary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({pressed}) => [
        styles.button,
        {backgroundColor: background, opacity: disabled ? 0.5 : pressed ? 0.85 : 1},
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, {color: textColor}]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  text: {fontSize: 18, fontWeight: '700'},
});
