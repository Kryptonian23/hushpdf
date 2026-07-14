import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Code2, ExternalLink, Scale } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { locales, type Locale } from '@/lib/i18n/config';
import { siteConfig } from '@/config/site';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: 'Source Code & License | HushPDF',
  description: 'HushPDF source code, license, and upstream project attribution.',
};

export default async function SourcePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sourceUrl = siteConfig.links.source;

  return (
    <div className="min-h-screen flex flex-col">
      <Header locale={locale as Locale} />
      <main id="main-content" className="flex-1">
        <section className="bg-gradient-to-br from-[hsl(var(--color-primary)/0.1)] via-[hsl(var(--color-background))] to-[hsl(var(--color-secondary)/0.1)] py-16">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <Code2 className="mx-auto mb-6 h-14 w-14 text-[hsl(var(--color-primary))]" />
            <h1 className="text-4xl md:text-5xl font-bold mb-5">Source code & license</h1>
            <p className="text-lg text-[hsl(var(--color-muted-foreground))]">
              HushPDF is free software. You can inspect, modify, and share it under the GNU Affero General Public License version 3.
            </p>
          </div>
        </section>

        <section className="py-14">
          <div className="container mx-auto px-4 max-w-3xl space-y-8">
            <div className="rounded-2xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] p-7">
              <div className="flex items-center gap-3 mb-3">
                <Code2 className="h-5 w-5 text-[hsl(var(--color-primary))]" />
                <h2 className="text-xl font-semibold">HushPDF source</h2>
              </div>
              {sourceUrl ? (
                <a className="inline-flex items-center gap-2 text-[hsl(var(--color-primary))] hover:underline" href={sourceUrl}>
                  View the complete source for this version <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <p className="text-[hsl(var(--color-muted-foreground))]">
                  This development build is running from its complete local source tree. A permanent public source URL will be added here before HushPDF is publicly deployed.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] p-7">
              <div className="flex items-center gap-3 mb-3">
                <Scale className="h-5 w-5 text-[hsl(var(--color-primary))]" />
                <h2 className="text-xl font-semibold">License and attribution</h2>
              </div>
              <p className="mb-4 text-[hsl(var(--color-muted-foreground))]">
                HushPDF is a modified distribution of PDFCraft. Existing copyright notices are preserved, and the combined work remains licensed under the GNU AGPLv3.
              </p>
              <div className="flex flex-wrap gap-5">
                <a className="text-[hsl(var(--color-primary))] hover:underline" href="/LICENSE.txt">Read the GNU AGPLv3</a>
                <a className="inline-flex items-center gap-2 text-[hsl(var(--color-primary))] hover:underline" href={siteConfig.links.upstream}>
                  View the PDFCraft upstream project <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer locale={locale as Locale} />
    </div>
  );
}
