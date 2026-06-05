export function renderFx(ctx, list, player) {
  list.forEach((f) => {
      const t = f.life / f.maxLife;
      ctx.save();
      if (f.type === 'purge' || f.type === 'shock') {
        const expand = 1 + (1 - t) * 0.35;
        const r = f.radius * expand;
        ctx.globalAlpha = t * 0.55;
        const g = ctx.createRadialGradient(f.x, f.y, r * 0.1, f.x, f.y, r);
        g.addColorStop(0, f.color || '#EF5350');
        g.addColorStop(0.6, 'rgba(239,83,80,0.25)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = f.color || '#EF5350';
        ctx.lineWidth = 3;
        ctx.globalAlpha = t * 0.8;
        ctx.stroke();
      } else if (f.type === 'magnet') {
        const r = f.radius * (0.85 + (1 - t) * 0.15);
        ctx.globalAlpha = 0.25 * t;
        ctx.strokeStyle = '#BA68C8';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 10]);
        ctx.beginPath();
        ctx.arc(player.x, player.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (f.type === 'rush') {
        ctx.globalAlpha = 0.35 * t;
        ctx.strokeStyle = '#FFD54F';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.getRadius() * 1.5, 0, Math.PI * 2);
        ctx.stroke();
      } else if (f.type === 'fire') {
        ctx.globalAlpha = t;
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 36);
        g.addColorStop(0, 'rgba(255,112,67,0.9)');
        g.addColorStop(1, 'rgba(255,112,67,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(f.x, f.y, 36 * (1 - t * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
}

export function renderAuras(ctx, player, unlocked) {
    unlocked.forEach((w) => {
      if (w.id === 'ice') {
        ctx.save();
        ctx.globalAlpha = 0.22;
        const g = ctx.createRadialGradient(player.x, player.y, 10, player.x, player.y, w.auraRadius);
        g.addColorStop(0, 'rgba(79,195,247,0.5)');
        g.addColorStop(1, 'rgba(79,195,247,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(player.x, player.y, w.auraRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(129,212,250,0.45)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }
      if (w.id === 'fire') {
        ctx.save();
        ctx.globalAlpha = 0.18;
        const g = ctx.createRadialGradient(player.x, player.y, 20, player.x, player.y, w.burnRadius);
        g.addColorStop(0, 'rgba(255,112,67,0.55)');
        g.addColorStop(1, 'rgba(255,87,34,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(player.x, player.y, w.burnRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });
}

export function renderWheels(ctx, orbs) {
    orbs.forEach((o) => {
      ctx.save();
      const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
      g.addColorStop(0, '#FFF59D');
      g.addColorStop(0.5, '#FFD54F');
      g.addColorStop(1, 'rgba(255,213,79,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFC107';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    });
}
