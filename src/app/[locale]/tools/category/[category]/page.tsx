import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales, type Locale } from '@/lib/i18n/config';
import { TOOL_CATEGORIES, type ToolCategory } from '@/types/tool';
import CategoryPageClient from './CategoryPageClient';
import { notFound } from 'next/navigation';
import { generateBaseMetadata } from '@/lib/seo/metadata';

const categoryTranslationKeys: Record<ToolCategory, string> = {
    'edit-annotate': 'editAnnotate',
    'convert-to-pdf': 'convertToPdf',
    'convert-from-pdf': 'convertFromPdf',
    'organize-manage': 'organizeManage',
    'optimize-repair': 'optimizeRepair',
    'secure-pdf': 'securePdf',
};

export function generateStaticParams() {
    return locales.flatMap((locale) =>
        TOOL_CATEGORIES.map((category) => ({
            locale,
            category,
        }))
    );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; category: string }> }): Promise<Metadata> {
    const { locale, category } = await params;
    if (!TOOL_CATEGORIES.includes(category as ToolCategory)) {
        notFound();
    }

    const validLocale = locale as Locale;
    const translationKey = categoryTranslationKeys[category as ToolCategory];
    const t = await getTranslations({ locale: validLocale, namespace: 'home' });
    const categoryName = t(`categories.${translationKey}`);

    return generateBaseMetadata({
        locale: validLocale,
        path: `/tools/category/${category}`,
        title: `${categoryName} PDF Tools`,
        description: t(`categoriesDescription.${translationKey}`),
        keywords: [categoryName, 'PDF tools', 'private PDF processing'],
    });
}

export default async function CategoryPage({ params }: { params: Promise<{ locale: string; category: string }> }) {
    const { locale, category } = await params;

    // Validate category
    if (!TOOL_CATEGORIES.includes(category as ToolCategory)) {
        notFound();
    }

    // Enable static rendering
    setRequestLocale(locale);

    // Get localized content for tools
    const { tools } = await import('@/config/tools');
    const { getToolContent } = await import('@/config/tool-content');

    const localizedToolContent = tools.reduce((acc, tool) => {
        const content = getToolContent(locale as Locale, tool.id);
        if (content) {
            acc[tool.id] = {
                title: content.title,
                description: content.metaDescription
            };
        }
        return acc;
    }, {} as Record<string, { title: string; description: string }>);

    return (
        <CategoryPageClient
            locale={locale as Locale}
            category={category as ToolCategory}
            localizedToolContent={localizedToolContent}
        />
    );
}
