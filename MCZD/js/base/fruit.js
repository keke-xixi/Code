export function drawFruit3D(ctx, tile, exposed) {
  const r = tile.size * 0.44;
  const scale = exposed ? 1 : 0.94;
  const lift = tile.layer * 0.6;

  ctx.save();
  ctx.translate(tile.x, tile.y - lift);
  ctx.scale(scale, scale);

  ctx.fillStyle = 'rgba(0,0,0,0.14)';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.62, r * 0.9, r * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();

  const sphere = ctx.createRadialGradient(-r * 0.28, -r * 0.32, r * 0.08, r * 0.05, r * 0.08, r);
  sphere.addColorStop(0, '#FFFFFF');
  sphere.addColorStop(0.35, '#FAFAFA');
  sphere.addColorStop(0.72, '#ECEFF1');
  sphere.addColorStop(1, '#B0BEC5');
  ctx.fillStyle = sphere;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  const shade = ctx.createLinearGradient(0, -r * 0.2, 0, r);
  shade.addColorStop(0, 'rgba(255,255,255,0)');
  shade.addColorStop(0.55, 'rgba(0,0,0,0)');
  shade.addColorStop(1, 'rgba(0,0,0,0.14)');
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(120,144,156,0.35)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, r - 0.5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.24, -r * 0.3, r * 0.26, r * 0.16, -0.6, 0, Math.PI * 2);
  ctx.fill();

  const fontSize = Math.floor(tile.size * 1.08);
  ctx.font = `${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.globalAlpha = 1;
  ctx.fillText(tile.emoji, 0, -r * 0.04);

  ctx.restore();
}
