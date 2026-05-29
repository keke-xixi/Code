import { SCREEN_WIDTH, SCREEN_HEIGHT, STAR_COUNT, BG_SCROLL_SPEED } from '../config/constants';

/**
 * 星空滚动背景
 */
export default class Background {
  constructor() {
    this.stars = [];
    this.initStars();
  }

  initStars() {
    this.stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * SCREEN_WIDTH,
      y: Math.random() * SCREEN_HEIGHT,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.5 + 0.3,
    }));
  }

  update() {
    if (GameGlobal.databus.isGameOver) return;

    this.stars.forEach((star) => {
      star.y += star.speed * BG_SCROLL_SPEED * 0.5;
      if (star.y > SCREEN_HEIGHT) {
        star.y = 0;
        star.x = Math.random() * SCREEN_WIDTH;
      }
    });
  }

  render(ctx) {
    // 深空渐变
    const grad = ctx.createLinearGradient(0, 0, 0, SCREEN_HEIGHT);
    grad.addColorStop(0, '#0a0e27');
    grad.addColorStop(0.5, '#1a1a3e');
    grad.addColorStop(1, '#0d1b2a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // 星星
    this.stars.forEach((star) => {
      ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });
  }
}
