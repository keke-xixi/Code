/**
 * 估算上传主包体积（排除 packOptions.ignore）
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const IGNORE = [
  /^node_modules/,
  /^scripts/,
  /^assets/,
  /\.png$/i,
  /audio\/bgm_(menu|warm|cool)\.wav$/,
  /^README\.md$/,
  /^package(-lock)?\.json$/,
];

function shouldIgnore(rel) {
  return IGNORE.some((re) => re.test(rel.replace(/\\/g, '/')));
}

function walk(dir, base = '') {
  let total = 0;
  const files = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = base ? `${base}/${name}` : name;
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      if (shouldIgnore(rel + '/')) continue;
      const sub = walk(full, rel);
      total += sub.total;
      files.push(...sub.files);
    } else if (!shouldIgnore(rel)) {
      total += st.size;
      files.push({ rel, size: st.size });
    }
  }
  return { total, files };
}

const { total, files } = walk(root);
files.sort((a, b) => b.size - a.size);
console.log(`估算主包: ${(total / 1024).toFixed(1)} KB (${(total / 1024 / 1024).toFixed(2)} MB)\n`);
console.log('Top 15:');
for (const f of files.slice(0, 15)) {
  console.log(`  ${(f.size / 1024).toFixed(1).padStart(8)} KB  ${f.rel}`);
}
