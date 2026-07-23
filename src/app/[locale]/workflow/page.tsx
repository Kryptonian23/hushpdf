import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales, type Locale } from '@/lib/i18n/config';
import { generateBaseMetadata } from '@/lib/seo/metadata';
import WorkflowPageClient from './WorkflowPageClient';

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

interface WorkflowPageProps {
    params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: WorkflowPageProps): Promise<Metadata> {
    const { locale } = await params;
    const validLocale = locale as Locale;
    const t = await getTranslations({ locale: validLocale, namespace: 'workflow' });

    return generateBaseMetadata({
        locale: validLocale,
        path: '/workflow',
        title: t('title'),
        description: t('metaDescription'),
        keywords: ['PDF workflow', 'batch PDF processing', 'private PDF automation'],
    });
}

export default async function WorkflowPage({ params }: WorkflowPageProps) {
    const { locale } = await params;

    // Enable static rendering
    setRequestLocale(locale);

    return <WorkflowPageClient locale={locale as Locale} />;
}
