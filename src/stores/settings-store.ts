import { create } from "zustand";
import { getItem, setItem } from "../storage/mmkv";
import { STORAGE_KEYS } from "../constants";

interface AppSettings {
  theme: "light" | "dark" | "system";
  syncEnabled: boolean;
  webdavUrl: string | null;
  webdavUser: string | null;
  webdavPass: string | null;
  hapticFeedback: boolean;
  quickPromptEnabled: boolean;
  voiceAutoTranscribe: boolean;
}

interface SettingsState {
  settings: AppSettings;
  loadSettings: () => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: "light",
  syncEnabled: false,
  webdavUrl: null,
  webdavUser: null,
  webdavPass: null,
  hapticFeedback: true,
  quickPromptEnabled: true,
  voiceAutoTranscribe: true,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,

  loadSettings: () => {
    const stored = getItem<AppSettings>(STORAGE_KEYS.SETTINGS);
    set({ settings: { ...DEFAULT_SETTINGS, ...stored } });
  },

  updateSettings: (updates) => {
    const settings = { ...get().settings, ...updates };
    set({ settings });
    setItem(STORAGE_KEYS.SETTINGS, settings);
  },
}));
