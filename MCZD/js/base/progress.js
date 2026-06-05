import LEVELS from '../config/levels.config';

const KEY = 'bomb_finder_progress';

const defaults = () => ({
  unlocked: [1],
  stars: {},
});

let data = defaults();

function load() {
  try {
    const raw = wx.getStorageSync(KEY);
    if (raw) data = { ...defaults(), ...raw };
  } catch (e) { /* ignore */ }
}

function save() {
  try { wx.setStorageSync(KEY, data); } catch (e) { /* ignore */ }
}

load();

export function isUnlocked(id) {
  return data.unlocked.includes(id);
}

export function unlock(id) {
  if (id > LEVELS.length || data.unlocked.includes(id)) return;
  data.unlocked.push(id);
  data.unlocked.sort((a, b) => a - b);
  save();
}

export function getStars(id) {
  return data.stars[String(id)] || 0;
}

export function setStars(id, stars) {
  const key = String(id);
  if (stars > (data.stars[key] || 0)) {
    data.stars[key] = stars;
    save();
  }
}
