/**
 * The ringing alarm screen.
 *
 *  - starts ringing (Spotify or fallback) on mount via alarmRinger
 *  - renders the resolved challenge and drives it
 *  - NO regular dismiss button; hardware back is blocked
 *  - hidden emergency escape: long-press the bottom-right corner for 10s
 *    (safety requirement - the user must never be truly trapped)
 */
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import ChallengeCard from '@/components/ChallengeCard';
import PrimaryButton from '@/components/PrimaryButton';
import SpotifyTrackCard from '@/components/SpotifyTrackCard';
import type {RootStackParamList} from '@/navigation/types';
import type {Alarm} from '@/types';
import {getAlarmById} from '@/services/storage/alarmStorage';
import {startRinging, stopRinging, type RingerState} from '@/services/alarms/alarmRinger';
import {buildChallengeForSession} from '@/services/challenges/challengeEngine';
import type {ChallengeSpec} from '@/services/challenges/challengeTypes';
import {evaluateLyricsChallenge} from '@/services/challenges/lyricsChallenge';
import {
  startSingingSession,
  type SingingSession,
} from '@/services/challenges/singingChallenge';
import {startDanceSession, type DanceSession} from '@/services/challenges/danceChallenge';
import {colors, radius, spacing, typography} from '@/theme/theme';
import {logger} from '@/utils/logger';

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveAlarm'>;

const EMERGENCY_HOLD_MS = 10_000;

const STATUS_MESSAGES: Record<string, string> = {
  spotify_playing: '',
  fallback_not_connected: 'Spotify is not connected — playing the built-in alarm sound.',
  fallback_no_premium:
    'Playing full songs requires Spotify Premium — using the built-in alarm sound.',
  fallback_no_device:
    'No Spotify device is available — using the built-in alarm sound. Open Spotify once to fix this.',
  fallback_error: 'Spotify playback failed — using the built-in alarm sound.',
};

