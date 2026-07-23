'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { defaultLocale, locales } from '@/lib/i18n/config';

export function RootRedirect() {
  const router = useRouter();

  useEffect(() => {
    try {
      const browserLanguage = navigator.language;
      const exactLocale = locales.find(
        (locale) => locale.toLowerCase() === browserLanguage.toLowerCase()
      );
      const primaryLocale = browserLanguage.split('-')[0];
      const locale = exactLocale
        ?? locales.find((candidate) => candidate === primaryLocale)
        ?? defaultLocale;

      router.replace(`/${locale}/`);
    } catch {
      router.replace(`/${defaultLocale}/`);
    }
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center p-6 text-center">
      <div>
        <p className="mb-3 text-muted-foreground">Opening HushPDF in your preferred language…</p>
        <Link className="text-primary underline" href="/en/">
          Continue to HushPDF
        </Link>
      </div>
    </main>
  );
}
