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
        kind: 'dot',
      });
    }
  }

  sparkle(x, y, color = '#FFD54F', count = 8) {
    for (let i = 0; i < count; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const sp = 1.5 + Math.random() * 3;
      this.list.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 1.2,
        life: 20 + Math.random() * 10,
        color,
        size: 2 + Math.random() * 3,
        kind: 'star',
        rot: Math.random() * Math.PI,
      });
    }
  }

  emojiBurst(x, y, emoji, count = 5) {
    for (let i = 0; i < count; i += 1) {
      const a = (Math.PI * 2 * i) / count;
      this.list.push({
        x, y,
        vx: Math.cos(a) * (2 + Math.random() * 2),
        vy: Math.sin(a) * (2 + Math.random() * 2) - 1,
        life: 24 + Math.random() * 8,
        emoji,
        kind: 'emoji',
      });
    }
  }

  update(dt = 1) {
    this.list = this.list.filter((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 0.08 * dt;
      p.life -= dt;
      return p.life > 0;
    });
  }

  render(ctx) {
    this.list.forEach((p) => {
      const alpha = Math.min(1, p.life / 20);
      ctx.save();
      ctx.globalAlpha = alpha;
      if (p.kind === 'emoji') {
        ctx.font = `${14 + (p.life % 4)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.emoji, p.x, p.y);
      } else if (p.kind === 'star') {
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot + (28 - p.life) * 0.08);
        ctx.beginPath();
        for (let i = 0; i < 4; i += 1) {
          const ang = (Math.PI * i) / 2;
          ctx.lineTo(Math.cos(ang) * p.size, Math.sin(ang) * p.size);
          ctx.lineTo(Math.cos(ang + Math.PI / 4) * p.size * 0.35, Math.sin(ang + Math.PI / 4) * p.size * 0.35);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
    ctx.globalAlpha = 1;
  }
}
