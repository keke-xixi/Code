function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function mix(a, b, t) {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

function rgbStr(c, a = 1) {
  return a < 1 ? `rgba(${c.r},${c.g},${c.b},${a})` : `rgb(${c.r},${c.g},${c.b})`;
}

/** 被挡水果：轻量绘制，后期关卡大幅减负 */
export function drawFruitLite(ctx, tile) {
  const isBomb = tile.kind === 'bomb';
  const r = tile.size * 0.44;
  const lift = tile.layer * 0.55;

  ctx.save();
  ctx.translate(tile.x, tile.y - lift);
  ctx.rotate(tile.rot || 0);
  ctx.scale(0.88, 0.88);
  ctx.globalAlpha = 0.5;

  ctx.fillStyle = isBomb ? '#546E7A' : (tile.color || '#EF5350');
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = `${Math.floor(tile.size * (isBomb ? 0.88 : 0.98))}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.fillText(tile.emoji, 0, 0);
  ctx.restore();
}

export function drawFruit3D(ctx, tile, exposed, frame = 0) {
  const isBomb = tile.kind === 'bomb';
  const baseColor = isBomb ? '#455A64' : (tile.color || '#EF5350');
  const rgb = hexToRgb(baseColor);
  const light = mix(rgb, { r: 255, g: 255, b: 255 }, 0.62);
  const mid = mix(rgb, { r: 255, g: 255, b: 255 }, 0.12);
  const dark = mix(rgb, { r: 0, g: 0, b: 0 }, 0.42);
  const deep = mix(rgb, { r: 0, g: 0, b: 0 }, 0.55);

  const pulse = exposed ? 1 + Math.sin(frame * 0.08 + tile.uid * 0.7) * 0.015 : 1;
  const r = tile.size * 0.46 * pulse;
  const lift = tile.layer * 0.55 + (exposed ? Math.sin(frame * 0.06 + tile.uid) * 0.35 : 0);
  const scale = exposed ? 1 : 0.88;
  const alpha = exposed ? 1 : 0.48;
  const rot = tile.rot || 0;

  ctx.save();
  ctx.translate(tile.x, tile.y - lift);
  ctx.rotate(rot);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;

  ctx.fillStyle = 'rgba(30,18,12,0.2)';
  ctx.beginPath();
  ctx.ellipse(2, r * 0.58 + 2, r * 0.88, r * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  if (isBomb) {
    const bombG = ctx.createRadialGradient(-r * 0.28, -r * 0.32, r * 0.04, r * 0.05, r * 0.08, r);
    bombG.addColorStop(0, '#90A4AE');
    bombG.addColorStop(0.45, '#546E7A');
    bombG.addColorStop(1, '#263238');
    ctx.fillStyle = bombG;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#37474F';
    ctx.lineWidth = 2;
    ctx.stroke();
    const fuseSwing = Math.sin(frame * 0.12 + tile.uid) * 0.18;
    ctx.strokeStyle = '#8D6E63';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.72);
    ctx.quadraticCurveTo(r * 0.18, -r * (0.95 + fuseSwing), r * 0.32, -r * 1.08);
    ctx.stroke();
    ctx.fillStyle = '#FF7043';
    ctx.beginPath();
    ctx.arc(r * 0.32, -r * 1.08, 2.5 + Math.sin(frame * 0.2) * 1, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const sphere = ctx.createRadialGradient(-r * 0.38, -r * 0.42, r * 0.04, r * 0.08, r * 0.12, r * 1.02);
    sphere.addColorStop(0, rgbStr(light));
    sphere.addColorStop(0.35, rgbStr(mid));
    sphere.addColorStop(0.72, rgbStr(rgb));
    sphere.addColorStop(1, rgbStr(deep));
    ctx.fillStyle = sphere;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = rgbStr(dark, 0.35);
    ctx.beginPath();
    ctx.ellipse(0, r * 0.42, r * 0.72, r * 0.28, 0, 0, Math.PI);
    ctx.fill();

    const gloss = ctx.createRadialGradient(-r * 0.32, -r * 0.38, 0, -r * 0.28, -r * 0.32, r * 0.55);
    gloss.addColorStop(0, 'rgba(255,255,255,0.85)');
    gloss.addColorStop(0.35, 'rgba(255,255,255,0.25)');
    gloss.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gloss;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.28, -r * 0.34, r * 0.22, r * 0.13, -0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = rgbStr(dark, 0.25);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, r - 0.6, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (exposed && !isBomb) {
    ctx.strokeStyle = `rgba(255,255,255,${0.22 + Math.sin(frame * 0.1 + tile.uid) * 0.06})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, r + 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  const fontSize = Math.floor(tile.size * (isBomb ? 0.92 : 1.08));
  ctx.font = `${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = exposed ? 3 : 1;
  ctx.shadowOffsetY = 1;
  ctx.fillText(tile.emoji, 0, -r * 0.02);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.restore();
}
