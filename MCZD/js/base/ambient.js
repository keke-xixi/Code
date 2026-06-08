import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';

const BOKEH = [
  { x: 0.1, y: 0.2, r: 0.11, c: '#FFD54F', sp: 0.011 },
  { x: 0.85, y: 0.16, r: 0.09, c: '#FFAB91', sp: 0.014 },
  { x: 0.72, y: 0.32, r: 0.07, c: '#CE93D8', sp: 0.018 },
  { x: 0.22, y: 0.38, r: 0.08, c: '#81D4FA', sp: 0.013 },
  { x: 0.5, y: 0.12, r: 0.06, c: '#A5D6A7', sp: 0.016 },
];

function drawWallpaper(ctx, h) {
  ctx.save();
  ctx.globalAlpha = 0.055;
  ctx.fillStyle = '#8D6E63';
  const step = 22;
  for (let y = 0; y < h; y += step) {
    for (let x = ((y / step) % 2) * (step / 2); x < SCREEN_WIDTH; x += step) {
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 0.04;
  ctx.strokeStyle = '#BCAAA4';
  ctx.lineWidth = 1;
  for (let y = 0; y < h; y += 36) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(SCREEN_WIDTH, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawWindow(ctx, frame, tableLine) {
  const ww = SCREEN_WIDTH * 0.52;
  const wh = tableLine * 0.42;
  const wx = (SCREEN_WIDTH - ww) / 2;
  const wy = tableLine * 0.06;
  const frameW = 7;

  ctx.save();

  const sky = ctx.createLinearGradient(wx, wy, wx, wy + wh);
  sky.addColorStop(0, '#87CEEB');
  sky.addColorStop(0.55, '#B3E5FC');
  sky.addColorStop(1, '#E1F5FE');
  ctx.fillStyle = sky;
  ctx.fillRect(wx + frameW, wy + frameW, ww - frameW * 2, wh - frameW * 2);

  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  const cloudX = wx + ww * 0.3 + Math.sin(frame * 0.012) * 8;
  ctx.beginPath();
  ctx.arc(cloudX, wy + wh * 0.35, 14, 0, Math.PI * 2);
  ctx.arc(cloudX + 16, wy + wh * 0.32, 18, 0, Math.PI * 2);
  ctx.arc(cloudX + 32, wy + wh * 0.36, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#5D4037';
  ctx.fillRect(wx, wy, ww, frameW);
  ctx.fillRect(wx, wy + wh - frameW, ww, frameW);
  ctx.fillRect(wx, wy, frameW, wh);
  ctx.fillRect(wx + ww - frameW, wy, frameW, wh);
  ctx.fillRect(wx + ww / 2 - 3, wy + frameW, 6, wh - frameW * 2);
  ctx.fillRect(wx + frameW, wy + wh / 2 - 3, ww - frameW * 2, 6);

  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(wx + frameW + 4, wy + frameW + 4, (ww - frameW * 2) * 0.35, wh - frameW * 2);

  const light = ctx.createRadialGradient(
    SCREEN_WIDTH / 2,
    wy + wh,
    10,
    SCREEN_WIDTH / 2,
    tableLine,
    SCREEN_WIDTH * 0.7,
  );
  light.addColorStop(0, 'rgba(255,252,230,0.45)');
  light.addColorStop(0.5, 'rgba(255,240,210,0.18)');
  light.addColorStop(1, 'rgba(255,240,210,0)');
  ctx.fillStyle = light;
  ctx.fillRect(0, wy + wh, SCREEN_WIDTH, tableLine - wy - wh);

  ctx.restore();
}

function drawCurtains(ctx, frame, tableLine) {
  const sway = (i) => Math.sin(frame * 0.018 + i * 1.4) * 6;

  const drawCurtain = (side) => {
    const w = SCREEN_WIDTH * 0.22;
    const x = side === 'left' ? 0 : SCREEN_WIDTH - w;
    const g = ctx.createLinearGradient(x, 0, side === 'left' ? x + w : x, 0);
    if (side === 'left') {
      g.addColorStop(0, '#FFCCBC');
      g.addColorStop(0.6, '#FFAB91');
      g.addColorStop(1, 'rgba(255,171,145,0.15)');
    } else {
      g.addColorStop(0, 'rgba(255,171,145,0.15)');
      g.addColorStop(0.4, '#FFAB91');
      g.addColorStop(1, '#FFCCBC');
    }
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    for (let y = 0; y <= tableLine; y += 8) {
      const dx = side === 'left'
        ? w + Math.sin(y * 0.025 + frame * 0.02) * 5 + sway(0)
        : Math.sin(y * 0.025 + frame * 0.02 + 1) * 5 + sway(1);
      ctx.lineTo(side === 'left' ? x + dx : x + w - dx, y);
    }
    ctx.lineTo(side === 'left' ? x : x + w, tableLine);
    ctx.lineTo(side === 'left' ? x : x + w, 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(191,54,12,0.12)';
    ctx.lineWidth = 1;
    for (let s = 0; s < 5; s += 1) {
      ctx.beginPath();
      const sy = tableLine * 0.08 + s * (tableLine * 0.16);
      ctx.moveTo(side === 'left' ? x + 4 : x + w - 4, sy);
      ctx.lineTo(side === 'left' ? x + w - 8 : x + 8, sy + 6);
      ctx.stroke();
    }
  };

  ctx.save();
  drawCurtain('left');
  drawCurtain('right');
  ctx.restore();
}

function drawSideDecor(ctx, tableLine) {
  ctx.save();
  ctx.globalAlpha = 0.85;

  const shelfY = tableLine * 0.58;
  ctx.fillStyle = '#8D6E63';
  ctx.fillRect(10, shelfY, SCREEN_WIDTH * 0.16, 6);
  ctx.fillRect(SCREEN_WIDTH - SCREEN_WIDTH * 0.16 - 10, shelfY, SCREEN_WIDTH * 0.16, 6);

  ctx.font = '22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🫙', SCREEN_WIDTH * 0.1, shelfY - 8);
  ctx.fillText('🪴', SCREEN_WIDTH * 0.9, shelfY - 10);

  ctx.font = '18px sans-serif';
  ctx.globalAlpha = 0.5;
  ctx.fillText('🍊', 28, tableLine * 0.78);
  ctx.fillText('🍋', SCREEN_WIDTH - 28, tableLine * 0.82);
  ctx.restore();
}

function drawTableSurface(ctx, tableLine, playBottom, frame) {
  const blendH = (playBottom - tableLine) * 0.35;
  const mid = tableLine + blendH;

  const blend = ctx.createLinearGradient(0, tableLine - 20, 0, mid);
  blend.addColorStop(0, 'rgba(196,154,108,0)');
  blend.addColorStop(0.35, 'rgba(196,154,108,0.55)');
  blend.addColorStop(1, '#A67C52');
  ctx.fillStyle = blend;
  ctx.fillRect(0, tableLine - 20, SCREEN_WIDTH, mid - tableLine + 20);

  const wood = ctx.createLinearGradient(0, mid, 0, playBottom);
  wood.addColorStop(0, '#A67C52');
  wood.addColorStop(0.25, '#8D6E63');
  wood.addColorStop(0.65, '#6D4C41');
  wood.addColorStop(1, '#5D4037');
  ctx.fillStyle = wood;
  ctx.fillRect(0, mid, SCREEN_WIDTH, playBottom - mid);

  ctx.save();
  ctx.globalAlpha = 0.11;
  ctx.strokeStyle = '#3E2723';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 22; i += 1) {
    const ly = mid + ((playBottom - mid) * i) / 22;
    ctx.beginPath();
    for (let x = 0; x <= SCREEN_WIDTH; x += 5) {
      const w = Math.sin(x * 0.015 + i * 0.85 + frame * 0.003) * 3;
      if (x === 0) ctx.moveTo(x, ly + w);
      else ctx.lineTo(x, ly + w);
    }
    ctx.stroke();
  }

  ctx.globalAlpha = 0.08;
  ctx.fillStyle = '#4E342E';
  ctx.beginPath();
  ctx.ellipse(SCREEN_WIDTH * 0.25, mid + 40, 28, 12, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(SCREEN_WIDTH * 0.78, mid + 90, 22, 10, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, tableLine);
  ctx.bezierCurveTo(SCREEN_WIDTH * 0.3, tableLine + 8, SCREEN_WIDTH * 0.7, tableLine - 4, SCREEN_WIDTH, tableLine + 6);
  ctx.stroke();
  ctx.restore();
}

function drawTablecloth(ctx, playBottom, frame) {
  const cx = SCREEN_WIDTH * 0.5;
  const cy = playBottom * 0.5;
  const rx = SCREEN_WIDTH * 0.48;
  const ry = playBottom * 0.28;

  ctx.save();
  const cloth = ctx.createRadialGradient(cx, cy - 10, rx * 0.1, cx, cy, rx * 1.05);
  cloth.addColorStop(0, 'rgba(255,255,255,0.72)');
  cloth.addColorStop(0.55, 'rgba(255,250,245,0.38)');
  cloth.addColorStop(0.85, 'rgba(255,248,240,0.12)');
  cloth.addColorStop(1, 'rgba(255,248,240,0)');
  ctx.fillStyle = cloth;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx * 0.92, ry * 0.88, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.globalAlpha = 0.2 + Math.sin(frame * 0.03) * 0.05;
  ctx.strokeStyle = '#FFCCBC';
  ctx.lineWidth = 1;
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
    const ox = cx + Math.cos(a) * rx * 0.88;
    const oy = cy + Math.sin(a) * ry * 0.84;
    ctx.beginPath();
    ctx.arc(ox, oy, 3, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBokeh(ctx, playBottom, frame) {
  BOKEH.forEach((b, i) => {
    const bx = b.x * SCREEN_WIDTH + Math.sin(frame * b.sp + i * 2) * 14;
    const by = b.y * playBottom + Math.cos(frame * b.sp * 1.1 + i) * 10;
    const br = b.r * SCREEN_WIDTH;
    const g = ctx.createRadialGradient(bx, by, 0, bx, by, br);
    g.addColorStop(0, `${b.c}66`);
    g.addColorStop(0.45, `${b.c}28`);
    g.addColorStop(1, `${b.c}00`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawFooterWood(ctx, footerY, footerH) {
  const g = ctx.createLinearGradient(0, footerY, 0, footerY + footerH);
  g.addColorStop(0, '#6D4C41');
  g.addColorStop(1, '#4E342E');
  ctx.fillStyle = g;
  ctx.fillRect(0, footerY, SCREEN_WIDTH, footerH);
}

/** 全屏对局背景 */
export function drawPlayScene(ctx, frame = 0, accent = '#FFB74D', footerH = 0) {
  const playBottom = SCREEN_HEIGHT - footerH;
  const tableLine = playBottom * 0.5;

  const wall = ctx.createLinearGradient(0, 0, 0, tableLine);
  wall.addColorStop(0, '#FFF8F0');
  wall.addColorStop(0.4, '#FFECDC');
  wall.addColorStop(0.75, '#FFE0C8');
  wall.addColorStop(1, '#FFD4B0');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, SCREEN_WIDTH, playBottom);

  drawWallpaper(ctx, tableLine);
  drawCurtains(ctx, frame, tableLine);
  drawWindow(ctx, frame, tableLine);
  drawSideDecor(ctx, tableLine);
  drawTableSurface(ctx, tableLine, playBottom, frame);
  drawTablecloth(ctx, playBottom, frame);
  drawBokeh(ctx, playBottom, frame);

  const accentGlow = ctx.createRadialGradient(
    SCREEN_WIDTH * 0.5,
    playBottom * 0.42,
    20,
    SCREEN_WIDTH * 0.5,
    playBottom * 0.45,
    SCREEN_WIDTH * 0.65,
  );
  accentGlow.addColorStop(0, `${accent}22`);
  accentGlow.addColorStop(0.6, `${accent}0A`);
  accentGlow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = accentGlow;
  ctx.fillRect(0, 0, SCREEN_WIDTH, playBottom);

  const vig = ctx.createRadialGradient(
    SCREEN_WIDTH / 2,
    playBottom * 0.46,
    playBottom * 0.15,
    SCREEN_WIDTH / 2,
    playBottom * 0.46,
    SCREEN_WIDTH * 0.92,
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(46,32,24,0.2)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, SCREEN_WIDTH, playBottom);

  if (footerH > 0) {
    drawFooterWood(ctx, playBottom, footerH);
  }
}

export function drawPlayBackground(ctx, area, frame = 0, accent = '#FFB74D') {
  drawPlayScene(ctx, frame, accent, SCREEN_HEIGHT - area.y - area.h);
}
