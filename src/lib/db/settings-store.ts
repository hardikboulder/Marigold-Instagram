/**
 * Settings store — reads + writes the user-editable overrides that sit on top
 * of the JSON seed data in `src/data/`.
 *
 * The seed files are immutable at runtime. Any user edit (Voice & Tone copy,
 * a tweaked product-knowledge entry, posting-cadence numbers, deactivating a
 * template) is persisted as a partial override under one of the dedicated
 * STORE_KEYS namespaces. The `getEffective…` helpers merge JSON defaults with
 * those overrides so the rest of the app (Settings UI, AI engine, Calendar)
 * always reads the merged result.
 */

import {
  STORE_KEYS,
  getStore,
  setStore,
  deleteStore,
} from "@/lib/db/local-store";
import {
  loadBrandConfig,
  loadBrandKnowledge,
  loadContentPillars,
  loadContentSeries,
  loadTemplateDefinitions,
} from "@/lib/db/data-loader";
import type {
  BrandConfig,
  BrandConfigEntry,
  BrandContentStrategy,
  BrandKnowledgeEntry,
  BrandVoice,
  ContentFormat,
  ContentSeries,
  PillarSlug,
  TemplateDefinition,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Brand Voice / Brand Config overrides
// ---------------------------------------------------------------------------

export interface BrandVoiceOverrides {
  tone?: string[];
  pillars?: string[];
  do?: string[];
  dont?: string[];
  example_phrases?: string[];
}

export interface BrandConfigOverrides {
  brand_voice?: BrandVoiceOverrides;
}

export function getBrandConfigOverrides(): BrandConfigOverrides {
  return getStore<BrandConfigOverrides>(STORE_KEYS.brandConfigOverrides, {});
}

export function setBrandConfigOverrides(value: BrandConfigOverrides): void {
  setStore(STORE_KEYS.brandConfigOverrides, value);
}

export function clearBrandConfigOverrides(): void {
  deleteStore(STORE_KEYS.brandConfigOverrides);
}

export function getEffectiveBrandConfig(): BrandConfig {
  const seed = loadBrandConfig();
  const overrides = getBrandConfigOverrides();
  if (!overrides.brand_voice) return seed;

  const mergedVoice: BrandVoice = {
    ...seed.brand_voice.config_value,
    ...overrides.brand_voice,
  };

  const merged: BrandConfig = {
    ...seed,
    brand_voice: {
      ...seed.brand_voice,
      config_value: mergedVoice,
    } as BrandConfigEntry<BrandVoice>,
  };
  return merged;
}

// ---------------------------------------------------------------------------
// Brand Knowledge overrides
// ---------------------------------------------------------------------------

export type BrandKnowledgeOverride = Partial<
  Pick<BrandKnowledgeEntry, "title" | "content" | "is_active" | "category">
>;

export type BrandKnowledgeOverridesMap = Record<string, BrandKnowledgeOverride>;

export function getBrandKnowledgeOverrides(): BrandKnowledgeOverridesMap {
  return getStore<BrandKnowledgeOverridesMap>(
    STORE_KEYS.brandKnowledgeOverrides,
    {},
  );
}

export function setBrandKnowledgeOverride(
  id: string,
  override: BrandKnowledgeOverride,
): void {
  const current = getBrandKnowledgeOverrides();
  current[id] = { ...current[id], ...override };
  setStore(STORE_KEYS.brandKnowledgeOverrides, current);
}

export function clearBrandKnowledgeOverrides(): void {
  deleteStore(STORE_KEYS.brandKnowledgeOverrides);
}

export function getEffectiveBrandKnowledge(): BrandKnowledgeEntry[] {
  const seed = loadBrandKnowledge();
  const overrides = getBrandKnowledgeOverrides();
  return seed.map((entry) => {
    const o = overrides[entry.id];
    if (!o) return entry;
    return { ...entry, ...o };
  });
}

// ---------------------------------------------------------------------------
// Content strategy (posting cadence + series mix + series active toggles)
// ---------------------------------------------------------------------------

export interface ContentStrategySettings {
  posting_cadence: { format: ContentFormat; per_week: number }[];
  pillar_mix: { pillar_slug: PillarSlug; share: number }[];
  series_active: Record<string, boolean>;
}

export function defaultContentStrategy(): ContentStrategySettings {
  const seed = loadBrandConfig().content_strategy
    .config_value as BrandContentStrategy;
  const seriesActive: Record<string, boolean> = {};
  for (const s of loadContentSeries()) seriesActive[s.slug] = s.is_active;
  const pillarMix =
    seed.pillar_mix && seed.pillar_mix.length > 0
      ? seed.pillar_mix.map((m) => ({ ...m }))
      : loadContentPillars().map((p) => ({
          pillar_slug: p.slug,
          share: p.default_share,
        }));
  return {
    posting_cadence: seed.posting_cadence.map((c) => ({ ...c })),
    pillar_mix: pillarMix,
    series_active: seriesActive,
  };
}

export function getContentStrategy(): ContentStrategySettings {
  const stored = getStore<Partial<ContentStrategySettings> | null>(
    STORE_KEYS.contentStrategy,
    null,
  );
  if (!stored) return defaultContentStrategy();
  const fallback = defaultContentStrategy();
  return {
    posting_cadence: stored.posting_cadence ?? fallback.posting_cadence,
    pillar_mix: stored.pillar_mix ?? fallback.pillar_mix,
    series_active: { ...fallback.series_active, ...(stored.series_active ?? {}) },
  };
}

export function setContentStrategy(value: ContentStrategySettings): void {
  setStore(STORE_KEYS.contentStrategy, value);
}

export function clearContentStrategy(): void {
  deleteStore(STORE_KEYS.contentStrategy);
}

export function getEffectiveSeriesList(): ContentSeries[] {
  const strat = getContentStrategy();
  return loadContentSeries().map((s) => ({
    ...s,
    is_active: strat.series_active[s.slug] ?? s.is_active,
  }));
}

// ---------------------------------------------------------------------------
// Template active overrides (Template Library tab)
// ---------------------------------------------------------------------------

export type TemplateActiveOverrides = Record<string, boolean>;

export function getTemplateActiveOverrides(): TemplateActiveOverrides {
  return getStore<TemplateActiveOverrides>(STORE_KEYS.templateActive, {});
}

export function setTemplateActive(slug: string, isActive: boolean): void {
  const current = getTemplateActiveOverrides();
  current[slug] = isActive;
  setStore(STORE_KEYS.templateActive, current);
}

export function clearTemplateActiveOverrides(): void {
  deleteStore(STORE_KEYS.templateActive);
}

export function getEffectiveTemplates(): TemplateDefinition[] {
  const overrides = getTemplateActiveOverrides();
  return loadTemplateDefinitions().map((t) => {
    const o = overrides[t.slug];
    return o === undefined ? t : { ...t, is_active: o };
  });
}
