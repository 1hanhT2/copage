import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));

/**
 * Creates a square contained favicon buffer with comfortable transparent padding.
 */
async function createSquareFaviconBuffer(sourceFile, size, paddingPercent = 0.05) {
  const trimmedBuf = await sharp(sourceFile).trim().toBuffer();
  const padding = Math.max(1, Math.round(size * paddingPercent));
  const innerSize = Math.max(1, size - padding * 2);

  return sharp(trimmedBuf)
    .resize(innerSize, innerSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3
    })
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .resize(size, size)
    .png()
    .toBuffer();
}

/**
 * Encodes 32x32 and 16x16 PNG buffers into a valid multi-resolution Windows ICO file.
 */
function buildIcoFile(png32Buffer, png16Buffer) {
  const images = [
    { size: 32, buffer: png32Buffer },
    { size: 16, buffer: png16Buffer }
  ];

  const headerSize = 6;
  const dirEntrySize = 16;
  let currentOffset = headerSize + dirEntrySize * images.length;

  const totalLength = currentOffset + images.reduce((acc, img) => acc + img.buffer.length, 0);
  const icoBuf = Buffer.alloc(totalLength);

  // ICONDIR Header
  icoBuf.writeUInt16LE(0, 0); // Reserved. Must always be 0.
  icoBuf.writeUInt16LE(1, 2); // Specifies image type: 1 for icon (.ICO)
  icoBuf.writeUInt16LE(images.length, 4); // Number of images

  // ICONDIRENTRY list
  images.forEach((img, idx) => {
    const entryOffset = headerSize + idx * dirEntrySize;
    icoBuf.writeUInt8(img.size, entryOffset); // Width
    icoBuf.writeUInt8(img.size, entryOffset + 1); // Height
    icoBuf.writeUInt8(0, entryOffset + 2); // Color count (0 if >= 8bpp)
    icoBuf.writeUInt8(0, entryOffset + 3); // Reserved
    icoBuf.writeUInt16LE(1, entryOffset + 4); // Color planes
    icoBuf.writeUInt16LE(32, entryOffset + 6); // Bits per pixel
    icoBuf.writeUInt32LE(img.buffer.length, entryOffset + 8); // Size of image data in bytes
    icoBuf.writeUInt32LE(currentOffset, entryOffset + 12); // Offset of image data from beginning

    img.buffer.copy(icoBuf, currentOffset);
    currentOffset += img.buffer.length;
  });

  return icoBuf;
}

