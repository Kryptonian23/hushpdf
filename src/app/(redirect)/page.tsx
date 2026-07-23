import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { RootRedirect } from './RootRedirect';

export const metadata: Metadata = {
  title: 'HushPDF - Professional PDF Tools',
  description: siteConfig.description,
  alternates: { canonical: `${siteConfig.url}/en/` },
  robots: { index: false, follow: true },
};

export default function RootPage() {
  return <RootRedirect />;
}
