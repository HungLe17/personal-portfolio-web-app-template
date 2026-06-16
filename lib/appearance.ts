export type ThemePreference = "system" | "light" | "dark";
export type MotionPreference = "full" | "reduced";
export type RefractionPreference = "high" | "balanced" | "off";
export type GlassDensityPreference = "clear" | "balanced" | "solid";
export type StackShowcasePreference = "show" | "hide";

export type AppearancePreferences = {
  theme: ThemePreference;
  motion: MotionPreference;
  refraction: RefractionPreference;
  glassDensity: GlassDensityPreference;
  stackShowcase: StackShowcasePreference;
};

export const APPEARANCE_STORAGE_KEY = "portfolio-appearance-v1";

export const defaultAppearance: AppearancePreferences = {
  theme: "system",
  motion: "full",
  refraction: "balanced",
  glassDensity: "balanced",
  stackShowcase: "show"
};

export function readAppearance(): AppearancePreferences {
  try {
    const value = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
    if (!value) return defaultAppearance;
    return { ...defaultAppearance, ...JSON.parse(value) } as AppearancePreferences;
  } catch {
    return defaultAppearance;
  }
}

export function resolveTheme(theme: ThemePreference) {
  if (theme !== "system") return theme;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function applyAppearance(preferences: AppearancePreferences) {
  const root = document.documentElement;
  root.dataset.theme = resolveTheme(preferences.theme);
  root.dataset.themePreference = preferences.theme;
  root.dataset.motion = preferences.motion;
  root.dataset.refraction = preferences.refraction;
  root.dataset.glassDensity = preferences.glassDensity;
  root.dataset.stackShowcase = preferences.stackShowcase;
  window.localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(preferences));
  window.dispatchEvent(new CustomEvent("portfolio:appearance", { detail: preferences }));
}
