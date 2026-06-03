const STORAGE_KEY = 'thunder_fighter_top10';
const MAX_RECORDS = 10;

/**
 * 本地积分排行榜 - 保留历史前10名（按分数降序）
 */
export default class ScoreBoard {
  static load() {
    try {
      const data = wx.getStorageSync(STORAGE_KEY);
      if (Array.isArray(data)) {
        return data
          .filter((r) => r && typeof r.score === 'number')
          .sort((a, b) => b.score - a.score)
          .slice(0, MAX_RECORDS);
      }
    } catch (e) {
      /* 忽略读取失败 */
    }
    return [];
  }

  static save(score, level, cleared = false) {
    const list = ScoreBoard.load();
    list.push({
      score: Math.floor(score),
      level: level || 1,
      cleared: !!cleared,
      time: Date.now(),
    });
    list.sort((a, b) => b.score - a.score);
    const top = list.slice(0, MAX_RECORDS);
    try {
      wx.setStorageSync(STORAGE_KEY, top);
    } catch (e) {
      /* 忽略写入失败 */
    }
    return top;
  }

  static formatDate(ts) {
    const d = new Date(ts);
    const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  static isNewHighScore(score, topList) {
    if (!topList.length) return true;
    return score >= topList[0].score;
  }

  static getRank(score, topList) {
    const idx = topList.findIndex((r) => r.score === score);
    return idx >= 0 ? idx + 1 : null;
  }
}
