import React, {useCallback} from 'react';
import {Alert, FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import AlarmCard from '@/components/AlarmCard';
import PrimaryButton from '@/components/PrimaryButton';
import type {RootStackParamList} from '@/navigation/types';
import {useAlarms} from '@/state/AlarmsContext';
import {colors, spacing, typography} from '@/theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AlarmList'>;

export default function AlarmListScreen({navigation}: Props) {
  const {alarms, toggleAlarm, removeAlarm} = useAlarms();

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => navigation.navigate('Settings')} hitSlop={12}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  const confirmDelete = useCallback(
    (alarmId: string) => {
      Alert.alert('Delete alarm?', 'This cannot be undone.', [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Delete', style: 'destructive', onPress: () => removeAlarm(alarmId)},
      ]);
    },
    [removeAlarm],
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={alarms}
        keyExtractor={a => a.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🌅</Text>
            <Text style={typography.subtitle}>No alarms yet</Text>
            <Text style={styles.emptyText}>
              Create your first alarm and wake up to music you love.
            </Text>
          </View>
        }
        renderItem={({item}) => (
          <AlarmCard
            alarm={item}
            onPress={() => navigation.navigate('CreateAlarm', {alarmId: item.id})}
            onToggle={enabled => toggleAlarm(item.id, enabled)}
            onDelete={() => confirmDelete(item.id)}
          />
        )}
      />
      <View style={styles.footer}>
        <PrimaryButton title="+ New alarm" onPress={() => navigation.navigate('CreateAlarm')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  list: {padding: spacing.md, paddingBottom: 120},
  settingsIcon: {fontSize: 22},
  empty: {alignItems: 'center', marginTop: spacing.xxl * 2, paddingHorizontal: spacing.lg},
  emptyEmoji: {fontSize: 56, marginBottom: spacing.md},
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    backgroundColor: colors.background,
  },
});
