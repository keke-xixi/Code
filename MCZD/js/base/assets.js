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

export function drawStartBtn(ctx, x, y, w, h) {
  const r = h / 2;
  const cx = x + w / 2;
  const cy = y + h / 2;

  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.moveTo(x + r, y + 4);
  ctx.arcTo(x + w, y + 4, x + w, y + h + 4, r);
  ctx.arcTo(x + w, y + h + 4, x, y + h + 4, r);
  ctx.arcTo(x, y + h + 4, x, y + 4, r);
  ctx.arcTo(x, y + 4, x + w, y + 4, r);
  ctx.closePath();
  ctx.fill();

  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, '#FFD180');
  g.addColorStop(0.35, '#FFB300');
  g.addColorStop(0.7, '#FF8F00');
  g.addColorStop(1, '#E65100');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#BF360C';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  const hg = ctx.createRadialGradient(cx - w * 0.14, cy - h * 0.28, 2, cx, cy, w * 0.55);
  hg.addColorStop(0, 'rgba(255,255,255,0.55)');
  hg.addColorStop(0.45, 'rgba(255,255,255,0.12)');
  hg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.ellipse(cx, cy - h * 0.08, w * 0.46, h * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();

  const iconX = cx - w * 0.14;
  ctx.fillStyle = '#fff';
  ctx.shadowColor = 'rgba(191,54,12,0.45)';
  ctx.shadowBlur = 4;
  const pw = h * 0.28;
  const ph = h * 0.36;
  ctx.beginPath();
  ctx.moveTo(iconX - pw * 0.35, cy - ph / 2);
  ctx.lineTo(iconX + pw * 0.65, cy);
  ctx.lineTo(iconX - pw * 0.35, cy + ph / 2);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#BF360C';
  ctx.font = `bold ${Math.floor(h * 0.4)}px sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('开始', iconX + pw * 0.5, cy);
  ctx.restore();
}

export function drawStartBtnFallback(ctx, x, y, w) {
  drawStartBtn(ctx, x, y, w, w * 0.46);
}
