/**
 * 压缩 MCZC 资源至微信主包 4MB 以内
 * 用法: node scripts/compress-assets.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);

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

const AUDIOS = [
  'audio/bgm_menu.wav',
  'audio/bgm_warm.wav',
  'audio/bgm_cool.wav',
];

async function compressImage(rel) {
  const src = path.join(root, rel);
  if (!fs.existsSync(src)) return null;
  const outRel = rel.replace(/\.png$/i, '.jpg');
  const out = path.join(root, outRel);
  const meta = await sharp(src).metadata();
  const maxW = 1280;
  let pipeline = sharp(src);
  if (meta.width > maxW) pipeline = pipeline.resize({ width: maxW, withoutEnlargement: true });
  await pipeline.jpeg({ quality: 78, mozjpeg: true }).toFile(out);
  const kb = (fs.statSync(out).size / 1024).toFixed(1);
  console.log(`  ${rel} -> ${outRel} (${kb} KB)`);
  return outRel;
}

function compressAudio(rel) {
  return new Promise((resolve, reject) => {
    const src = path.join(root, rel);
    const outRel = rel.replace(/\.wav$/i, '.mp3');
    const out = path.join(root, outRel);
    ffmpeg(src)
      .audioBitrate('96k')
      .audioChannels(1)
      .audioFrequency(22050)
      .on('end', () => {
        const kb = (fs.statSync(out).size / 1024).toFixed(1);
        console.log(`  ${rel} -> ${outRel} (${kb} KB)`);
        resolve(outRel);
      })
      .on('error', reject)
      .save(out);
  });
}

async function main() {
  console.log('压缩图片…');
  const imageMap = {};
  for (const rel of IMAGES) {
    imageMap[rel] = await compressImage(rel);
  }

  console.log('压缩 BGM…');
  const audioMap = {};
  for (const rel of AUDIOS) {
    audioMap[rel] = await compressAudio(rel);
  }

  const mapPath = path.join(root, 'scripts', 'asset-map.json');
  fs.writeFileSync(mapPath, JSON.stringify({ images: imageMap, audio: audioMap }, null, 2));
  console.log('完成，映射已写入 scripts/asset-map.json');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
