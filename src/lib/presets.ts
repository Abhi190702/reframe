import type { EditRecipe } from "./types";
import { DEFAULT_RECIPE } from "./constants";

export interface Preset {
  id: string;
  label: string;
  platform: string; // short platform label shown under the ratio visual
  width: number;
  height: number;
}

export interface CustomPreset {
  id: string;
  name: string;
  recipe: EditRecipe;
  createdAt: number;
}

export const CUSTOM_PRESET_STORAGE_KEY = "reframe.customPresets";
export const MAX_CUSTOM_PRESETS = 10;

export const BUILT_IN_PRESETS: Preset[] = [
  { id: "vertical-9-16",      label: "9 : 16",    platform: "Reels · TikTok · Shorts", width: 1080,  height: 1920 },
  { id: "instagram-4-5",      label: "4 : 5",     platform: "Instagram Feed",            width: 1080,  height: 1350 },
  { id: "square-1-1",         label: "1 : 1",     platform: "Square",                    width: 1080,  height: 1080 },
  { id: "landscape-16-9",     label: "16 : 9",    platform: "YouTube · Landscape",       width: 1920,  height: 1080 },
  { id: "twitter-hd",         label: "16 : 9",    platform: "Twitter / X",               width: 1280,  height: 720  },
  { id: "ultrawide-21-9",     label: "21 : 9",    platform: "Ultrawide",                 width: 2560,  height: 1080 },
  { id: "instagram-panoramic",label: "47 : 10",   platform: "IG Panoramic",              width: 5120,  height: 1080 },
  { id: "portrait-3-4",       label: "3 : 4",     platform: "Portrait",                  width: 1080,  height: 1440 },
  { id: "cinema-scope",       label: "2.39 : 1",  platform: "Anamorphic Cinema",         width: 2048,  height: 858  },
  { id: "dci-2k",             label: "17 : 9",    platform: "DCI 2K",                    width: 2048,  height: 1080 },
  { id: "custom",             label: "Custom",    platform: "Set your own",              width: 1920,  height: 1080 },
];

export const PRESETS = BUILT_IN_PRESETS;

/** Returns the preset matching the given ID, or undefined if no match is found. */
export function getPresetById(id: string): Preset | undefined {
  return BUILT_IN_PRESETS.find((p) => p.id === id);
}

export function getRecipeDimensions(recipe: Pick<EditRecipe, "preset" | "customWidth" | "customHeight">) {
  if (recipe.preset === "custom") {
    return { width: recipe.customWidth, height: recipe.customHeight };
  }

  const preset = getPresetById(recipe.preset);
  return preset
    ? { width: preset.width, height: preset.height }
    : { width: recipe.customWidth, height: recipe.customHeight };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeRecipe(value: unknown, presetId: string): EditRecipe | null {
  if (!isRecord(value)) return null;

  const format = value.format === "webm" || value.format === "mkv" || value.format === "mp4" || value.format === "gif"
    ? value.format
    : DEFAULT_RECIPE.format;
  const framing = value.framing === "fill" || value.framing === "fit"
    ? value.framing
    : DEFAULT_RECIPE.framing;
  const rotate = value.rotate === 90 || value.rotate === 180 || value.rotate === 270 || value.rotate === 0
    ? value.rotate
    : DEFAULT_RECIPE.rotate;

  return {
    ...DEFAULT_RECIPE,
    preset: presetId,
    customWidth: normalizeNumber(value.customWidth, DEFAULT_RECIPE.customWidth),
    customHeight: normalizeNumber(value.customHeight, DEFAULT_RECIPE.customHeight),
    framing,
    trimStart: normalizeNumber(value.trimStart, DEFAULT_RECIPE.trimStart),
    trimEnd: value.trimEnd === null || typeof value.trimEnd !== "number"
      ? DEFAULT_RECIPE.trimEnd
      : normalizeNumber(value.trimEnd, DEFAULT_RECIPE.trimEnd ?? 0),
    rotate,
    keepAudio: normalizeBoolean(value.keepAudio, DEFAULT_RECIPE.keepAudio),
    normalizeAudio: normalizeBoolean(value.normalizeAudio, DEFAULT_RECIPE.normalizeAudio),
    speed: normalizeNumber(value.speed, DEFAULT_RECIPE.speed),
    quality: normalizeNumber(value.quality, DEFAULT_RECIPE.quality),
    format,
    stabilization: normalizeBoolean(value.stabilization, DEFAULT_RECIPE.stabilization),
    brightness: normalizeNumber(value.brightness, DEFAULT_RECIPE.brightness),
    contrast: normalizeNumber(value.contrast, DEFAULT_RECIPE.contrast),
    saturation: normalizeNumber(value.saturation, DEFAULT_RECIPE.saturation),
    soundOnCompletion: normalizeBoolean(value.soundOnCompletion, DEFAULT_RECIPE.soundOnCompletion),
    version: DEFAULT_RECIPE.version,
  };
}

function normalizeCustomPreset(value: unknown): CustomPreset | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || typeof value.name !== "string") return null;

  const recipe = normalizeRecipe(value.recipe, value.id);
  if (!recipe) return null;

  return {
    id: value.id,
    name: value.name,
    recipe,
    createdAt: normalizeNumber(value.createdAt, Date.now()),
  };
}

export function loadCustomPresets(): CustomPreset[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(CUSTOM_PRESET_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(normalizeCustomPreset)
      .filter((preset): preset is CustomPreset => preset !== null)
      .slice(0, MAX_CUSTOM_PRESETS);
  } catch {
    return [];
  }
}

export function saveCustomPresets(presets: CustomPreset[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    CUSTOM_PRESET_STORAGE_KEY,
    JSON.stringify(presets.slice(0, MAX_CUSTOM_PRESETS))
  );
}