export async function generateIcons() {
  const darkLogo = path.join(rootDir, 'copage-logo-for-dark-mode.png');
  const whiteLogo = path.join(rootDir, 'copage-logo-for-white-mode.png');
  const mini1Logo = path.join(rootDir, 'copage-logo-mini1.png'); // Mini logo 1: for dark mode
  const mini2Logo = path.join(rootDir, 'copage-mini-2.png');      // Mini logo 2: for white mode

  const assetsDir = path.join(rootDir, 'public/assets');
  const srcAssetsDir = path.join(rootDir, 'src/assets');
  const iconsDir = path.join(rootDir, 'public/icons');

  fs.mkdirSync(assetsDir, { recursive: true });
  fs.mkdirSync(srcAssetsDir, { recursive: true });
  fs.mkdirSync(iconsDir, { recursive: true });

  // 1. Copy full wordmark logos to public/assets and src/assets
  for (const dir of [assetsDir, srcAssetsDir]) {
    if (fs.existsSync(darkLogo)) {
      fs.copyFileSync(darkLogo, path.join(dir, 'copage-logo-dark.png'));
      fs.copyFileSync(darkLogo, path.join(dir, 'copage-logo-for-dark-mode.png'));
    }
    if (fs.existsSync(whiteLogo)) {
      fs.copyFileSync(whiteLogo, path.join(dir, 'copage-logo-white.png'));
      fs.copyFileSync(whiteLogo, path.join(dir, 'copage-logo-for-white-mode.png'));
    }
  }

  // 2. Synchronize official mini logos (1 is for dark mode, 2 is for white mode)
  for (const dir of [assetsDir, srcAssetsDir]) {
    if (fs.existsSync(mini1Logo)) {
      fs.copyFileSync(mini1Logo, path.join(dir, 'copage-logo-mini1.png'));
      fs.copyFileSync(mini1Logo, path.join(dir, 'copage-logo-mini-dark.png'));
    }
    if (fs.existsSync(mini2Logo)) {
      fs.copyFileSync(mini2Logo, path.join(dir, 'copage-mini-2.png'));
      fs.copyFileSync(mini2Logo, path.join(dir, 'copage-logo-mini-white.png'));
      fs.copyFileSync(mini2Logo, path.join(dir, 'copage-logo-mini-light.png'));
    }
  }

  // 3. Generate Favicons: Mini 1 for dark mode, Mini 2 for white mode
  if (fs.existsSync(mini1Logo) && fs.existsSync(mini2Logo)) {
    // Dark mode favicons (Mini 1)
    const dark128 = await createSquareFaviconBuffer(mini1Logo, 128);
    const dark32 = await createSquareFaviconBuffer(mini1Logo, 32);
    const dark16 = await createSquareFaviconBuffer(mini1Logo, 16);

    // White mode favicons (Mini 2)
    const light128 = await createSquareFaviconBuffer(mini2Logo, 128);
    const light32 = await createSquareFaviconBuffer(mini2Logo, 32);
    const light16 = await createSquareFaviconBuffer(mini2Logo, 16);

    for (const dir of [assetsDir, srcAssetsDir]) {
      fs.writeFileSync(path.join(dir, 'favicon-dark.png'), dark128);
      fs.writeFileSync(path.join(dir, 'favicon-dark-32.png'), dark32);
      fs.writeFileSync(path.join(dir, 'favicon-dark-16.png'), dark16);
      fs.writeFileSync(path.join(dir, 'favicon.png'), dark128); // Default fallback

      fs.writeFileSync(path.join(dir, 'favicon-light.png'), light128);
      fs.writeFileSync(path.join(dir, 'favicon-white.png'), light128);
      fs.writeFileSync(path.join(dir, 'favicon-light-32.png'), light32);
      fs.writeFileSync(path.join(dir, 'favicon-light-16.png'), light16);
    }

    // Generate root public/favicon.ico
    const icoBuf = buildIcoFile(dark32, dark16);
    fs.writeFileSync(path.join(rootDir, 'public/favicon.ico'), icoBuf);
    console.log('✓ Generated dark mode & white mode mini logo favicons + favicon.ico');
  }

  // 4. Generate Chrome extension icons with M3 Dark Squircle Badge from mini logo
  if (fs.existsSync(mini1Logo)) {
    const trimmedMini = await sharp(mini1Logo).trim().toBuffer();

    for (const s of [16, 32, 48, 128]) {
      const r = s <= 16 ? 3 : Math.max(2, Math.round(s * 0.22));
      const pad = s <= 16 ? 1 : (s <= 32 ? 2 : Math.max(2, Math.round(s * 0.1)));
      const inner = Math.max(2, s - pad * 2);

      const svgSquircle = Buffer.from(`
        <svg width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="0" width="${s}" height="${s}" rx="${r}" ry="${r}" fill="#16161b" />
          <rect x="0.5" y="0.5" width="${s - 1}" height="${s - 1}" rx="${r}" ry="${r}" fill="none" stroke="rgba(255,255,255,0.16)" stroke-width="1" />
        </svg>
      `);

      const miniResized = await sharp(trimmedMini)
        .resize(inner, inner, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
          kernel: sharp.kernel.lanczos3
        })
        .toBuffer();

      const iconBuffer = await sharp(svgSquircle)
        .composite([{ input: miniResized, gravity: 'center' }])
        .png()
        .toBuffer();

      fs.writeFileSync(path.join(iconsDir, `icon-${s}.png`), iconBuffer);
    }
    console.log('✓ Generated M3 Dark Squircle mini extension icons (16, 32, 48, 128)');
  }

  // 5. Extract and isolate the chromatic torus mark for auxiliary assets
  if (fs.existsSync(darkLogo)) {
    const { data, info } = await sharp(darkLogo).raw().toBuffer({ resolveWithObject: true });
    const cx = 583;
    const cy = 356;
    const radius = 172;
    const size = 380;
    const halfSize = size / 2;
    const left = Math.round(cx - halfSize);
    const top = Math.round(cy - halfSize);

    const cropped = Buffer.alloc(size * size * 4);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const srcX = left + x;
        const srcY = top + y;
        const dist = Math.hypot(srcX - cx, srcY - cy);
        const outIdx = (y * size + x) * 4;
        if (dist <= radius && srcX >= 0 && srcX < info.width && srcY >= 0 && srcY < info.height) {
          const inIdx = (srcY * info.width + srcX) * 4;
          let alpha = data[inIdx + 3];
          // Anti-alias edge
          if (dist > radius - 1.5) {
            alpha = Math.round(alpha * (radius - dist) / 1.5);
          }
          cropped[outIdx] = data[inIdx];
          cropped[outIdx + 1] = data[inIdx + 1];
          cropped[outIdx + 2] = data[inIdx + 2];
          cropped[outIdx + 3] = alpha;
        } else {
          cropped[outIdx + 3] = 0;
        }
      }
    }

    const baseImage = sharp(cropped, { raw: { width: size, height: size, channels: 4 } });

    // Save high-res torus mark to assets
    await baseImage
      .clone()
      .resize(96, 96, { kernel: sharp.kernel.lanczos3 })
      .png()
      .toFile(path.join(assetsDir, 'copage-torus-mark.png'));

    if (fs.existsSync(path.join(assetsDir, 'copage-torus-mark.png'))) {
      fs.copyFileSync(
        path.join(assetsDir, 'copage-torus-mark.png'),
        path.join(srcAssetsDir, 'copage-torus-mark.png')
      );
    }
  }

  console.log('✓ All Copage logos, mini favicons, and icons synchronized.');
}

if (process.argv[1] && process.argv[1].includes('generate-icons.mjs')) {
  generateIcons().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
