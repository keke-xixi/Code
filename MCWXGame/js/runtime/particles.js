/**
 * 粒子爆炸效果
 */
export default class Particle {
  constructor(x, y, color, size) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = size;
    this.life = 20;
    this.maxLife = 20;
    this.particles = [];

    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      this.particles.push({
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 4,
      });
    }
  }

  update() {
    this.life--;
    this.particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95;
      p.vy *= 0.95;
    });
    return this.life > 0;
  }

  render(ctx) {
    const alpha = this.life / this.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    this.particles.forEach((p) => {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x + p.x, this.y + p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }
}
