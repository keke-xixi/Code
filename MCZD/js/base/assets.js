const cache = {};

export function loadImage(src) {
  if (cache[src]) return cache[src];
  const img = wx.createImage();
  img._loaded = false;
  img.onload = () => { img._loaded = true; };
  img.onerror = () => { img._loaded = false; };
  img.src = src;
  cache[src] = img;
  return img;
}

export function drawImage(ctx, src, x, y, w, h) {
  const img = loadImage(src);
  if (img._loaded) {
    ctx.drawImage(img, x, y, w, h);
    return true;
  }
  return false;
}

/** 选关按钮 — 无底色，仅「挑战」文字 + 细线强调 */
export function drawStartBtn(ctx, x, y, w, h, frame = 0, enabled = true) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const bob = enabled ? Math.sin(frame * 0.06) * 1.2 : 0;
  const nudge = enabled ? Math.sin(frame * 0.11) * 2.5 : 0;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (!enabled) {
    ctx.font = '16px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('未解锁', cx, cy);
    ctx.restore();
    return;
  }

  const label = '挑战';
  ctx.font = 'bold 30px sans-serif';
  const tw = ctx.measureText(label).width;
  const tx = cx - nudge * 0.3;

  ctx.fillStyle = '#FFF8E1';
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  ctx.fillText(label, tx, cy + bob);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  const ax = tx + tw / 2 + 12 + nudge;
  const aw = 8;
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(ax, cy + bob - aw);
  ctx.lineTo(ax + aw, cy + bob);
  ctx.lineTo(ax, cy + bob + aw);
  ctx.stroke();

  const lineW = tw + 40;
  const lineY = cy + bob + 22;
  const lg = ctx.createLinearGradient(cx - lineW / 2, 0, cx + lineW / 2, 0);
  lg.addColorStop(0, 'rgba(255,213,79,0)');
  lg.addColorStop(0.15, 'rgba(255,213,79,0.9)');
  lg.addColorStop(0.85, 'rgba(255,213,79,0.9)');
  lg.addColorStop(1, 'rgba(255,213,79,0)');
  ctx.strokeStyle = lg;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - lineW / 2, lineY);
  ctx.lineTo(cx + lineW / 2, lineY);
  ctx.stroke();

  ctx.restore();
}

export function drawStartBtnFallback(ctx, x, y, w) {
  drawStartBtn(ctx, x, y, w, 48);
}
