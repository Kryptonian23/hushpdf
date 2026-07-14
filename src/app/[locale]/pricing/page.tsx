import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, ShieldCheck, Sparkles } from 'lucide-react';
import { setRequestLocale } from 'next-intl/server';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PRICING_PLANS, REWARDED_ACCESS_POLICY } from '@/config/monetization';
import { generateBaseMetadata } from '@/lib/seo/metadata';
import { locales, type Locale } from '@/lib/i18n/config';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface PricingPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PricingPageProps): Promise<Metadata> {
  const { locale } = await params;

  return generateBaseMetadata({
    locale: locale as Locale,
    path: '/pricing',
    title: 'HushPDF Pricing',
    description: 'Compare ad-supported access and HushPDF Personal, Professional, and Teams plans for private PDF processing with zero file uploads.',
    keywords: ['HushPDF pricing', 'private PDF tools', 'professional PDF software', 'PDF workflow software'],
  });
}

export default async function PricingPage({ params }: PricingPageProps) {
  const { locale } = await params;
  const validLocale = locale as Locale;
  setRequestLocale(validLocale);

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(var(--color-background))]">
      <Header locale={validLocale} />

      <main id="main-content" className="flex-1 pt-28 pb-20" tabIndex={-1}>
        <section className="container mx-auto px-4" aria-labelledby="pricing-heading">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full border border-[hsl(var(--color-primary)/0.25)] bg-[hsl(var(--color-primary)/0.08)] text-[hsl(var(--color-primary))]">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span className="text-sm font-semibold">Planned launch pricing</span>
            </div>
            <h1 id="pricing-heading" className="text-4xl md:text-5xl font-bold tracking-tight mb-5">
              Professional PDF tools. Zero uploads.
            </h1>
            <p className="text-lg text-[hsl(var(--color-muted-foreground))] leading-relaxed">
              Choose the HushPDF experience that fits your work. Every plan keeps document processing on your device.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {PRICING_PLANS.map((plan) => (
              <Card
                key={plan.id}
                className={`relative p-7 flex flex-col ${plan.featured ? 'border-[hsl(var(--color-primary))] shadow-xl xl:-translate-y-2' : ''}`}
                hover={false}
              >
                {'badge' in plan && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[hsl(var(--color-primary))] text-white text-xs font-bold uppercase tracking-wide">
                    {plan.badge}
                  </span>
                )}

                <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
                <p className="text-sm text-[hsl(var(--color-muted-foreground))] min-h-12 mb-6">
                  {plan.description}
                </p>

                <div className="mb-2">
                  <span className="text-3xl font-bold">{plan.priceLabel}</span>
                </div>
                <p className="text-sm text-[hsl(var(--color-muted-foreground))] mb-7">
                  {plan.priceDetail}
                </p>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <Check className="h-4 w-4 mt-0.5 shrink-0 text-[hsl(var(--color-success))]" aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href={`/${validLocale}/tools`} className="block">
                  <Button variant={plan.featured ? 'primary' : 'outline'} size="lg" className="w-full">
                    {plan.ctaLabel}
                  </Button>
                </Link>
              </Card>
            ))}
          </div>

          <div className="max-w-4xl mx-auto mt-12 p-6 rounded-2xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-card))] flex flex-col sm:flex-row items-start gap-4">
            <div className="h-11 w-11 rounded-xl bg-[hsl(var(--color-success)/0.1)] flex items-center justify-center shrink-0">
              <ShieldCheck className="h-6 w-6 text-[hsl(var(--color-success))]" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-bold mb-1">Trial and rewarded access are planned, not active</h2>
              <p className="text-sm text-[hsl(var(--color-muted-foreground))] leading-relaxed">
                Subscription checkout is not open yet. Rewarded access will remain disabled until HushPDF has a production domain, consent controls, and provider approval. At launch, it will be web-only, limited to {REWARDED_ACCESS_POLICY.maxUnlocksPerDay} unlocks per day, and will never inspect or upload your documents.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer locale={validLocale} />
    </div>
  );
}
