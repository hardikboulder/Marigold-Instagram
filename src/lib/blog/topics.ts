/**
 * Loader + typed accessor for src/data/blog-topic-questions.json.
 *
 * The JSON is the single source of truth for the public blog-post intake
 * form at /submit/blog — adding a new topic is a JSON edit, not a code
 * change. This module imports that JSON and exposes a small typed API
 * the form, the AI prompt builder, and the submit route all share.
 */

import topicsConfig from "@/data/blog-topic-questions.json";

export interface BlogTopicQuestion {
  id: string;
  question: string;
  placeholder?: string;
  maxLength: number;
  required?: boolean;
}

export interface BlogTopic {
  id: string;
  title: string;
  description: string;
  estimatedReadingTime: string;
  questions: BlogTopicQuestion[];
}

interface BlogCategoryConfig {
  label: string;
  topics: BlogTopic[];
}

interface BlogTopicsConfig {
  categories: Record<string, BlogCategoryConfig>;
  defaultTopics: BlogTopic[];
}

const config = topicsConfig as unknown as BlogTopicsConfig;

/** All categories that have a curated topic list. */
export function getCategoriesWithTopics(): string[] {
  return Object.keys(config.categories);
}

/**
 * Topics shown to a vendor for the given category id (e.g. "photographer",
 * "decorator-floral"). Falls back to the default topic set when the category
 * isn't in the curated config — every category gets at least the three
 * generic "What every couple should know…" prompts so the form is usable
 * for any vendor. Default topic titles are already category-agnostic, so no
 * substitution happens here; the AI gets the vendor's self-described
 * category (passed separately) and weaves it into the post.
 */
export function getTopicsForCategory(categoryId: string): BlogTopic[] {
  const curated = config.categories[categoryId]?.topics;
  if (curated && curated.length > 0) return curated;
  return config.defaultTopics.map((t) => ({
    ...t,
    id: `${categoryId}--${t.id}`,
  }));
}

/** Look up a single topic. Falls back to default topics if not curated. */
export function getTopicById(
  categoryId: string,
  topicId: string,
): BlogTopic | null {
  const topics = getTopicsForCategory(categoryId);
  return topics.find((t) => t.id === topicId) ?? null;
}
