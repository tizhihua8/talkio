import { MMKV } from "react-native-mmkv";

export const storage = new MMKV({ id: "avatar-storage" });

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
