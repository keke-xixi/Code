export default class Particles {
  list = [];

  burst(x, y, color = '#CE93D8', n = 14) {
    for (let i = 0; i < n; i += 1) {
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.5;
      const sp = 2 + Math.random() * 5;
      this.list.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 24 + Math.random() * 16, color, size: 2 + Math.random() * 4,
      });
    }
  }

  floatText(x, y, text, color = '#FFD54F') {
    this.list.push({
      x, y, vx: 0, vy: -1.2, life: 42, text, color, size: 0,
    });
  }

  update() {
    this.list = this.list.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 1;
      return p.life > 0;
    });
  }

  render(ctx) {
    this.list.forEach((p) => {
      ctx.globalAlpha = Math.min(1, p.life / 30);
      if (p.text) {
        ctx.fillStyle = p.color;
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x, p.y);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;
  }
}
