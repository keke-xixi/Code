export default class Particles {
  list = [];

  burst(x, y, color = '#FFD54F', count = 12) {
    for (let i = 0; i < count; i += 1) {
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const sp = 2 + Math.random() * 4;
      this.list.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 28 + Math.random() * 12,
        color,
        size: 3 + Math.random() * 4,
      });
    }
  }

  ring(x, y, color = '#69F0AE') {
    for (let i = 0; i < 16; i += 1) {
      const a = (Math.PI * 2 * i) / 16;
      this.list.push({
        x: x + Math.cos(a) * 8,
        y: y + Math.sin(a) * 8,
        vx: Math.cos(a) * 1.5,
        vy: Math.sin(a) * 1.5,
        life: 20,
        color,
        size: 2,
      });
    }
  }

  update() {
    this.list = this.list.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;
      p.life -= 1;
      return p.life > 0;
    });
  }

  render(ctx) {
    this.list.forEach((p) => {
      ctx.globalAlpha = Math.min(1, p.life / 20);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }
}
