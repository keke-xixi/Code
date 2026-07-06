/**
 * 压缩 MCZC 图片为 JPG（主包 4MB 限制）
 * 用法: node scripts/compress-images.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const IMAGES = [
  'images/menu_bg.png',
  'images/scene_cafe.png',
  'images/scene_camp.png',
  'images/scene_alley.png',
  'images/scene_beach.png',
  'images/scene_sakura.png',
  'images/scene_snow.png',
  'images/scene_garden.png',
];

async function compressImage(rel) {
  const src = path.join(root, rel);
  const outRel = rel.replace(/\.png$/i, '.jpg');
  const out = path.join(root, outRel);
  const meta = await sharp(src).metadata();
  const maxW = 960;
  let pipeline = sharp(src);
  if (meta.width > maxW) pipeline = pipeline.resize({ width: maxW, withoutEnlargement: true });
  await pipeline.jpeg({ quality: 72, mozjpeg: true }).toFile(out);
  const kb = (fs.statSync(out).size / 1024).toFixed(1);
  console.log(`${rel} -> ${outRel}  ${kb} KB`);
  return outRel;
}

async function main() {
  for (const rel of IMAGES) await compressImage(rel);
  let total = 0;
  fs.readdirSync(path.join(root, 'images')).filter((f) => f.endsWith('.jpg')).forEach((f) => {
    total += fs.statSync(path.join(root, 'images', f)).size;
  });
  console.log(`JPG total: ${(total / 1024).toFixed(1)} KB`);
}

main().catch((e) => { console.error(e); process.exit(1); });
