import LEVELS from '../config/levels.config';
import { GAMEPLAY_KEYS } from '../config/gameClub.config';
import { getStars, isUnlocked } from '../base/progress';

const SYNC_CACHE_KEY = 'mirror_twin_cloud_sync';

function buildWxgameValue(score) {
  return JSON.stringify({
    wxgame: {
      score: Math.floor(score),
      update_time: Math.floor(Date.now() / 1000),
    },
  });
}

function getTotalStars() {
  return LEVELS.reduce((sum, lv) => sum + getStars(lv.id), 0);
}

function getMaxUnlockedLevel() {
  let max = 1;
  LEVELS.forEach((lv) => {
    if (isUnlocked(lv.id) && lv.id > max) max = lv.id;
  });
  return max;
}

function isAllCleared() {
  return LEVELS.every((lv) => getStars(lv.id) > 0);
}

/** 关卡胜利后同步战绩到微信托管数据 */
export function syncGameplayAfterWin() {
  if (typeof wx.setUserCloudStorage !== 'function') return;

  let cache = { totalStars: 0, maxLevel: 0, gameCleared: 0 };
  try {
    const saved = wx.getStorageSync(SYNC_CACHE_KEY);
    if (saved) cache = { ...cache, ...saved };
  } catch (e) {
    /* ignore */
  }

  const totalStars = getTotalStars();
  const maxLevel = getMaxUnlockedLevel();
  const gameCleared = isAllCleared() ? 1 : 0;

  const kvList = [];
  if (totalStars > (cache.totalStars || 0)) {
    kvList.push({ key: GAMEPLAY_KEYS.TOTAL_STARS, value: buildWxgameValue(totalStars) });
    cache.totalStars = totalStars;
  }
  if (maxLevel > (cache.maxLevel || 0)) {
    kvList.push({ key: GAMEPLAY_KEYS.MAX_LEVEL, value: buildWxgameValue(maxLevel) });
    cache.maxLevel = maxLevel;
  }
  if (gameCleared && !cache.gameCleared) {
    kvList.push({ key: GAMEPLAY_KEYS.GAME_CLEARED, value: buildWxgameValue(1) });
    cache.gameCleared = 1;
  }

  if (!kvList.length) return;

  wx.setUserCloudStorage({
    KVDataList: kvList,
    success: () => {
      try {
        wx.setStorageSync(SYNC_CACHE_KEY, cache);
      } catch (e) {
        /* ignore */
      }
    },
    fail: (err) => {
      console.warn('[Gameplay] sync failed', err);
    },
  });
}
