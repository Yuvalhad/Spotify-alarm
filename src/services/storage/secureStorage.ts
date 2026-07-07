/**
 * Secure storage for sensitive values (Spotify tokens).
 * Backed by the platform keystore:
 *  - iOS: Keychain
 *  - Android: Keystore-encrypted SharedPreferences (via react-native-keychain)
 *
 * NEVER store tokens in AsyncStorage - it is plain-text on disk.
 */
import * as Keychain from 'react-native-keychain';

import {logger} from '@/utils/logger';

const SERVICE_PREFIX = 'com.waketune.secure';

export async function setSecureItem(key: string, value: string): Promise<void> {
  await Keychain.setGenericPassword(key, value, {
    service: `${SERVICE_PREFIX}.${key}`,
    accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK,
    // AFTER_FIRST_UNLOCK (not WHEN_UNLOCKED): the alarm may need the Spotify
    // token while the device is still locked at ring time.
  });
}

export async function getSecureItem(key: string): Promise<string | null> {
  try {
    const creds = await Keychain.getGenericPassword({
      service: `${SERVICE_PREFIX}.${key}`,
    });
    return creds ? creds.password : null;
  } catch (e) {
    logger.warn('secureStorage.get failed', key, e);
    return null;
  }
}

export async function removeSecureItem(key: string): Promise<void> {
  await Keychain.resetGenericPassword({service: `${SERVICE_PREFIX}.${key}`});
}
