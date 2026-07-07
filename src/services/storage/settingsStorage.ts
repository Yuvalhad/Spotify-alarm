/**
 * Non-sensitive app settings, stored locally.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = 'waketune.settings.v1';

export interface AppSettings {
  onboardingCompleted: boolean;
  defaultFallbackSound: string;
  /** User consent to microphone processing (local-only) for singing challenge. */
  micProcessingConsent: boolean;
}

const DEFAULTS: AppSettings = {
  onboardingCompleted: false,
  defaultFallbackSound: 'classic_beep',
  micProcessingConsent: false,
};

export async function loadSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) {
    return {...DEFAULTS};
  }
  try {
    return {...DEFAULTS, ...(JSON.parse(raw) as Partial<AppSettings>)};
  } catch {
    return {...DEFAULTS};
  }
}

export async function saveSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const current = await loadSettings();
  const next = {...current, ...patch};
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  return next;
}
