import { SCREEN_WIDTH, SCREEN_HEIGHT, BG_SCROLL_SPEED } from '../config/constants';
import { LEVELS } from '../config/levels';

/**
 * 炫酷分层视差背景
 */
export default class Background {
  constructor() {
    this.level = 1;
    this.time = 0;
    this.stars = [];
    this.nebulae = [];
    this.shootingStars = [];
    this.auroras = [];
    this.speedLines = [];
    this.initScene();
  }

  initScene() {
    const cfg = this.getLevelCfg();
    const starSpeed = cfg.bg.starSpeed || 1;

    this.stars = Array.from({ length: 140 }, () => ({
      x: Math.random() * SCREEN_WIDTH,
      y: Math.random() * SCREEN_HEIGHT,
      size: Math.random() * 2.5 + 0.2,
      speed: (Math.random() * 2 + 0.4) * starSpeed,
      alpha: Math.random() * 0.7 + 0.15,
      layer: Math.floor(Math.random() * 3),
      twinkle: Math.random() * Math.PI * 2,
    }));

    this.nebulae = Array.from({ length: 6 }, (_, i) => ({
      x: Math.random() * SCREEN_WIDTH,
      y: Math.random() * SCREEN_HEIGHT,
      r: 60 + Math.random() * 120,
      speed: 0.2 + Math.random() * 0.5,
      color: cfg.bg.nebula[i % cfg.bg.nebula.length],
      phase: Math.random() * Math.PI * 2,
    }));

    this.auroras = Array.from({ length: 3 }, (_, i) => ({
      y: SCREEN_HEIGHT * (0.2 + i * 0.25),
      amplitude: 30 + Math.random() * 40,
      speed: 0.008 + i * 0.004,
      phase: Math.random() * Math.PI * 2,
      color: cfg.bg.nebula[i % cfg.bg.nebula.length],
    }));

    this.speedLines = Array.from({ length: 12 }, () => ({
      x: Math.random() * SCREEN_WIDTH,
      y: Math.random() * SCREEN_HEIGHT,
      len: 20 + Math.random() * 60,
      speed: 3 + Math.random() * 5,
      alpha: 0.05 + Math.random() * 0.12,
    }));

    this.shootingStars = [];
  }

  getLevelCfg() {
    return LEVELS[this.level - 1] || LEVELS[0];
  }

  setLevel(level) {
    this.level = level;
    this.initScene();
  }

  update() {
    if (GameGlobal.databus.isGameOver) return;

    this.time++;
    const scroll = BG_SCROLL_SPEED;

    this.stars.forEach((star) => {
      star.y += star.speed * scroll * (0.4 + star.layer * 0.3);
      star.twinkle += 0.05;
      if (star.y > SCREEN_HEIGHT) {
        star.y = -2;
        star.x = Math.random() * SCREEN_WIDTH;
      }
    });

    this.nebulae.forEach((n) => {
      n.y += n.speed * scroll * 0.25;
      n.phase += 0.01;
      if (n.y > SCREEN_HEIGHT + n.r) {
        n.y = -n.r;
        n.x = Math.random() * SCREEN_WIDTH;
      }
    });

    this.speedLines.forEach((line) => {
      line.y += line.speed * scroll * 0.6;
      if (line.y > SCREEN_HEIGHT + line.len) {
        line.y = -line.len;
        line.x = Math.random() * SCREEN_WIDTH;
      }
    });

    if (Math.random() < 0.015) {
      this.shootingStars.push({
        x: Math.random() * SCREEN_WIDTH,
        y: -10,
        len: 40 + Math.random() * 80,
        speed: 8 + Math.random() * 6,
        alpha: 0.6 + Math.random() * 0.4,
      });
    }

    this.shootingStars = this.shootingStars.filter((s) => {
      s.x -= 2;
      s.y += s.speed;
      return s.y < SCREEN_HEIGHT + 20;
    });
  }

