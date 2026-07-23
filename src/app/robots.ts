/**
 * Robots.txt Generation
 * Configures crawling rules for search engines
 * 
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */

import { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';

// Required for static export
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  // Account pages are crawlable so their page-level `noindex` directive can
  // be read. API routes remain outside the public search surface.
  const privatePaths = ['/api/'];

  return {
    rules: [
      {
        // OpenAI's search crawler is separate from its model-training crawler.
        // Search access makes public pages eligible to be surfaced and cited.
        userAgent: 'OAI-SearchBot',
        allow: '/',
        disallow: privatePaths,
      },
      {
        // Google Search is the discovery layer for Google AI features.
        userAgent: 'Googlebot',
        allow: '/',
        disallow: privatePaths,
      },
      {
        // Google documents this token as controlling Gemini training and
        // grounding from the Google Search index. It is not a ranking signal.
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: privatePaths,
      },
      {
        // Bing's index grounds Copilot and other AI search experiences.
        userAgent: 'Bingbot',
        allow: '/',
        disallow: privatePaths,
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: privatePaths,
      },
      {
        userAgent: 'Claude-SearchBot',
        allow: '/',
        disallow: privatePaths,
      },
      {
        userAgent: 'Claude-User',
        allow: '/',
        disallow: privatePaths,
      },
      {
        // Discovery does not require granting model-training access.
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'ClaudeBot',
        disallow: '/',
      },
      {
        // Other standards-compliant search and assistant crawlers can access
        // every public page and the resources needed to render it.
        userAgent: '*',
        allow: '/',
        disallow: privatePaths,
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
