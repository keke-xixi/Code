import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';

const FLOAT_FRUITS = ['🍎', '🍊', '🍇', '🍓', '🍑', '🍋'];

function drawWallDots(ctx, h) {
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#6D4C41';
  for (let y = 18; y < h; y += 24) {
    for (let x = (y % 48) / 2; x < SCREEN_WIDTH; x += 24) {
      ctx.beginPath();
      ctx.arc(x, y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawMenuWindow(ctx, frame) {
  const ww = SCREEN_WIDTH * 0.58;
  const wh = SCREEN_HEIGHT * 0.2;
  const wx = (SCREEN_WIDTH - ww) / 2;
  const wy = SCREEN_HEIGHT * 0.06;
  const fw = 6;

  const sky = ctx.createLinearGradient(wx, wy, wx, wy + wh);
  sky.addColorStop(0, '#81D4FA');
  sky.addColorStop(1, '#E1F5FE');
  ctx.fillStyle = sky;
  ctx.fillRect(wx + fw, wy + fw, ww - fw * 2, wh - fw * 2);

  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  const cx = wx + ww * 0.35 + Math.sin(frame * 0.01) * 6;
  ctx.beginPath();
  ctx.arc(cx, wy + wh * 0.45, 10, 0, Math.PI * 2);
  ctx.arc(cx + 14, wy + wh * 0.42, 13, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#5D4037';
  ctx.fillRect(wx, wy, ww, fw);
  ctx.fillRect(wx, wy + wh - fw, ww, fw);
  ctx.fillRect(wx, wy, fw, wh);
  ctx.fillRect(wx + ww - fw, wy, fw, wh);
  ctx.fillRect(wx + ww / 2 - 2, wy + fw, 4, wh - fw * 2);
}

function drawCounter(ctx) {
  const y = SCREEN_HEIGHT * 0.78;
  const g = ctx.createLinearGradient(0, y, 0, SCREEN_HEIGHT);
  g.addColorStop(0, '#A1887F');
  g.addColorStop(0.15, '#8D6E63');
  g.addColorStop(1, '#5D4037');
  ctx.fillStyle = g;
  ctx.fillRect(0, y, SCREEN_WIDTH, SCREEN_HEIGHT - y);

  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.strokeStyle = '#3E2723';
  for (let i = 0; i < 8; i += 1) {
    const ly = y + 12 + i * 14;
    ctx.beginPath();
    ctx.moveTo(0, ly);
    ctx.lineTo(SCREEN_WIDTH, ly);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawMenuScene(ctx, frame = 0) {
  const wall = ctx.createLinearGradient(0, 0, 0, SCREEN_HEIGHT * 0.78);
  wall.addColorStop(0, '#FFF5EB');
  wall.addColorStop(0.45, '#FFECDC');
  wall.addColorStop(1, '#FFE0C8');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  drawWallDots(ctx, SCREEN_HEIGHT * 0.78);
  drawMenuWindow(ctx, frame);

  ctx.save();
  ctx.globalAlpha = 0.35;
  FLOAT_FRUITS.forEach((f, i) => {
    const x = (0.12 + (i * 0.14) % 0.76) * SCREEN_WIDTH;
    const y = SCREEN_HEIGHT * (0.14 + (i % 3) * 0.06) + Math.sin(frame * 0.02 + i * 1.3) * 8;
    ctx.font = `${22 + (i % 2) * 4}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(f, x, y);
  });
  ctx.restore();

  drawCounter(ctx);

  const glow = ctx.createRadialGradient(
    SCREEN_WIDTH / 2,
    SCREEN_HEIGHT * 0.42,
    30,
    SCREEN_WIDTH / 2,
    SCREEN_HEIGHT * 0.45,
    SCREEN_WIDTH * 0.8,
  );
  glow.addColorStop(0, 'rgba(255,255,255,0.35)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT * 0.75);
}

export function drawMenuTitle(ctx, title, frame) {
  const y = SCREEN_HEIGHT * 0.265;
  const w = Math.min(220, SCREEN_WIDTH * 0.62);
  const h = 44;
  const x = SCREEN_WIDTH / 2 - w / 2;
  const bob = Math.sin(frame * 0.04) * 2;

  ctx.save();
  ctx.translate(0, bob);
  ctx.shadowColor = 'rgba(93,64,55,0.3)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;

  const wood = ctx.createLinearGradient(x, y, x, y + h);
  wood.addColorStop(0, '#A1887F');
  wood.addColorStop(0.5, '#8D6E63');
  wood.addColorStop(1, '#6D4C41');
  ctx.fillStyle = wood;
  roundRect(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = '#5D4037';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#FFF8E1';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, SCREEN_WIDTH / 2, y + h / 2);

  ctx.font = '20px sans-serif';
  ctx.fillText('🍉', x - 16, y + h / 2);
  ctx.fillText('💣', x + w + 16, y + h / 2);
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

export function drawNavBtn(ctx, x, y, r, dir, enabled) {
  ctx.save();
  ctx.globalAlpha = enabled ? 1 : 0.3;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.shadowColor = 'rgba(62,39,35,0.2)';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(161,136,127,0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.strokeStyle = '#6D4C41';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  const s = r * 0.38;
  if (dir === 'left') {
    ctx.moveTo(x + s * 0.3, y - s);
    ctx.lineTo(x - s * 0.5, y);
    ctx.lineTo(x + s * 0.3, y + s);
  } else {
    ctx.moveTo(x - s * 0.3, y - s);
    ctx.lineTo(x + s * 0.5, y);
    ctx.lineTo(x - s * 0.3, y + s);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawLevelCard(ctx, lv, x, y, w, h, opts = {}) {
  const { active, unlocked, stars, frame, index } = opts;
  const scale = active ? 1 : 0.88;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const cw = w * scale;
  const ch = h * scale;
  const rx = cx - cw / 2;
  const ry = cy - ch / 2;

  ctx.save();
  ctx.globalAlpha = active ? 1 : 0.65;

  if (active) {
    ctx.shadowColor = 'rgba(62,39,35,0.28)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 6;
  }

  ctx.fillStyle = '#FFFBF5';
  roundRect(ctx, rx, ry, cw, ch, 18);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.strokeStyle = active ? lv.accent : 'rgba(188,170,164,0.7)';
  ctx.lineWidth = active ? 3 : 1.5;
  ctx.stroke();

  const ribbonH = 36;
  const rg = ctx.createLinearGradient(rx, ry, rx, ry + ribbonH);
  rg.addColorStop(0, lv.accent);
  rg.addColorStop(1, lv.accentDark);
  ctx.fillStyle = rg;
  ctx.beginPath();
  ctx.moveTo(rx + 18, ry);
  ctx.lineTo(rx + cw - 18, ry);
  ctx.quadraticCurveTo(rx + cw, ry, rx + cw, ry + 18);
  ctx.lineTo(rx + cw, ry + ribbonH);
  ctx.lineTo(rx, ry + ribbonH);
  ctx.lineTo(rx, ry + 18);
  ctx.quadraticCurveTo(rx, ry, rx + 18, ry);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`LEVEL ${lv.id}`, rx + 14, ry + ribbonH / 2);

  ctx.textAlign = 'right';
  ctx.font = '12px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText('💣 ×3', rx + cw - 14, ry + ribbonH / 2);

  const plateR = Math.min(cw, ch) * 0.22;
  const plateY = ry + ch * 0.46;
  ctx.fillStyle = '#F5F5F5';
  ctx.beginPath();
  ctx.ellipse(cx, plateY, plateR * 1.15, plateR * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#CFD8DC';
  ctx.lineWidth = 2;
  ctx.stroke();

  const fruits = ['🍎', '🍊', '🍇'];
  ctx.font = `${Math.floor(plateR * 0.9)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  fruits.forEach((f, i) => {
    const ang = -0.6 + i * 0.6;
    const fx = cx + Math.cos(ang) * plateR * 0.55;
    const fy = plateY + Math.sin(ang) * plateR * 0.35;
    const bounce = active ? Math.sin(frame * 0.08 + i * 2) * 3 : 0;
    ctx.fillText(f, fx, fy + bounce);
  });

  ctx.fillStyle = '#4E342E';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(lv.name, cx, ry + ch - 52);

  ctx.fillStyle = '#8D6E63';
  ctx.font = '13px sans-serif';
  ctx.fillText(lv.desc, cx, ry + ch - 30);

  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#FFB300';
  const starText = stars ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : '— — —';
  ctx.fillText(starText, cx, ry + ch - 12);

  if (!unlocked) {
    ctx.fillStyle = 'rgba(255,251,245,0.82)';
    roundRect(ctx, rx, ry, cw, ch, 18);
    ctx.fill();
    ctx.font = '36px sans-serif';
    ctx.fillText('🔒', cx, cy - 8);
    ctx.fillStyle = '#6D4C41';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('通关上一关解锁', cx, cy + 24);
  }

  ctx.restore();
}

export function drawMenuDots(ctx, count, active, y) {
  const gap = 14;
  const totalW = (count - 1) * gap;
  const sx = SCREEN_WIDTH / 2 - totalW / 2;
  for (let i = 0; i < count; i += 1) {
    const on = i === active;
    ctx.beginPath();
    ctx.arc(sx + i * gap, y, on ? 5 : 3.5, 0, Math.PI * 2);
    ctx.fillStyle = on ? '#FF8F00' : 'rgba(141,110,99,0.35)';
    ctx.fill();
    if (on) {
      ctx.strokeStyle = '#FFE082';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

export function drawMenuStartBtn(ctx, x, y, w, h, enabled, frame) {
  const pulse = enabled ? 1 + Math.sin(frame * 0.06) * 0.02 : 1;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const rw = w * pulse;
  const rh = h * pulse;
  const rx = cx - rw / 2;
  const ry = cy - rh / 2;
  const r = rh / 2;

  ctx.save();
  ctx.globalAlpha = enabled ? 1 : 0.45;
  ctx.shadowColor = 'rgba(230,81,0,0.4)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;

  const g = ctx.createLinearGradient(rx, ry, rx, ry + rh);
  g.addColorStop(0, '#FFD54F');
  g.addColorStop(0.45, '#FFB300');
  g.addColorStop(1, '#FF8F00');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(rx + r, ry);
  ctx.arcTo(rx + rw, ry, rx + rw, ry + rh, r);
  ctx.arcTo(rx + rw, ry + rh, rx, ry + rh, r);
  ctx.arcTo(rx, ry + rh, rx, ry, r);
  ctx.arcTo(rx, ry, rx + rw, ry, r);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = '#E65100';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.floor(rh * 0.42)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('开始挑战', cx, cy);
  ctx.restore();
}
