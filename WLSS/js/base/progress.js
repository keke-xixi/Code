const KEY = 'wlss_save';

const defaults = () => ({
  normalMaxPower: 1,
  normalWins: 0,
  extremeWins: 0,
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

export function getSave() {
  return { ...data };
}

export function getNormalMax() {
  return Math.max(1, data.normalMaxPower);
}

export function recordRun(mode, power, won) {
  if (mode === 'normal' && power > data.normalMaxPower) {
    data.normalMaxPower = power;
  }
  if (won) {
    if (mode === 'normal') data.normalWins += 1;
    else data.extremeWins += 1;
  }
  save();
}
