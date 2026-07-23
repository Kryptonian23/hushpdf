import { describe, expect, it } from 'vitest';
import sitemap, { getSitemapUrlCount } from '@/app/sitemap';
import { getAllTools } from '@/config/tools';
import { indexableLocales } from '@/lib/i18n/config';
import { TOOL_CATEGORIES } from '@/types/tool';

describe('sitemap', () => {
  it('publishes canonical, translated URLs with language alternates', () => {
    const entries = sitemap();

    expect(entries).toHaveLength(getSitemapUrlCount());
    expect(entries).toHaveLength((8 + TOOL_CATEGORIES.length + getAllTools().length) * indexableLocales.length);
    expect(entries.every((entry) => entry.url.endsWith('/'))).toBe(true);
    expect(entries.every((entry) => entry.lastModified === undefined)).toBe(true);
    expect(entries.some((entry) => entry.url.includes('/ro/'))).toBe(false);
    expect(entries.some((entry) => entry.url.endsWith('/en/tools/category/secure-pdf/'))).toBe(true);

    for (const entry of entries) {
      const languages = entry.alternates?.languages;
      expect(languages?.ro).toBeUndefined();
      expect(languages?.['x-default']).toContain('/en/');
    }
  });
});
