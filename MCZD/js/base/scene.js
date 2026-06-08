import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';

const MENU_SPARKS = [
  { x: 0.15, y: 0.22, sp: 0.014, s: 2.2 },
  { x: 0.78, y: 0.18, sp: 0.011, s: 1.8 },
  { x: 0.42, y: 0.72, sp: 0.016, s: 2.0 },
  { x: 0.88, y: 0.65, sp: 0.012, s: 1.6 },
];

const FAIRY = [
  { x: 0.2, y: 0.35, sp: 0.009 },
  { x: 0.7, y: 0.42, sp: 0.011 },
  { x: 0.45, y: 0.58, sp: 0.008 },
  { x: 0.85, y: 0.28, sp: 0.01 },
];

function drawShopWallpaper(ctx, h, frame) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#FFF8E7');
  g.addColorStop(0.55, '#FFECB3');
  g.addColorStop(1, '#FFE0B2');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SCREEN_WIDTH, h);

  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = '#FF8A65';
  for (let y = 12; y < h; y += 28) {
    for (let x = (y % 56) / 2; x < SCREEN_WIDTH; x += 28) {
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.strokeStyle = '#FFAB91';
  ctx.lineWidth = 1;
  for (let x = 0; x < SCREEN_WIDTH; x += 18) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  ctx.restore();
}

function drawShopWindow(ctx, frame, wallH) {
  const ww = SCREEN_WIDTH * 0.46;
  const wh = wallH * 0.38;
  const wx = (SCREEN_WIDTH - ww) / 2;
  const wy = wallH * 0.08;
  const fw = 5;

  ctx.save();
  const sky = ctx.createLinearGradient(wx, wy, wx, wy + wh);
  sky.addColorStop(0, '#81D4FA');
  sky.addColorStop(1, '#E1F5FE');
  ctx.fillStyle = sky;
  ctx.fillRect(wx + fw, wy + fw, ww - fw * 2, wh - fw * 2);

  const sunX = wx + ww * 0.72 + Math.sin(frame * 0.008) * 3;
  const sunG = ctx.createRadialGradient(sunX, wy + wh * 0.35, 2, sunX, wy + wh * 0.35, 22);
  sunG.addColorStop(0, 'rgba(255,253,224,0.95)');
  sunG.addColorStop(0.5, 'rgba(255,213,79,0.45)');
  sunG.addColorStop(1, 'rgba(255,213,79,0)');
  ctx.fillStyle = sunG;
  ctx.beginPath();
  ctx.arc(sunX, wy + wh * 0.35, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  const cx = wx + ww * 0.28 + Math.sin(frame * 0.01) * 5;
  ctx.beginPath();
  ctx.arc(cx, wy + wh * 0.55, 8, 0, Math.PI * 2);
  ctx.arc(cx + 12, wy + wh * 0.52, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#6D4C41';
  ctx.fillRect(wx, wy, ww, fw);
  ctx.fillRect(wx, wy + wh - fw, ww, fw);
  ctx.fillRect(wx, wy, fw, wh);
  ctx.fillRect(wx + ww - fw, wy, fw, wh);
  ctx.fillRect(wx + ww / 2 - 2, wy + fw, 4, wh - fw * 2);

  const light = ctx.createRadialGradient(
    SCREEN_WIDTH / 2,
    wy + wh,
    8,
    SCREEN_WIDTH / 2,
    wallH * 0.72,
    SCREEN_WIDTH * 0.65,
  );
  light.addColorStop(0, 'rgba(255,252,240,0.5)');
  light.addColorStop(0.55, 'rgba(255,236,200,0.15)');
  light.addColorStop(1, 'rgba(255,236,200,0)');
  ctx.fillStyle = light;
  ctx.fillRect(0, wy + wh, SCREEN_WIDTH, wallH - wy - wh);
  ctx.restore();
}

function drawStringLights(ctx, frame, y) {
  ctx.save();
  ctx.strokeStyle = 'rgba(93,64,55,0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, y);
  for (let x = 0; x <= SCREEN_WIDTH; x += 24) {
    ctx.lineTo(x, y + Math.sin(x * 0.04 + frame * 0.02) * 4);
  }
  ctx.stroke();

  for (let x = 20; x < SCREEN_WIDTH; x += 36) {
    const ly = y + Math.sin(x * 0.04 + frame * 0.02) * 4 + 6;
    const tw = 0.55 + Math.sin(frame * 0.06 + x * 0.1) * 0.25;
    ctx.fillStyle = `rgba(255,213,79,${tw})`;
    ctx.beginPath();
    ctx.arc(x, ly, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSideCrates(ctx, counterTop, frame) {
  const drawCrate = (side) => {
    const x = side === 'left' ? 8 : SCREEN_WIDTH - 68;
    ctx.fillStyle = '#8D6E63';
    ctx.fillRect(x, counterTop - 28, 56, 32);
    ctx.fillStyle = '#6D4C41';
    ctx.fillRect(x, counterTop - 28, 56, 4);
    ctx.globalAlpha = 0.35 + Math.sin(frame * 0.04 + (side === 'left' ? 0 : 2)) * 0.08;
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(side === 'left' ? '🍊🍋' : '🍇🍒', x + 28, counterTop - 10);
    ctx.globalAlpha = 1;
  };
  ctx.save();
  drawCrate('left');
  drawCrate('right');
  ctx.restore();
}

function drawCounter(ctx, topY, bottomY, frame) {
  const wood = ctx.createLinearGradient(0, topY, 0, bottomY);
  wood.addColorStop(0, '#D7A86E');
  wood.addColorStop(0.2, '#C4956A');
  wood.addColorStop(0.55, '#A67C52');
  wood.addColorStop(1, '#8D6E63');
  ctx.fillStyle = wood;
  ctx.fillRect(0, topY, SCREEN_WIDTH, bottomY - topY);

  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = '#5D4037';
  for (let i = 0; i < 14; i += 1) {
    const ly = topY + 8 + i * ((bottomY - topY) / 14);
    ctx.beginPath();
    for (let x = 0; x <= SCREEN_WIDTH; x += 8) {
      const w = Math.sin(x * 0.012 + i * 0.7 + frame * 0.002) * 2;
      if (x === 0) ctx.moveTo(x, ly + w);
      else ctx.lineTo(x, ly + w);
    }
    ctx.stroke();
  }
  ctx.restore();

  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, topY + 2);
  ctx.lineTo(SCREEN_WIDTH, topY + 2);
  ctx.stroke();
}

/** 选关：暖色水果铺招牌感 */
export function drawMenuScene(ctx, frame = 0) {
  const g = ctx.createLinearGradient(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  g.addColorStop(0, '#6D4C41');
  g.addColorStop(0.4, '#8D6E63');
  g.addColorStop(1, '#E65100');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  drawStringLights(ctx, frame, SCREEN_HEIGHT * 0.12);

  const glow = ctx.createRadialGradient(
    SCREEN_WIDTH * 0.5,
    SCREEN_HEIGHT * 0.4,
    20,
    SCREEN_WIDTH * 0.5,
    SCREEN_HEIGHT * 0.45,
    SCREEN_WIDTH * 0.6,
  );
  glow.addColorStop(0, 'rgba(255,224,178,0.22)');
  glow.addColorStop(1, 'rgba(255,224,178,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  MENU_SPARKS.forEach((p, i) => {
    const x = p.x * SCREEN_WIDTH + Math.sin(frame * p.sp + i) * 3;
    const y = p.y * SCREEN_HEIGHT + Math.cos(frame * p.sp + i) * 2;
    ctx.fillStyle = `rgba(255,236,200,${0.2 + Math.sin(frame * 0.04 + i) * 0.06})`;
    ctx.beginPath();
    ctx.arc(x, y, p.s, 0, Math.PI * 2);
    ctx.fill();
  });
}

/**
 * 对局：全屏「鲜果小铺」— 墙纸 + 橱窗 + 木质柜台 + 餐垫聚光
 */
export function drawPlayScene(ctx, frame = 0, accent = '#FFB74D', footerH = 0, lite = false) {
  const bottom = SCREEN_HEIGHT - footerH;
  const wallH = bottom * 0.42;
  const counterTop = bottom * 0.38;

  drawShopWallpaper(ctx, wallH, frame);
  drawShopWindow(ctx, frame, wallH);
  if (!lite) drawStringLights(ctx, frame, wallH * 0.06);
  drawCounter(ctx, counterTop, bottom, frame);
  if (!lite) drawSideCrates(ctx, counterTop + 48, frame);

  if (!lite) {
    FAIRY.forEach((f, i) => {
      const x = f.x * SCREEN_WIDTH + Math.sin(frame * f.sp + i * 2) * 5;
      const y = counterTop + f.y * (bottom - counterTop) + Math.cos(frame * f.sp * 1.1 + i) * 4;
      ctx.fillStyle = `rgba(255,255,255,${0.15 + Math.sin(frame * 0.05 + i) * 0.08})`;
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  const spotCx = SCREEN_WIDTH * 0.5;
  const spotCy = counterTop + (bottom - counterTop) * 0.52;
  const spot = ctx.createRadialGradient(spotCx, spotCy, 30, spotCx, spotCy, SCREEN_WIDTH * 0.42);
  spot.addColorStop(0, `${accent}14`);
  spot.addColorStop(0.5, 'rgba(255,200,120,0.06)');
  spot.addColorStop(1, 'rgba(255,200,120,0)');
  ctx.fillStyle = spot;
  ctx.fillRect(0, counterTop, SCREEN_WIDTH, bottom - counterTop);

  const vig = ctx.createRadialGradient(
    SCREEN_WIDTH / 2,
    bottom * 0.48,
    bottom * 0.2,
    SCREEN_WIDTH / 2,
    bottom * 0.48,
    SCREEN_WIDTH * 0.88,
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(62,39,35,0.16)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, SCREEN_WIDTH, bottom);

  if (footerH > 0) {
    const fg = ctx.createLinearGradient(0, bottom, 0, SCREEN_HEIGHT);
    fg.addColorStop(0, '#6D4C41');
    fg.addColorStop(1, '#4E342E');
    ctx.fillStyle = fg;
    ctx.fillRect(0, bottom, SCREEN_WIDTH, footerH);
  }
}
