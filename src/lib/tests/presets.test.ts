import { describe, it, expect } from "vitest";
import { getPresetById, getRecipeDimensions, PRESETS } from "../presets";

describe('getPresetById', () => {
  it('returns correct preset for valid id', () => {
    const preset = getPresetById('vertical-9-16');
    // Using platform since label is '9 : 16'
    expect(preset?.platform).toBe('Reels · TikTok · Shorts');
  });

  it('returns undefined for invalid id', () => {
    expect(getPresetById('invalid-id')).toBeUndefined();
  });

  it('all presets have required fields', () => {
    PRESETS.forEach(p => {
      expect(p.id).toBeTruthy();
      expect(p.width).toBeGreaterThan(0);
      expect(p.height).toBeGreaterThan(0);
      expect(p.label).toBeTruthy();
      expect(p.platform).toBeTruthy();
    });
  });

  it('uses built-in dimensions for built-in preset ids', () => {
    expect(getRecipeDimensions({
      preset: 'instagram-4-5',
      customWidth: 1920,
      customHeight: 1080,
    })).toEqual({ width: 1080, height: 1350 });
  });

  it('uses recipe dimensions for custom preset ids', () => {
    expect(getRecipeDimensions({
      preset: 'custom-preset-123',
      customWidth: 1080,
      customHeight: 1350,
    })).toEqual({ width: 1080, height: 1350 });
  });

  it('uses recipe dimensions for the custom preset editor', () => {
    expect(getRecipeDimensions({
      preset: 'custom',
      customWidth: 1080,
      customHeight: 1350,
    })).toEqual({ width: 1080, height: 1350 });
  });
});
