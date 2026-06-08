/** 在右图绘制差异覆盖层 */
export function drawDifference(ctx, diff, px, py, pw, ph) {
  const x = px + diff.x * pw;
  const y = py + diff.y * ph;
  const w = (diff.w || 0.08) * pw;
  const h = (diff.h || 0.08) * ph;

  ctx.save();
  if (diff.kind === 'patch') {
    ctx.fillStyle = diff.color;
    ctx.beginPath();
    ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (diff.kind === 'tint') {
    ctx.fillStyle = diff.color;
    roundRect(ctx, x - w / 2, y - h / 2, w, h, 6);
    ctx.fill();
  } else if (diff.kind === 'icon') {
    ctx.font = `${diff.size || 22}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 4;
    ctx.fillText(diff.emoji, x, y);
  }
  ctx.restore();
}

export function drawFoundMark(ctx, x, y, r, frame) {
  const pulse = 1 + Math.sin(frame * 0.15) * 0.08;
  ctx.save();
  ctx.strokeStyle = '#69F0AE';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#69F0AE';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(x, y, r * pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(105,240,174,0.25)';
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${Math.floor(r * 1.2)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✓', x, y);
  ctx.restore();
}

export function drawWrongMark(ctx, x, y, frame, alpha) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = '#FF5252';
  ctx.lineWidth = 3;
  ctx.beginPath();
  const s = 14 + frame * 0.5;
  ctx.moveTo(x - s, y - s);
  ctx.lineTo(x + s, y + s);
  ctx.moveTo(x + s, y - s);
  ctx.lineTo(x - s, y + s);
  ctx.stroke();
  ctx.restore();
}

export function drawHintRing(ctx, x, y, r, frame) {
  const pulse = 1 + Math.sin(frame * 0.1) * 0.06;
  ctx.save();
  ctx.strokeStyle = '#FFD54F';
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.arc(x, y, r * 1.8 * pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, rad) {
  const r = Math.min(rad, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
