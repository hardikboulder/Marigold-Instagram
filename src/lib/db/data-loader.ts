/**
 * Loaders for the JSON seed data under `src/data/`.
 *
 * The seed files are imported via `resolveJsonModule` so they are bundled
 * into the app at build time. These loaders are the only place the rest of
 * the app should read seed data — they cast the raw JSON to the strict
 * domain types defined in `src/lib/types.ts`.
 */

import brandConfigJson from "@/data/brand-config.json";
import contentSeriesJson from "@/data/content-series.json";
import templateDefinitionsJson from "@/data/template-definitions.json";
import brandKnowledgeJson from "@/data/brand-knowledge.json";
import contentPillarsJson from "@/data/content-pillars.json";

import type {
  BrandConfig,
  BrandKnowledgeEntry,
  ContentPillar,
  ContentSeries,
  PillarSlug,
  TemplateDefinition,
} from "@/lib/types";

export function loadBrandConfig(): BrandConfig {
  return brandConfigJson as unknown as BrandConfig;
}

export function loadContentSeries(): ContentSeries[] {
  return contentSeriesJson as unknown as ContentSeries[];
}

export function loadTemplateDefinitions(): TemplateDefinition[] {
  return templateDefinitionsJson as unknown as TemplateDefinition[];
}

export function loadBrandKnowledge(): BrandKnowledgeEntry[] {
  return brandKnowledgeJson as unknown as BrandKnowledgeEntry[];
}

export function loadContentPillars(): ContentPillar[] {
  return (contentPillarsJson as unknown as ContentPillar[])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order);
}

// ---------------------------------------------------------------------------
// Convenience lookups
// ---------------------------------------------------------------------------

export function getSeriesBySlug(seriesSlug: string): ContentSeries | null {
  return loadContentSeries().find((s) => s.slug === seriesSlug) ?? null;
}

export function getPillarBySlug(pillarSlug: PillarSlug): ContentPillar | null {
  return loadContentPillars().find((p) => p.slug === pillarSlug) ?? null;
}

export function getSeriesByPillar(pillarSlug: PillarSlug): ContentSeries[] {
  return loadContentSeries()
    .filter((s) => s.is_active && s.pillar === pillarSlug)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function getTemplatesByPillar(
  pillarSlug: PillarSlug,
): TemplateDefinition[] {
  return loadTemplateDefinitions()
    .filter((t) => t.is_active && t.pillar === pillarSlug)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function getTemplatesBySeries(seriesSlug: string): TemplateDefinition[] {
  return loadTemplateDefinitions()
    .filter((t) => t.series_slug === seriesSlug)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function getTemplateBySlug(
  templateSlug: string,
): TemplateDefinition | null {
  return loadTemplateDefinitions().find((t) => t.slug === templateSlug) ?? null;
}

/**
 * Resolves the pillar a template belongs to, falling back to its home
 * series' pillar if the template definition itself hasn't been migrated.
 * Used during the rollout to keep stale data working.
 */
export function resolvePillarForTemplate(
  template: Pick<TemplateDefinition, "pillar" | "series_slug">,
): PillarSlug | null {
  if (template.pillar) return template.pillar;
  const series = getSeriesBySlug(template.series_slug);
  return series?.pillar ?? null;
}

export function getBrandKnowledgeByCategory(
  category: BrandKnowledgeEntry["category"],
): BrandKnowledgeEntry[] {
  return loadBrandKnowledge().filter(
    (e) => e.is_active && e.category === category,
  );
}
