import { MMKV } from "react-native-mmkv";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AS_PREFIX = "@avatar:";

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

try {
  storage = new MMKV({ id: "avatar-storage" });
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
