import { MMKV } from "react-native-mmkv";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

const AS_PREFIX = "@avatar:";
const ENCRYPTION_KEY_ID = "avatar-encryption-key";

// Sync in-memory cache backed by AsyncStorage for persistence in Expo Go
const cache = new Map<string, string>();
let cacheReady = false;

interface StorageLike {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
  getAllKeys(): string[];
}

let storage: StorageLike;
let useAsyncFallback = false;

/**
 * Retrieve or generate a persistent encryption key for MMKV.
 * The key itself is stored in a separate, unencrypted MMKV instance
 * that only holds this single value.
 */
function getOrCreateEncryptionKey(): string {
  const keyStore = new MMKV({ id: "avatar-keychain" });
  let key = keyStore.getString(ENCRYPTION_KEY_ID);
  if (!key) {
    key = Crypto.randomUUID();
    keyStore.set(ENCRYPTION_KEY_ID, key);
  }
  return key;
}

try {
  const encryptionKey = getOrCreateEncryptionKey();
  const encrypted = new MMKV({ id: "avatar-storage-v2", encryptionKey });

  // One-time migration: copy data from old unencrypted instance
  if (encrypted.getAllKeys().length === 0) {
    try {
      const legacy = new MMKV({ id: "avatar-storage" });
      const legacyKeys = legacy.getAllKeys();
      if (legacyKeys.length > 0) {
        for (const k of legacyKeys) {
          const v = legacy.getString(k);
          if (v !== undefined) encrypted.set(k, v);
        }
        legacy.clearAll();
      }
    } catch {
      // Legacy instance doesn't exist or can't be opened — skip
    }
  }

  storage = encrypted;
} catch {
  console.warn("[mmkv] Native module unavailable, using AsyncStorage fallback");
  useAsyncFallback = true;
  storage = {
    getString(key: string) {
      return cache.get(key);
    },
    set(key: string, value: string) {
      cache.set(key, value);
      AsyncStorage.setItem(AS_PREFIX + key, value).catch(() => {});
    },
    delete(key: string) {
      cache.delete(key);
      AsyncStorage.removeItem(AS_PREFIX + key).catch(() => {});
    },
    getAllKeys() {
      return Array.from(cache.keys());
    },
  };
}

export { storage };

/**
 * Must be called once at app startup to hydrate in-memory cache from AsyncStorage.
 * No-op if MMKV native module is available.
 */
export async function hydrateStorage(): Promise<void> {
  if (!useAsyncFallback || cacheReady) return;
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const avatarKeys = allKeys.filter((k) => k.startsWith(AS_PREFIX));
    if (avatarKeys.length > 0) {
      const pairs = await AsyncStorage.multiGet(avatarKeys);
      for (const [k, v] of pairs) {
        if (v != null) cache.set(k.slice(AS_PREFIX.length), v);
      }
    }
  } catch {
    console.warn("[mmkv] Failed to hydrate from AsyncStorage");
  }
  cacheReady = true;
}

export function getItem<T>(key: string): T | null {
  const value = storage.getString(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function setItem<T>(key: string, value: T): void {
  storage.set(key, JSON.stringify(value));
}

export function removeItem(key: string): void {
  storage.delete(key);
}

export function getAllKeys(): string[] {
  return storage.getAllKeys();
}
