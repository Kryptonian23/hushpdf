/**
 * Public monetization policy shared by pricing UI and future access checks.
 *
 * Live rewarded access remains opt-in and disabled by default. Enabling the
 * public flag is only one launch step; consent, provider approval, and a
 * server-verifiable reward grant are still required before production use.
 */

export const PAID_ONLY_HEAVY_TOOL_IDS = [
  'word-to-pdf',
  'excel-to-pdf',
  'pptx-to-pdf',
  'ppt-to-pdf',
  'rtf-to-pdf',
] as const;

export const REWARDED_ACCESS_POLICY = {
  provider: 'google-adsense-offerwall',
  durationMinutes: 30,
  maxUnlocksPerDay: 3,
  webOnly: true,
  excludedToolIds: PAID_ONLY_HEAVY_TOOL_IDS,
} as const;

export function isRewardedAccessEnabled(): boolean {
  return process.env.NEXT_PUBLIC_REWARDED_ACCESS_ENABLED === 'true';
}

export function isRewardedToolEligible(toolId: string): boolean {
  return !PAID_ONLY_HEAVY_TOOL_IDS.some((excludedToolId) => excludedToolId === toolId);
}

export const PRICING_PLANS = [
  {
    id: 'ad-supported',
    name: 'Ad-supported',
    priceLabel: 'Watch to unlock',
    priceDetail: 'One rewarded ad unlocks supported web tools for 30 minutes',
    description: 'Occasional access to standard browser tools without a subscription.',
    badge: 'Planned option',
    featured: false,
    ctaLabel: 'Explore supported tools',
    features: [
      'Voluntary rewarded ad; never placed beside document controls',
      'Up to three 30-minute unlocks per day',
      'Browser access only',
      'Large Office conversions excluded',
    ],
  },
  {
    id: 'personal',
    name: 'Personal',
    priceLabel: '$7',
    priceDetail: 'per month · $49 billed annually',
    description: 'Private PDF essentials for everyday document work.',
    featured: false,
    ctaLabel: 'Explore HushPDF',
    features: [
      'Core edit, convert, organize, optimize, and security tools',
      'Signed desktop application',
      'Product updates',
      'Local project history',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    priceLabel: '$12',
    priceDetail: 'per month · $99 billed annually',
    description: 'Advanced workflows and automation for serious PDF work.',
    badge: 'Most popular',
    featured: true,
    ctaLabel: 'Explore HushPDF',
    features: [
      'Everything in Personal',
      'Batch processing',
      'Workflow builder and reusable templates',
      'Advanced OCR, automation, and prepress tools',
      'Priority support',
    ],
  },
  {
    id: 'teams',
    name: 'Teams',
    priceLabel: '$15',
    priceDetail: 'per user / month · billed annually · 3-seat minimum',
    description: 'Centralized access and support for privacy-conscious teams.',
    featured: false,
    ctaLabel: 'Explore HushPDF',
    features: [
      'Everything in Professional',
      'Centralized billing and seat administration',
      'Organization policy presets',
      'Deployment assistance',
      'Business support',
    ],
  },
] as const;
