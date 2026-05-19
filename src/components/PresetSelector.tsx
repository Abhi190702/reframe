"use client";

import {
  BUILT_IN_PRESETS,
  CustomPreset,
  MAX_CUSTOM_PRESETS,
} from "@/lib/presets";
import { EditRecipe } from "@/lib/types";
import { Settings2, Lock, Unlock, Save, X } from "lucide-react";
import { FormEvent, useEffect, useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

interface Props {
  recipe: EditRecipe;
  customPresets: CustomPreset[];
  onChange: (patch: Partial<EditRecipe>) => void;
  onSavePreset: (name: string) => { ok: boolean; message: string };
  onDeletePreset: (id: string) => void;
  onSelectCustomPreset: (id: string) => void;
}

function getOrientationLabel(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const d = gcd(width, height);
  const ratio = `${width / d}:${height / d}`;
  const orientation = width === height ? "Square" : width > height ? "Landscape" : "Portrait";
  return `${orientation} ${ratio}`;
}

function RatioBox({ width, height, active }: { width: number; height: number; active: boolean }) {
  const MAX = 32;
  const ratio = width / height;
  const [w, h] = ratio >= 1
    ? [MAX, Math.max(4, Math.round(MAX / ratio))]
    : [Math.max(4, Math.round(MAX * ratio)), MAX];

  return (
    <div
      className={cn(
        "border-2 flex-shrink-0 transition-colors",
        active ? "border-film-600" : "border-[var(--muted)] opacity-60"
      )}
      style={{ width: w, height: h }}
    />
  );
}

export default function PresetSelector({
  recipe,
  customPresets,
  onChange,
  onSavePreset,
  onDeletePreset,
  onSelectCustomPreset,
}: Props) {
  const [locked, setLocked] = useState(false);
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const lockedRef = useRef(false);
  const aspectRatioRef = useRef(16 / 9);
  const presetNameRef = useRef<HTMLInputElement>(null);
  const isCustomRecipe = recipe.preset === "custom" || customPresets.some((preset) => preset.id === recipe.preset);

  useEffect(() => {
    if (isSaveOpen) {
      presetNameRef.current?.focus();
    }
  }, [isSaveOpen]);

  const handleToggleLock = useCallback(() => {
    if (!lockedRef.current) {
      const w = recipe.customWidth ?? 1920;
      const h = recipe.customHeight ?? 1080;
      const ratio = h !== 0 ? w / h : 16 / 9;
      aspectRatioRef.current = ratio;
    }
    setLocked((prev) => {
      lockedRef.current = !prev;
      return !prev;
    });
  }, [recipe.customWidth, recipe.customHeight]);

  const handleWidthChange = useCallback((w: number) => {
    const patch: Partial<EditRecipe> = { preset: "custom", customWidth: w };
    if (lockedRef.current) patch.customHeight = Math.round(w / aspectRatioRef.current);
    onChange(patch);
  }, [onChange]);

  const handleHeightChange = useCallback((h: number) => {
    const patch: Partial<EditRecipe> = { preset: "custom", customHeight: h };
    if (lockedRef.current) patch.customWidth = Math.round(h * aspectRatioRef.current);
    onChange(patch);
  }, [onChange]);

  const handleOpenSave = () => {
    if (customPresets.length >= MAX_CUSTOM_PRESETS) {
      setFeedback(`You can save up to ${MAX_CUSTOM_PRESETS} custom presets. Delete one before saving another.`);
      return;
    }

    setPresetName("");
    setFeedback(null);
    setIsSaveOpen(true);
  };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = onSavePreset(presetName);
    setFeedback(result.message);

    if (result.ok) {
      setIsSaveOpen(false);
      setPresetName("");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)]">
          Built-in
        </p>
        <button
          type="button"
          onClick={handleOpenSave}
          className="inline-flex min-h-[36px] items-center gap-2 rounded-lg border border-film-500 px-3 py-2 text-xs font-heading font-bold uppercase tracking-wider text-film-600 transition-colors hover:bg-film-50"
        >
          <Save size={14} />
          Save preset
        </button>
      </div>

      {feedback && (
        <p className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--muted)]">
          {feedback}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {BUILT_IN_PRESETS.filter((p) => p.id !== "custom").map((preset) => {
          const active = recipe.preset === preset.id;
          return (
            <button
              type="button"
              key={preset.id}
              onClick={() => onChange({ preset: preset.id })}
              title={`${preset.label} - ${preset.width}x${preset.height} - ${getOrientationLabel(preset.width, preset.height)}`}
              aria-label={`Select ${preset.label} preset, ${preset.width} by ${preset.height} pixels`}
              aria-pressed={active}
              className={cn(
                "min-h-[44px] min-w-[44px] flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all duration-150 cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
                active
                  ? "border-film-500 bg-film-50"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-film-300 hover:bg-film-50/30"
              )}
            >
              <RatioBox width={preset.width} height={preset.height} active={active} />
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className={cn(
                  "text-xs font-heading font-bold leading-tight whitespace-nowrap",
                  active ? "text-film-700" : "text-[var(--text)]"
                )}>
                  {preset.label}
                </p>
                <p className="text-[10px] text-[var(--muted)] leading-tight mt-0.5 truncate">
                  {preset.platform}
                </p>
              </div>
            </button>
          );
        })}

        <button
          type="button"
          title="Custom - Set your own dimensions"
          aria-label="Select custom dimensions preset"
          aria-pressed={recipe.preset === "custom"}
          onClick={() => onChange({ preset: "custom" })}
          className={cn(
            "min-h-[44px] min-w-[44px] flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all duration-150 cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
            recipe.preset === "custom"
              ? "border-film-500 bg-film-50"
              : "border-[var(--border)] bg-[var(--surface)] hover:border-film-300 hover:bg-film-50/30"
          )}
        >
          <Settings2
            size={20}
            className={cn(
              "shrink-0",
              recipe.preset === "custom" ? "text-film-600" : "text-[var(--muted)]"
            )}
          />
          <div className="min-w-0">
            <p className={cn(
              "text-xs font-heading font-bold",
              recipe.preset === "custom" ? "text-film-700" : "text-[var(--text)]"
            )}>
              Custom
            </p>
            <p className="text-[10px] text-[var(--muted)] mt-0.5">Set your own</p>
          </div>
        </button>
      </div>

      {customPresets.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)]">
            Custom
          </p>
          <div className="grid grid-cols-1 gap-2">
            {customPresets.map((preset) => {
              const active = recipe.preset === preset.id;
              const width = preset.recipe.customWidth;
              const height = preset.recipe.customHeight;

              return (
                <div
                  key={preset.id}
                  className={cn(
                    "flex min-h-[48px] items-center rounded-lg border bg-[var(--surface)] transition-colors",
                    active ? "border-film-500 bg-film-50" : "border-[var(--border)] hover:border-film-300"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelectCustomPreset(preset.id)}
                    aria-pressed={active}
                    className="flex min-w-0 flex-1 items-center gap-2 p-2.5 text-left"
                  >
                    <RatioBox width={width} height={height} active={active} />
                    <div className="min-w-0">
                      <p className={cn(
                        "truncate text-xs font-heading font-bold",
                        active ? "text-film-700" : "text-[var(--text)]"
                      )}>
                        {preset.name}
                      </p>
                      <p className="mt-0.5 text-[10px] leading-tight text-[var(--muted)]">
                        {width}x{height} - CRF {preset.recipe.quality} - {preset.recipe.format.toUpperCase()}
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeletePreset(preset.id)}
                    aria-label={`Delete ${preset.name} custom preset`}
                    title="Delete preset"
                    className="mr-2 inline-flex min-h-[32px] min-w-[32px] items-center justify-center rounded-md text-[var(--muted)] transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isCustomRecipe && (
        <div className="flex gap-3 items-center p-3 bg-[var(--surface)] rounded-lg border border-[var(--border)] animate-fade-in">
          <div className="flex-1">
            <label htmlFor="custom-width" className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)] block mb-1.5">
              Width px
            </label>
            <input
              id="custom-width"
              type="number"
              inputMode="numeric"
              min={16}
              max={7680}
              step={2}
              value={recipe.customWidth}
              spellCheck={false}
              onChange={(e) => handleWidthChange(Number(e.target.value))}
              className="w-full text-sm px-3 py-1.5 border border-[var(--border)] rounded-md bg-[var(--bg)] font-heading focus:outline-none focus:ring-2 focus:ring-film-400 transition-shadow"
            />
            {recipe.customWidth % 2 !== 0 && (
              <p className="text-[10px] text-amber-500 mt-1">
                Warning - Odd number will round up to {recipe.customWidth + 1}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleToggleLock}
            title={locked ? "Unlock aspect ratio" : "Lock aspect ratio"}
            className={cn(
              "mt-5 p-1.5 rounded-md border transition-colors cursor-pointer",
              locked
                ? "border-film-500 bg-film-50 text-film-600"
                : "border-[var(--border)] text-[var(--muted)] hover:border-film-300 hover:text-film-500"
            )}
          >
            {locked ? <Lock size={14} /> : <Unlock size={14} />}
          </button>

          <div className="flex-1">
            <label htmlFor="custom-height" className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)] block mb-1.5">
              Height px
            </label>
            <input
              id="custom-height"
              type="number"
              inputMode="numeric"
              min={16}
              max={7680}
              step={2}
              value={recipe.customHeight}
              spellCheck={false}
              onChange={(e) => handleHeightChange(Number(e.target.value))}
              className="w-full text-sm px-3 py-1.5 border border-[var(--border)] rounded-md bg-[var(--bg)] font-heading focus:outline-none focus:ring-2 focus:ring-film-400 transition-shadow"
            />
            {recipe.customHeight % 2 !== 0 && (
              <p className="text-[10px] text-amber-500 mt-1">
                Warning - Odd number will round up to {recipe.customHeight + 1}
              </p>
            )}
          </div>
        </div>
      )}

      {isSaveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <form
            onSubmit={handleSave}
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-preset-title"
            className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h4 id="save-preset-title" className="font-heading text-sm font-bold uppercase tracking-widest text-[var(--text)]">
                Save preset
              </h4>
              <button
                type="button"
                onClick={() => setIsSaveOpen(false)}
                aria-label="Close save preset dialog"
                className="inline-flex min-h-[32px] min-w-[32px] items-center justify-center rounded-md text-[var(--muted)] hover:bg-[var(--border)]"
              >
                <X size={16} />
              </button>
            </div>

            <label htmlFor="preset-name" className="mb-1.5 block text-[10px] font-heading font-semibold uppercase tracking-wider text-[var(--muted)]">
              Preset name
            </label>
            <input
              id="preset-name"
              ref={presetNameRef}
              value={presetName}
              onChange={(event) => setPresetName(event.target.value)}
              maxLength={60}
              placeholder="Instagram portrait 1080p"
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm font-heading focus:outline-none focus:ring-2 focus:ring-film-400"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsSaveOpen(false)}
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-heading font-bold uppercase tracking-wider text-[var(--muted)] hover:bg-[var(--border)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!presetName.trim()}
                className="rounded-lg bg-film-600 px-3 py-2 text-xs font-heading font-bold uppercase tracking-wider text-white transition-colors hover:bg-film-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
