const STORAGE_KEY = 'thunder_fighter_revive_count';
const MAX_STORED = 99;

/** 本地存储的复活次数（暂停看广告累积，游戏结束可消耗） */
export default class ReviveStorage {
  static load() {
    try {
      const raw = wx.getStorageSync(STORAGE_KEY);
      // 首次进入游戏赠送 1 次复活
      if (raw === '' || raw === undefined || raw === null) {
        return ReviveStorage.save(1);
      }
      if (typeof raw === 'number' && raw >= 0) {
        return Math.min(raw, MAX_STORED);
      }
    } catch (e) {
      /* 忽略 */
    }
    return ReviveStorage.save(1);
  }

  static save(count) {
    const safe = Math.max(0, Math.min(count, MAX_STORED));
    try {
      wx.setStorageSync(STORAGE_KEY, safe);
    } catch (e) {
      /* 忽略 */
    }
    return safe;
  }

  static add(amount = 1) {
    return ReviveStorage.save(ReviveStorage.load() + amount);
  }

  static consume() {
    const current = ReviveStorage.load();
    if (current <= 0) return false;
    ReviveStorage.save(current - 1);
    return true;
  }
}