  render(ctx) {
    const cfg = this.getLevelCfg().bg;
    const t = this.time;

    // 深空渐变
    const grad = ctx.createLinearGradient(0, 0, 0, SCREEN_HEIGHT);
    grad.addColorStop(0, cfg.top);
    grad.addColorStop(0.35, cfg.mid);
    grad.addColorStop(0.75, cfg.bottom);
    grad.addColorStop(1, '#020208');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // 极光带
    this.auroras.forEach((a) => {
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.beginPath();
      ctx.moveTo(0, a.y);
      for (let x = 0; x <= SCREEN_WIDTH; x += 8) {
        const y = a.y + Math.sin(x * a.speed + a.phase + t * 0.02) * a.amplitude;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(SCREEN_WIDTH, SCREEN_HEIGHT);
      ctx.lineTo(0, SCREEN_HEIGHT);
      ctx.closePath();
      ctx.fillStyle = a.color.replace(/[\d.]+\)$/, '0.4)');
      ctx.fill();
      ctx.restore();
    });

    // 大型星云
    this.nebulae.forEach((n) => {
      const pulse = 1 + Math.sin(n.phase) * 0.15;
      const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * pulse);
      g.addColorStop(0, n.color);
      g.addColorStop(0.5, n.color.replace(/[\d.]+\)$/, '0.15)'));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(n.x - n.r * pulse, n.y - n.r * pulse, n.r * 2 * pulse, n.r * 2 * pulse);
    });

    // 速度线
    this.speedLines.forEach((line) => {
      ctx.strokeStyle = `rgba(180,200,255,${line.alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(line.x, line.y);
      ctx.lineTo(line.x, line.y + line.len);
      ctx.stroke();
    });

    // 远景星
    this.stars.filter((s) => s.layer === 0).forEach((star) => {
      const a = star.alpha * 0.5 * (0.7 + Math.sin(star.twinkle) * 0.3);
      ctx.fillStyle = `rgba(150,170,255,${a})`;
      ctx.fillRect(star.x, star.y, star.size * 0.6, star.size * 0.6);
    });

    // 中景星
    this.stars.filter((s) => s.layer === 1).forEach((star) => {
      const a = star.alpha * (0.7 + Math.sin(star.twinkle) * 0.3);
      ctx.fillStyle = `rgba(220,230,255,${a})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // 近景亮星 + 十字光芒
    this.stars.filter((s) => s.layer === 2).forEach((star) => {
      const a = star.alpha * (0.8 + Math.sin(star.twinkle) * 0.2);
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size * 0.7, 0, Math.PI * 2);
      ctx.fill();
      if (star.size > 1.8) {
        ctx.strokeStyle = `rgba(255,255,255,${a * 0.4})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(star.x - 4, star.y);
        ctx.lineTo(star.x + 4, star.y);
        ctx.moveTo(star.x, star.y - 4);
        ctx.lineTo(star.x, star.y + 4);
        ctx.stroke();
      }
    });

    // 流星
    this.shootingStars.forEach((s) => {
      ctx.save();
      ctx.strokeStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x + s.len * 0.4, s.y - s.len);
      ctx.stroke();
      ctx.restore();
    });

    // 顶部光晕
    const topGlow = ctx.createRadialGradient(
      SCREEN_WIDTH / 2, -SCREEN_HEIGHT * 0.1, 0,
      SCREEN_WIDTH / 2, -SCREEN_HEIGHT * 0.1, SCREEN_WIDTH * 0.8
    );
    topGlow.addColorStop(0, cfg.nebula[0] || 'rgba(108,92,231,0.12)');
    topGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT * 0.6);

    // 底部能量光
    const bottomGlow = ctx.createLinearGradient(0, SCREEN_HEIGHT * 0.65, 0, SCREEN_HEIGHT);
    bottomGlow.addColorStop(0, 'rgba(0,0,0,0)');
    bottomGlow.addColorStop(1, cfg.nebula[1] || cfg.nebula[0] || 'rgba(108,92,231,0.1)');
    ctx.fillStyle = bottomGlow;
    ctx.fillRect(0, SCREEN_HEIGHT * 0.65, SCREEN_WIDTH, SCREEN_HEIGHT * 0.35);
  }
}
