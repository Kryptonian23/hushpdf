import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'public/images/hushpdf-icon-generated.png');
const master = path.join(root, 'public/images/hushpdf-icon-master.png');

const sourceMetadata = await sharp(source).metadata();
const width = sourceMetadata.width;
const height = sourceMetadata.height;

if (!width || !height || width !== height) {
  throw new Error('The HushPDF icon source must be a square raster image.');
}

const cornerRadius = Math.round(width * 0.2);
const roundedMask = Buffer.from(`
  <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" rx="${cornerRadius}" fill="white"/>
  </svg>
`);

await sharp(source)
  .ensureAlpha()
  .composite([{ input: roundedMask, blend: 'dest-in' }])
  .png()
  .toFile(master);

const assets = [
  ['public/images/logo.png', 120, false],
  ['public/favicon.png', 32, false],
  ['public/apple-touch-icon.png', 180, true],
  ['public/icon-192.png', 192, true],
  ['public/icon-512.png', 512, true],
  ['extension/icons/icon16.png', 16, false],
  ['extension/icons/icon48.png', 48, false],
  ['extension/icons/icon128.png', 128, false],
];

await Promise.all(
  assets.map(([relativePath, size, opaque]) => {
    const image = sharp(master).resize(size, size, {
      fit: 'cover',
      kernel: sharp.kernel.lanczos3,
    });

    return (opaque ? image.flatten({ background: '#06142f' }) : image)
      .png()
      .toFile(path.join(root, relativePath));
  }),
);

const socialBackground = Buffer.from(`
  <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#06142f"/>
        <stop offset="1" stop-color="#0b3154"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#background)"/>
    <circle cx="1080" cy="80" r="260" fill="#16b8c4" opacity="0.10"/>
    <circle cx="1010" cy="600" r="330" fill="#2378ce" opacity="0.12"/>
    <text x="500" y="270" fill="#f8f5ef" font-family="Inter, Arial, sans-serif" font-size="92" font-weight="700">HushPDF</text>
    <text x="505" y="345" fill="#8fdae1" font-family="Inter, Arial, sans-serif" font-size="36" font-weight="600">Private PDF tools. Zero uploads.</text>
    <text x="505" y="408" fill="#c5d1df" font-family="Inter, Arial, sans-serif" font-size="27">Your documents stay on your device.</text>
  </svg>
`);

const socialIcon = await sharp(master).resize(340, 340).png().toBuffer();

await sharp(socialBackground)
  .composite([{ input: socialIcon, left: 90, top: 145 }])
  .png()
  .toFile(path.join(root, 'public/images/og-image.png'));

console.log('Generated HushPDF web, social, and extension brand assets.');
