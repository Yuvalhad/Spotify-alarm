import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import PrimaryButton from '@/components/PrimaryButton';
import type {RootStackParamList} from '@/navigation/types';
import {colors, spacing, typography} from '@/theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'WakeSuccess'>;

export default function WakeSuccessScreen({navigation, route}: Props) {
  const scale = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  return (
    <View style={styles.screen}>
      <Animated.Text style={[styles.emoji, {transform: [{scale}]}]}>🌞</Animated.Text>
      <Text style={typography.title}>You're awake!</Text>
      {route.params?.trackTitle && (
        <Text style={styles.sub}>
          Woken up by "{route.params.trackTitle}"
          {route.params.artist ? ` — ${route.params.artist}` : ''}
        </Text>
      )}
      <Text style={styles.sub}>Have a great day. Go make it count. 💪</Text>
      <PrimaryButton
        title="Done"
        onPress={() => navigation.reset({index: 0, routes: [{name: 'AlarmList'}]})}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  emoji: {fontSize: 96, marginBottom: spacing.lg},
  sub: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  button: {marginTop: spacing.xl, alignSelf: 'stretch'},
});
