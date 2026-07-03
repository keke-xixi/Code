import { GAMEPLAY_KEYS } from '../config/gameClub.config';

const STORAGE_KEY = 'thunder_fighter_top10';
const SYNC_CACHE_KEY = 'thunder_fighter_cloud_sync';
const MAX_RECORDS = 10;

/** 构建微信托管数据 value（含 wxgame 字段，兼容游戏圈/排行榜） */
function buildWxgameValue(score) {
  return JSON.stringify({
    wxgame: {
      score: Math.floor(score),
      update_time: Math.floor(Date.now() / 1000),
    },
  });
}

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

    ScoreBoard.syncGameplay(Math.floor(score), level || 1, cleared);
    return top;
  }

  /** 将最高得分/关卡/通关状态同步到微信托管数据（key 对应 MP 后台玩法 ID） */
  static syncGameplay(score, level, cleared = false) {
    if (typeof wx.setUserCloudStorage !== 'function') return;

    let cache = { bestScore: 0, maxLevel: 0, gameCleared: 0 };
    try {
      const saved = wx.getStorageSync(SYNC_CACHE_KEY);
      if (saved) cache = { ...cache, ...saved };
    } catch (e) {
      /* 忽略 */
    }

    const kvList = [];
    if (score > (cache.bestScore || 0)) {
      kvList.push({
        key: GAMEPLAY_KEYS.BEST_SCORE,
        value: buildWxgameValue(score),
      });
      cache.bestScore = score;
    }
    if (level > (cache.maxLevel || 0)) {
      kvList.push({
        key: GAMEPLAY_KEYS.MAX_LEVEL,
        value: buildWxgameValue(level),
      });
      cache.maxLevel = level;
    }
    if (cleared && !cache.gameCleared) {
      kvList.push({
        key: GAMEPLAY_KEYS.GAME_CLEARED,
        value: buildWxgameValue(1),
      });
      cache.gameCleared = 1;
    }

    if (!kvList.length) return;

    wx.setUserCloudStorage({
      KVDataList: kvList,
      success: () => {
        try {
          wx.setStorageSync(SYNC_CACHE_KEY, cache);
        } catch (e) {
          /* 忽略 */
        }
      },
      fail: (err) => {
        console.warn('[Gameplay] sync failed', err);
      },
    });
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
