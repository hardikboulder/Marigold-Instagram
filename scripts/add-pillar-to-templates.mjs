/**
 * One-shot migration: stamp the `pillar` field on every entry in
 * template-definitions.json by reading the matching series' pillar from
 * content-series.json. Idempotent — running twice is a no-op.
 *
 * Usage: node scripts/add-pillar-to-templates.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const seriesPath = path.join(root, "src/data/content-series.json");
const templatesPath = path.join(root, "src/data/template-definitions.json");

const series = JSON.parse(readFileSync(seriesPath, "utf8"));
const seriesPillar = new Map(series.map((s) => [s.slug, s.pillar]));

const templates = JSON.parse(readFileSync(templatesPath, "utf8"));

let touched = 0;
let unmatched = [];

for (const t of templates) {
  const pillar = seriesPillar.get(t.series_slug);
  if (!pillar) {
    unmatched.push({ slug: t.slug, series_slug: t.series_slug });
    continue;
  }
  if (t.pillar === pillar) continue;

  // Insert `pillar` immediately after `series_slug` for readability.
  const reordered = {};
  for (const [k, v] of Object.entries(t)) {
    reordered[k] = v;
    if (k === "series_slug") reordered.pillar = pillar;
  }
  if (!("pillar" in reordered)) reordered.pillar = pillar;

  for (const k of Object.keys(t)) delete t[k];
  Object.assign(t, reordered);
  touched += 1;
}

if (unmatched.length > 0) {
  console.error("Unmatched templates (no pillar found for series):");
  for (const u of unmatched) console.error("  ", u);
  process.exit(1);
}

writeFileSync(templatesPath, JSON.stringify(templates, null, 2) + "\n", "utf8");
console.log(`Updated ${touched}/${templates.length} templates with pillar.`);
