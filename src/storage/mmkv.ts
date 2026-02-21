import { MMKV } from "react-native-mmkv";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

// Lazy-loaded to avoid crash when native module isn't linked (e.g. Expo Go)
let _secureStore: typeof import("expo-secure-store") | null = null;
function getSecureStore() {
  if (_secureStore === null) {
    try {
      _secureStore = require("expo-secure-store");
    } catch {
      _secureStore = null;
    }
  }
  return _secureStore;
}

const AS_PREFIX = "@talkio:";
const ENCRYPTION_KEY_ID = "talkio-encryption-key";

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
 * The key is stored in expo-secure-store (iOS Keychain / Android Keystore).
 * Includes migration from the old unencrypted MMKV keychain instance.
 */
function getOrCreateEncryptionKey(): string {
  // Try reading from secure store first
  let key: string | null = null;
  try {
    key = getSecureStore()?.getItem(ENCRYPTION_KEY_ID) ?? null;
  } catch {
    // SecureStore not available (e.g. Expo Go) — fall through
  }

  if (!key) {
    // Migrate from old unencrypted MMKV keychain if it exists
    try {
      const legacyKeyStore = new MMKV({ id: "talkio-keychain" });
      const legacyKey = legacyKeyStore.getString(ENCRYPTION_KEY_ID);
      if (legacyKey) {
        key = legacyKey;
        // Save to secure store and clean up legacy
        try {
          getSecureStore()?.setItem(ENCRYPTION_KEY_ID, key);
          legacyKeyStore.delete(ENCRYPTION_KEY_ID);
        } catch {
          // SecureStore write failed — key still works from legacy
        }
      }
    } catch {
      // Legacy keychain doesn't exist — skip
    }
  }

  if (!key) {
    // Generate a new key
    key = Crypto.randomUUID();
    try {
      getSecureStore()?.setItem(ENCRYPTION_KEY_ID, key);
    } catch {
      // SecureStore not available — key lives only in memory this session.
      // On next launch a new key will be generated, but this only happens
      // in Expo Go where we fall back to AsyncStorage anyway.
      console.warn("[mmkv] Could not persist encryption key to SecureStore");
    }
  }

  return key;
}

try {
  const encryptionKey = getOrCreateEncryptionKey();
  const encrypted = new MMKV({ id: "talkio-storage-v2", encryptionKey });

  // One-time migration: copy data from old unencrypted instance
  if (encrypted.getAllKeys().length === 0) {
    try {
      const legacy = new MMKV({ id: "talkio-storage" });
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
