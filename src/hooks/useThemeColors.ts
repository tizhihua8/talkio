import { useColorScheme } from "nativewind";

export interface ThemeColors {
  bg: string;
  bgSecondary: string;
  bgChat: string;
  bgNav: string;
  bgCard: string;
  bgInput: string;
  bgHover: string;

  textPrimary: string;
  textSecondary: string;
  textHint: string;
  textInverse: string;

  border: string;
  borderLight: string;
  divider: string;

  bubbleUser: string;
  bubbleAi: string;

  accent: string;
  accentLight: string;
  accentGreen: string;
  danger: string;
  warning: string;

  tabBarBg: string;
  tabBarBorder: string;
  tabInactive: string;

  switchTrack: string;
  chevron: string;
  searchIcon: string;
  sectionHeader: string;
}

const lightColors: ThemeColors = {
  bg: "#ffffff",
  bgSecondary: "#F2F2F7",
  bgChat: "#ffffff",
  bgNav: "#f9f9f9",
  bgCard: "#ffffff",
  bgInput: "#F2F2F7",
  bgHover: "#f8fafc",

  textPrimary: "#1C1C1E",
  textSecondary: "#6b7280",
  textHint: "#8E8E93",
  textInverse: "#ffffff",

  border: "#e5e7eb",
  borderLight: "#f1f5f9",
  divider: "#F2F2F2",

  bubbleUser: "#e7f8e8",
  bubbleAi: "#F2F2F7",

  accent: "#007AFF",
  accentLight: "#e8e8fd",
  accentGreen: "#34C759",
  danger: "#ef4444",
  warning: "#f59e0b",

  tabBarBg: "rgba(255,255,255,0.95)",
  tabBarBorder: "#e2e8f0",
  tabInactive: "#94a3b8",

  switchTrack: "#e5e7eb",
  chevron: "#cbd5e1",
  searchIcon: "#94a3b8",
  sectionHeader: "#64748b",
};

const darkColors: ThemeColors = {
  bg: "#000000",
  bgSecondary: "#1C1C1E",
  bgChat: "#000000",
  bgNav: "#1C1C1E",
  bgCard: "#1C1C1E",
  bgInput: "#2C2C2E",
  bgHover: "#2C2C2E",

  textPrimary: "#F5F5F7",
  textSecondary: "#98989D",
  textHint: "#8E8E93",
  textInverse: "#000000",

  border: "#38383A",
  borderLight: "#2C2C2E",
  divider: "#2C2C2E",

  bubbleUser: "#1a3a1f",
  bubbleAi: "#1C1C1E",

  accent: "#0A84FF",
  accentLight: "#1e1e32",
  accentGreen: "#30D158",
  danger: "#FF453A",
  warning: "#FF9F0A",

  tabBarBg: "rgba(28,28,30,0.95)",
  tabBarBorder: "#38383A",
  tabInactive: "#8E8E93",

  switchTrack: "#38383A",
  chevron: "#48484A",
  searchIcon: "#8E8E93",
  sectionHeader: "#8E8E93",
};

export function useThemeColors(): ThemeColors {
  const { colorScheme } = useColorScheme();
  return colorScheme === "dark" ? darkColors : lightColors;
}
