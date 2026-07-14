import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { locales } from '@/lib/i18n/config';
import { siteConfig } from '@/config/site';

interface Messages {
  metadata: {
    home: { description: string };
    tools: { description: string };
    about: { description: string };
  };
  common: {
    tagline: string;
    navigation: { pricing: string };
  };
  toolsPage: { subtitle: string };
  faqPage: {
    sections: {
      general: {
        whatIs: { answer: string };
        isFree: { question: string; answer: string };
        account: { question: string; answer: string };
      };
    };
  };
  aboutPage: {
    description: string;
    mission: { p1: string };
    values: { free: { title: string; description: string } };
  };
  home: {
    hero: { title: string; highlight: string; subtitle: string; cta: string; pricingCta: string };
    features: { free: { title: string; description: string } };
    stats: { freeToUse: string };
  };
}

const zeroPriceClaims = /\bfree\b|no registration|no premium tiers|no hidden costs/i;

function loadMessages(locale: string): Messages {
  const file = path.join(process.cwd(), 'messages', `${locale}.json`);
  return JSON.parse(fs.readFileSync(file, 'utf8')) as Messages;
}

describe('commercial positioning', () => {
  it.each(locales)('%s avoids zero-price claims in primary marketing copy', (locale) => {
    const messages = loadMessages(locale);
    const primaryCopy = [
      messages.metadata.home.description,
      messages.metadata.tools.description,
      messages.metadata.about.description,
      messages.common.tagline,
      messages.toolsPage.subtitle,
      messages.faqPage.sections.general.whatIs.answer,
      messages.faqPage.sections.general.isFree.question,
      messages.faqPage.sections.general.isFree.answer,
      messages.faqPage.sections.general.account.question,
      messages.faqPage.sections.general.account.answer,
      messages.aboutPage.description,
      messages.aboutPage.mission.p1,
      messages.aboutPage.values.free.title,
      messages.aboutPage.values.free.description,
      messages.home.hero.title,
      messages.home.hero.highlight,
      messages.home.hero.subtitle,
      messages.home.features.free.title,
      messages.home.features.free.description,
      messages.home.stats.freeToUse,
    ];

    for (const value of primaryCopy) {
      expect(value).not.toMatch(zeroPriceClaims);
    }
  });

  it.each(locales)('%s exposes pricing navigation and an honest pre-billing CTA', (locale) => {
    const messages = loadMessages(locale);

    expect(messages.common.navigation.pricing.trim()).not.toBe('');
    expect(messages.home.hero.cta.trim()).not.toBe('');
    expect(messages.home.hero.pricingCta.trim()).not.toBe('');
  });

  it('uses commercial rather than zero-price SEO keywords', () => {
    expect(siteConfig.keywords).toContain('professional PDF tools');
    expect(siteConfig.keywords).not.toContain('free PDF tools');
  });
});
