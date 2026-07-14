/**
 * Site configuration
 */
const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');

export const siteConfig = {
  name: 'HushPDF',
  description: 'Private PDF tools with zero file uploads. Edit, convert, secure, and automate PDFs directly on your device.',
  url: configuredSiteUrl || 'http://localhost:3000',
  ogImage: '/images/og-image.png',
  links: {
    upstream: 'https://github.com/PDFCraftTool/pdfcraft',
    source: process.env.NEXT_PUBLIC_SOURCE_URL || 'https://github.com/Kryptonian23/hushpdf',
  },
  creator: 'HushPDF contributors',
  keywords: [
    'PDF tools',
    'PDF editor',
    'merge PDF',
    'split PDF',
    'compress PDF',
    'convert PDF',
    'professional PDF tools',
    'online PDF editor',
    'browser-based PDF',
    'private PDF processing',
    'no upload PDF tools',
    'local PDF processing',
    'offline PDF tools',
  ],
  // SEO-related settings
  seo: {
    titleTemplate: '%s | HushPDF',
    defaultTitle: 'HushPDF - Private PDF Tools With Zero Uploads',
    locale: 'en_US',
  },
};

/**
 * Navigation configuration
 */
export const navConfig = {
  mainNav: [
    { title: 'Home', href: '/' },
    { title: 'Tools', href: '/tools' },
    { title: 'About', href: '/about' },
    { title: 'FAQ', href: '/faq' },
  ],
  footerNav: [
    { title: 'Privacy', href: '/privacy' },
    { title: 'Contact', href: '/contact' },
  ],
};
