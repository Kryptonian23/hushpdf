import type { BillingPlan, EntitlementResponse, SubscriptionStatus } from './types';

export type AccessRequirement = 'personal' | 'professional';

/**
 * Professional-only tools match the public Professional plan: workflow,
 * batch processing, advanced OCR/automation, and prepress utilities.
 * Everything else in the single-tool catalog is part of Personal.
 */
export const PROFESSIONAL_TOOL_IDS = [
  'ocr-pdf',
  'posterize-pdf',
  'pdf-booklet',
  'pdf-to-pdfa',
  'font-to-outline',
  'extract-tables',
  'ai-pdf-reflower',
  'citation-linker',
  'vector-extractor',
  'deep-sanitize',
  'booklet-folding-simulator',
  'pdf-to-slide',
  'form-logic-designer',
  'eink-optimizer',
  'cert-cryptor',
  'passport-id-composer',
  'annotation-exporter',
  'batch-watermark-remover',
  'smart-data-redactor',
  'bookmarks-auto-generator',
  'batch-barcode-injector',
  'signature-ink-optimizer',
  'dead-link-debugger',
  'interactive-toc-generator',
  'global-invoice-parser',
  'pdf-deskew-aligner',
  'pdf-two-column-reflower',
  'pdf-page-resizer-uniform',
  'handwriting-ink-contrast-booster',
  'pdf-spine-bookbinder',
  'pdf-signature-anchor-helper',
  'pdf-lossless-slicer',
  'pdf-scratchpad-canvas',
  'photo-tiling-prepress',
] as const;

const ACCESS_STATUSES: readonly SubscriptionStatus[] = ['active', 'trialing'];
const PROFESSIONAL_PLANS: readonly BillingPlan[] = ['professional', 'teams'];

export function requiredPlanForTool(toolId: string): AccessRequirement {
  return PROFESSIONAL_TOOL_IDS.some((professionalId) => professionalId === toolId)
    ? 'professional'
    : 'personal';
}
export function hasSubscriptionAccess(
  entitlement: EntitlementResponse,
  requirement: AccessRequirement,
): boolean {
  if (!ACCESS_STATUSES.includes(entitlement.status) || !entitlement.plan) {
    return false;
  }

  if (requirement === 'professional') {
    return PROFESSIONAL_PLANS.includes(entitlement.plan);
  }

  return entitlement.plan === 'personal' || PROFESSIONAL_PLANS.includes(entitlement.plan);
}
