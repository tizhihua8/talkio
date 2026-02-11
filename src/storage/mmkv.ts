import { MMKV } from "react-native-mmkv";

// In-memory fallback when MMKV native module is unavailable (e.g. Expo Go)
const memStore = new Map<string, string>();

interface StorageLike {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
  getAllKeys(): string[];
}

let storage: StorageLike;

try {
  storage = new MMKV({ id: "avatar-storage" });
} catch {
  console.warn("[mmkv] Native module unavailable, using in-memory fallback");
  storage = {
    getString(key: string) {
      return memStore.get(key);
    },
    set(key: string, value: string) {
      memStore.set(key, value);
    },
    delete(key: string) {
      memStore.delete(key);
    },
    getAllKeys() {
      return Array.from(memStore.keys());
    },
  };
}

export { storage };

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
