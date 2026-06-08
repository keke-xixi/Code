import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';

const STARS = Array.from({ length: 24 }, (_, i) => ({
  x: (i * 47 + 13) % 100 / 100,
  y: (i * 31 + 7) % 85 / 100,
  s: 1 + (i % 3) * 0.6,
  sp: 0.02 + (i % 5) * 0.004,
  ph: i * 1.7,
}));

/** 选关：镜界蓝紫 + 微光星点 */
export function drawMenuScene(ctx, frame = 0) {
  const g = ctx.createLinearGradient(0, 0, SCREEN_WIDTH * 0.3, SCREEN_HEIGHT);
  g.addColorStop(0, '#3F51B5');
  g.addColorStop(0.5, '#283593');
  g.addColorStop(1, '#1A237E');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  const aurora = ctx.createLinearGradient(0, SCREEN_HEIGHT * 0.2, SCREEN_WIDTH, SCREEN_HEIGHT * 0.7);
  aurora.addColorStop(0, 'rgba(126,87,192,0)');
  aurora.addColorStop(0.5, `rgba(126,87,192,${0.08 + Math.sin(frame * 0.015) * 0.03})`);
  aurora.addColorStop(1, 'rgba(126,87,192,0)');
  ctx.fillStyle = aurora;
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  STARS.forEach((st) => {
    const x = st.x * SCREEN_WIDTH + Math.sin(frame * st.sp + st.ph) * 2;
    const y = st.y * SCREEN_HEIGHT + Math.cos(frame * st.sp * 0.8 + st.ph) * 1.5;
    const a = 0.25 + Math.sin(frame * 0.05 + st.ph) * 0.15;
    ctx.fillStyle = `rgba(232,234,246,${a})`;
    ctx.beginPath();
    ctx.arc(x, y, st.s, 0, Math.PI * 2);
    ctx.fill();
  });
}

/** 对局：深色镜界底 + 中央微光分隔 */
export function drawPlayScene(ctx, frame = 0, accent = '#7E57C2') {
  const g = ctx.createLinearGradient(0, 0, 0, SCREEN_HEIGHT);
  g.addColorStop(0, '#1A237E');
  g.addColorStop(0.45, '#151B4A');
  g.addColorStop(1, '#0D1230');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  const beam = ctx.createLinearGradient(0, 0, SCREEN_WIDTH, 0);
  const pulse = 0.06 + Math.sin(frame * 0.018) * 0.025;
  beam.addColorStop(0, 'rgba(126,87,192,0)');
  beam.addColorStop(0.48, `rgba(126,87,192,${pulse})`);
  beam.addColorStop(0.52, `rgba(255,213,79,${pulse * 0.6})`);
  beam.addColorStop(1, 'rgba(126,87,192,0)');
  ctx.fillStyle = beam;
  ctx.fillRect(0, SCREEN_HEIGHT * 0.2, SCREEN_WIDTH, SCREEN_HEIGHT * 0.55);

  const wash = ctx.createRadialGradient(
    SCREEN_WIDTH * 0.5,
    SCREEN_HEIGHT * 0.45,
    40,
    SCREEN_WIDTH * 0.5,
    SCREEN_HEIGHT * 0.45,
    SCREEN_WIDTH * 0.7,
  );
  wash.addColorStop(0, `${accent}12`);
  wash.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
}