export default function ActiveAlarmScreen({navigation, route}: Props) {
  const {alarmId} = route.params;
  const [alarm, setAlarm] = useState<Alarm | null>(null);
  const [ringer, setRinger] = useState<RingerState | null>(null);
  const [challenge, setChallenge] = useState<ChallengeSpec | null>(null);
  const [typedText, setTypedText] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [moves, setMoves] = useState(0);
  const [hardTargetVisible, setHardTargetVisible] = useState(true);

  const singingRef = useRef<SingingSession | null>(null);
  const danceRef = useRef<DanceSession | null>(null);
  const emergencyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulse = useRef(new Animated.Value(1)).current;

  // "Wake up" pulse animation.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.12,
          duration: 600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  // Block Android hardware back while ringing.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const finishSuccess = useCallback(
    async (state: RingerState) => {
      singingRef.current?.stop();
      danceRef.current?.stop();
      await stopRinging(state);
      navigation.reset({
        index: 1,
        routes: [
          {name: 'AlarmList'},
          {
            name: 'WakeSuccess',
            params: {
              trackTitle: state.session.track?.title,
              artist: state.session.track?.artist,
            },
          },
        ],
      });
    },
    [navigation],
  );

  // Start ringing + build the challenge.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await getAlarmById(alarmId);
      if (!loaded) {
        logger.warn('ActiveAlarm: alarm not found', alarmId);
        navigation.reset({index: 0, routes: [{name: 'AlarmList'}]});
        return;
      }
      if (cancelled) {
        return;
      }
      setAlarm(loaded);
      const state = await startRinging(loaded);
      if (cancelled) {
        await stopRinging(state);
        return;
      }
      setRinger(state);
      const spec = await buildChallengeForSession(loaded, state.session);
      if (!cancelled) {
        setChallenge(spec);
      }
    })();
    return () => {
      cancelled = true;
      singingRef.current?.stop();
      danceRef.current?.stop();
    };
  }, [alarmId, navigation]);

  // Hard lyrics mode: hide the target text after 5 seconds.
  useEffect(() => {
    if (challenge?.kind === 'lyrics' && !challenge.showTarget) {
      setHardTargetVisible(true);
      const t = setTimeout(() => setHardTargetVisible(false), 5000);
      return () => clearTimeout(t);
    }
  }, [challenge]);

  // Sensor-driven challenges.
  useEffect(() => {
    if (!challenge || !ringer) {
      return;
    }
    if (challenge.kind === 'singing') {
      singingRef.current = startSingingSession(challenge, {
        onProgress: (_level, p) => setProgress(p),
        onFinished: result => {
          if (result.success) {
            finishSuccess(ringer);
          } else if (result.reason !== 'cancelled') {
            setFeedback(result.reason ?? 'Try again!');
            // Restart the session so the alarm remains solvable.
            singingRef.current = startSingingSession(challenge, {
              onProgress: (_l, p) => setProgress(p),
              onFinished: r => r.success && finishSuccess(ringer),
            });
          }
        },
      });
      return () => singingRef.current?.stop();
    }
    if (challenge.kind === 'dance') {
      danceRef.current = startDanceSession(challenge, {
        onProgress: m => setMoves(m),
        onFinished: result => {
          if (result.success) {
            finishSuccess(ringer);
          } else if (result.reason === 'sensor_unavailable') {
            // No accelerometer: never trap the user - success by grace.
            finishSuccess(ringer);
          } else if (result.reason !== 'cancelled') {
            setFeedback(result.reason ?? 'Keep moving!');
            danceRef.current = startDanceSession(challenge, {
              onProgress: m => setMoves(m),
              onFinished: r => r.success && finishSuccess(ringer),
            });
          }
        },
      });
      return () => danceRef.current?.stop();
    }
  }, [challenge, ringer, finishSuccess]);

  const submitTyped = () => {
    if (!challenge || challenge.kind !== 'lyrics' || !ringer) {
      return;
    }
    const result = evaluateLyricsChallenge(challenge, typedText);
    if (result.success) {
      finishSuccess(ringer);
    } else {
      setFeedback(result.reason ?? 'Try again');
    }
  };

  // Hidden emergency escape: long-press bottom-right corner for 10 seconds.
  const emergencyDown = () => {
    emergencyTimer.current = setTimeout(() => {
      logger.warn('Emergency escape used for alarm', alarmId);
      if (ringer) {
        finishSuccess(ringer);
      } else {
        navigation.reset({index: 0, routes: [{name: 'AlarmList'}]});
      }
    }, EMERGENCY_HOLD_MS);
  };
  const emergencyUp = () => {
    if (emergencyTimer.current) {
      clearTimeout(emergencyTimer.current);
      emergencyTimer.current = null;
    }
  };

  const statusMessage = ringer ? STATUS_MESSAGES[ringer.status] : '';

  return (
    <View style={styles.screen}>
      <Animated.Text style={[styles.wakeTitle, {transform: [{scale: pulse}]}]}>
        WAKE UP! ⏰
      </Animated.Text>

      {ringer?.session.track ? (
        <SpotifyTrackCard
          track={ringer.session.track}
          subtitle={ringer.status === 'spotify_playing' ? 'Playing on Spotify' : undefined}
        />
      ) : (
        <View style={styles.noTrackBox}>
          <Text style={styles.noTrackText}>🔔 Built-in alarm sound</Text>
        </View>
      )}
      {!!statusMessage && <Text style={styles.status}>{statusMessage}</Text>}

      <View style={styles.challengeArea}>
        {!challenge ? (
          <Text style={styles.loading}>Preparing your challenge…</Text>
        ) : challenge.kind === 'lyrics' ? (
          <ChallengeCard title="Type to wake up" prompt={challenge.prompt}>
            {(challenge.showTarget || hardTargetVisible) && (
              <Text style={styles.target}>"{challenge.targetText}"</Text>
            )}
            <TextInput
              style={styles.input}
              value={typedText}
              onChangeText={setTypedText}
              placeholder="Type here…"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              multiline
            />
            <PrimaryButton title="I'm awake!" onPress={submitTyped} style={styles.submit} />
          </ChallengeCard>
        ) : challenge.kind === 'singing' ? (
          <ChallengeCard title="Sing to wake up" prompt={challenge.prompt} progress={progress} />
        ) : (
          <ChallengeCard
            title="Move to wake up"
            prompt={challenge.prompt}
            progress={moves / challenge.requiredMoves}>
            <Text style={styles.moves}>
              {moves} / {challenge.requiredMoves}
            </Text>
          </ChallengeCard>
        )}
        {!!feedback && <Text style={styles.feedback}>{feedback}</Text>}
      </View>

      <Text style={styles.safety}>
        ⚠️ Do this in a safe place — not while driving, not near stairs.
      </Text>

      {/* Hidden emergency escape (bottom-right corner, hold 10s). */}
      <Pressable
        style={styles.emergency}
        onPressIn={emergencyDown}
        onPressOut={emergencyUp}
        accessibilityLabel="Emergency stop: press and hold for 10 seconds"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background, padding: spacing.lg, paddingTop: 64},
  wakeTitle: {
    ...typography.huge,
    fontSize: 44,
    textAlign: 'center',
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  noTrackBox: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  noTrackText: {fontSize: 18, color: colors.textPrimary, fontWeight: '600'},
  status: {fontSize: 13, color: colors.warning, marginTop: spacing.sm, textAlign: 'center'},
  challengeArea: {flex: 1, marginTop: spacing.lg},
  loading: {color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl},
  target: {
    fontSize: 18,
    color: colors.textPrimary,
    fontStyle: 'italic',
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    color: colors.textPrimary,
    fontSize: 18,
    padding: spacing.md,
    marginTop: spacing.md,
    minHeight: 64,
    textAlignVertical: 'top',
  },
  submit: {marginTop: spacing.md},
  moves: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  feedback: {color: colors.warning, textAlign: 'center', marginTop: spacing.md, fontSize: 15},
  safety: {fontSize: 12, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.sm},
  emergency: {position: 'absolute', right: 0, bottom: 0, width: 88, height: 88},
});
