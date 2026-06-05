export function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function radiusFromPower(power, cfg) {
  const logP = Math.log10(Math.max(1, power));
  return cfg.minRadius + logP * cfg.radiusScale;
}

export function formatTime(frames) {
  const sec = Math.floor(frames / 60);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function formatPower(n) {
  const v = Math.floor(n);
  if (v >= 1e8) {
    const yi = v / 1e8;
    return yi >= 10 ? `${Math.floor(yi)}亿` : `${yi.toFixed(1).replace(/\.0$/, '')}亿`;
  }
  if (v >= 1e4) {
    const wan = v / 1e4;
    return wan >= 100 ? `${Math.floor(wan)}万` : `${wan.toFixed(1).replace(/\.0$/, '')}万`;
  }
  return String(v);
}

export function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
