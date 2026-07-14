import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const config = [
  {
    ignores: [
      '.next/**',
      'coverage/**',
      'node_modules/**',
      'out/**',
      'public/**',
      'src-tauri/**',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    // Existing PDF/WASM integrations rely heavily on untyped third-party APIs.
    // Keep this legacy debt visible without preventing unrelated changes from
    // establishing a clean CI baseline.
    rules: {
      '@next/next/no-assign-module-variable': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      'prefer-const': 'warn',
      'react/no-unescaped-entities': 'warn',
    },
  },
];

export default config;
