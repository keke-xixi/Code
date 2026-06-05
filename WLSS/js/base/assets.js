const cache = {};

function loadImage(src) {
  if (cache[src]) return cache[src];
  const img = wx.createImage();
  img._loaded = false;
  img._failed = false;
  img.onload = () => { img._loaded = true; };
  img.onerror = () => { img._failed = true; };
  img.src = src;
  cache[src] = img;
  return img;
}

export function getAssetList(CONFIG) {
  const { assets } = CONFIG;
  return [
    assets.menuBg,
    assets.tileGround,
    assets.player,
    assets.enemy,
    assets.boss,
    ...Object.values(assets.terrain),
  ];
}

export function waitForAssets(paths, timeout = 8000) {
  paths.forEach(loadImage);
  const start = Date.now();
  return new Promise((resolve) => {
    const tick = () => {
      const ok = paths.every((s) => {
        const img = cache[s];
        return img && (img._loaded || img._failed);
      });
      if (ok || Date.now() - start > timeout) resolve();
      else setTimeout(tick, 50);
    };
    tick();
  });
}

export function getImage(src) {
  return cache[src] || loadImage(src);
}

export function drawCover(ctx, src, x, y, w, h) {
  const img = getImage(src);
  if (!img || !img._loaded) return false;
  const ir = img.width / img.height;
  const dr = w / h;
  let sw; let sh; let sx; let sy;
  if (ir > dr) {
    sh = img.height; sw = sh * dr; sx = (img.width - sw) / 2; sy = 0;
  } else {
    sw = img.width; sh = sw / dr; sx = 0; sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  return true;
}

export function drawSprite(ctx, src, x, y, w, h, opts = {}) {
  const img = getImage(src);
  if (!img || !img._loaded) return false;
  const { alpha = 1, rotation = 0 } = opts;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
  return true;
}

export function drawTiled(ctx, src, x, y, w, h) {
  const img = getImage(src);
  if (!img || !img._loaded) return false;
  const tw = img.width;
  const th = img.height;
  for (let ty = y; ty < y + h; ty += th) {
    for (let tx = x; tx < x + w; tx += tw) {
      const dw = Math.min(tw, x + w - tx);
      const dh = Math.min(th, y + h - ty);
      ctx.drawImage(img, 0, 0, dw, dh, tx, ty, dw, dh);
    }
  }
  return true;
}
