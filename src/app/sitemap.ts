/**
 * Sitemap Generation
 * Generates sitemap.xml for all pages across all locales
 * 
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */

import { MetadataRoute } from 'next';
import { indexableLocales, type Locale } from '@/lib/i18n/config';
import { getAllTools } from '@/config/tools';
import { TOOL_CATEGORIES } from '@/types/tool';
import { getAlternateUrls, getCanonicalUrl } from '@/lib/seo/metadata';

// Required for static export
export const dynamic = 'force-static';

/**
 * Priority values for different page types
 */
const PRIORITY = {
  home: 1.0,
  tools: 0.9,
  toolPage: 0.8,
  category: 0.75,
  static: 0.6,
} as const;

/**
 * Change frequency for different page types
 */
const CHANGE_FREQUENCY = {
  home: 'daily',
  tools: 'weekly',
  toolPage: 'weekly',
  static: 'monthly',
} as const;

/**
 * Static pages that exist for all locales
 */
const STATIC_PAGES = [
  { path: '', priority: PRIORITY.home, changeFrequency: CHANGE_FREQUENCY.home },
  { path: '/tools', priority: PRIORITY.tools, changeFrequency: CHANGE_FREQUENCY.tools },
  { path: '/workflow', priority: PRIORITY.tools, changeFrequency: CHANGE_FREQUENCY.tools },
  { path: '/pricing', priority: PRIORITY.static, changeFrequency: CHANGE_FREQUENCY.static },
  { path: '/about', priority: PRIORITY.static, changeFrequency: CHANGE_FREQUENCY.static },
  { path: '/faq', priority: PRIORITY.static, changeFrequency: CHANGE_FREQUENCY.static },
  { path: '/privacy', priority: PRIORITY.static, changeFrequency: CHANGE_FREQUENCY.static },
  { path: '/contact', priority: PRIORITY.static, changeFrequency: CHANGE_FREQUENCY.static },
];

/**
 * Generate sitemap entries for a specific locale
 */
function createEntry(
  locale: Locale,
  path: string,
  changeFrequency: 'daily' | 'weekly' | 'monthly',
  priority: number
): MetadataRoute.Sitemap[number] {
  return {
    url: getCanonicalUrl(locale, path),
    changeFrequency,
    priority,
    alternates: { languages: getAlternateUrls(path) },
  };
}

function generateLocaleEntries(locale: Locale): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  
  // Add static pages
  for (const page of STATIC_PAGES) {
    entries.push(createEntry(
      locale,
      page.path,
      page.changeFrequency as 'daily' | 'weekly' | 'monthly',
      page.priority
    ));
  }

  for (const category of TOOL_CATEGORIES) {
    entries.push(createEntry(
      locale,
      `/tools/category/${category}`,
      CHANGE_FREQUENCY.tools,
      PRIORITY.category
    ));
  }
  
  // Add tool pages
  const tools = getAllTools();
  for (const tool of tools) {
    entries.push(createEntry(
      locale,
      `/tools/${tool.slug}`,
      CHANGE_FREQUENCY.toolPage,
      PRIORITY.toolPage
    ));
  }
  
  return entries;
}

/**
 * Generate the complete sitemap
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const allEntries: MetadataRoute.Sitemap = [];
  
  // Generate entries for each locale
  for (const locale of indexableLocales) {
    const localeEntries = generateLocaleEntries(locale);
    allEntries.push(...localeEntries);
  }
  
  return allEntries;
}

/**
 * Get total number of URLs in sitemap
 * Useful for testing and validation
 */
export function getSitemapUrlCount(): number {
  const tools = getAllTools();
  const staticPagesCount = STATIC_PAGES.length;
  const toolPagesCount = tools.length;
  const categoryPagesCount = TOOL_CATEGORIES.length;
  const localesCount = indexableLocales.length;
  
  return (staticPagesCount + categoryPagesCount + toolPagesCount) * localesCount;
}
