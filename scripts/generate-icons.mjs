import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));

export async function generateIcons() {
  const darkLogo = path.join(rootDir, 'copage-logo-for-dark-mode.png');
  const whiteLogo = path.join(rootDir, 'copage-logo-for-white-mode.png');
  const assetsDir = path.join(rootDir, 'public/assets');
  const iconsDir = path.join(rootDir, 'public/icons');

  fs.mkdirSync(assetsDir, { recursive: true });
  fs.mkdirSync(iconsDir, { recursive: true });

  // 1. Copy full wordmark logos to public/assets and src/assets
  for (const dir of [assetsDir, path.join(rootDir, 'src/assets')]) {
    fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(darkLogo, path.join(dir, 'copage-logo-dark.png'));
    fs.copyFileSync(whiteLogo, path.join(dir, 'copage-logo-white.png'));
    fs.copyFileSync(darkLogo, path.join(dir, 'copage-logo-for-dark-mode.png'));
    fs.copyFileSync(whiteLogo, path.join(dir, 'copage-logo-for-white-mode.png'));
  }

  // 2. Extract and isolate the iconic chromatic torus mark with clean anti-aliased circular mask
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

  // 3. Generate square extension icons
  for (const s of [16, 32, 48, 128]) {
    await baseImage
      .clone()
      .resize(s, s, { kernel: sharp.kernel.lanczos3 })
      .png()
      .toFile(path.join(iconsDir, `icon-${s}.png`));
    console.log(`✓ Generated icon-${s}.png`);
  }

  // 4. Also save high-res torus mark to assets
  await baseImage
    .clone()
    .resize(96, 96, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toFile(path.join(assetsDir, 'copage-torus-mark.png'));

  console.log('✓ All Copage logos and icons synchronized.');
}

if (process.argv[1] && process.argv[1].includes('generate-icons.mjs')) {
  generateIcons().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
