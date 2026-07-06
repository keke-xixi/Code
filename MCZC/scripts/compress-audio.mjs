/**
 * WAV -> MP3 压缩 BGM
 * 用法: node scripts/compress-audio.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const ffmpeg = ffmpegPath.path;

const FILES = ['audio/bgm_menu.wav', 'audio/bgm_warm.wav', 'audio/bgm_cool.wav'];

for (const rel of FILES) {
  const src = path.join(root, rel);
  const out = src.replace(/\.wav$/i, '.mp3');
  const r = spawnSync(ffmpeg, [
    '-y', '-i', src,
    '-ac', '1', '-ar', '22050', '-b:a', '64k',
    out,
  ], { stdio: 'pipe' });
  if (r.status !== 0) {
    console.error(`fail ${rel}`, r.stderr?.toString());
    process.exit(1);
  }
  console.log(`${rel} -> ${path.basename(out)}  ${(fs.statSync(out).size / 1024).toFixed(1)} KB`);
}
