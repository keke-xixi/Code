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

export function preloadAssets(paths) {
  paths.forEach(loadImage);
  return paths;
}

export function waitForAssets(paths, timeout = 8000) {
  preloadAssets(paths);
  const start = Date.now();
  return new Promise((resolve) => {
    const tick = () => {
      const ready = paths.every((src) => {
        const img = cache[src];
        return img && (img._loaded || img._failed);
      });
      if (ready || Date.now() - start > timeout) resolve();
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
    sh = img.height;
    sw = sh * dr;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / dr;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  return true;
}
