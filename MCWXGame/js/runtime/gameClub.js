import { GAME_CLUB_OPENLINK } from '../config/gameClub.config';

let pageManager = null;
let loading = false;

function getPlatform() {
  try {
    return wx.getSystemInfoSync?.()?.platform || '';
  } catch (e) {
    return '';
  }
}

/** PC 端微信小游戏对游戏圈支持不完整 */
export function isGameClubPcLimited() {
  const p = getPlatform();
  return p === 'windows' || p === 'mac';
}

export function canUsePageManager() {
  return typeof wx.createPageManager === 'function';
}

function showToast(title, duration = 2500) {
  wx.showToast({ title, icon: 'none', duration });
}

/**
 * 打开游戏圈（Canvas 按钮点击入口）
 * 不再叠加原生 createGameClubButton，避免 PC 端点击被拦截却无响应
 */
export function openGameClub() {
  if (loading) return;

  if (isGameClubPcLimited()) {
    showToast('游戏圈请在手机微信中打开');
    return;
  }

  if (!GAME_CLUB_OPENLINK) {
    showToast('未配置游戏圈 openlink');
    return;
  }

  if (!canUsePageManager()) {
    showToast('当前微信版本不支持游戏圈，请升级后重试');
    return;
  }

  loading = true;
  showToast('正在打开游戏圈…', 1500);

  if (!pageManager) pageManager = wx.createPageManager();

  pageManager
    .load({ openlink: GAME_CLUB_OPENLINK })
    .then(() => {
      loading = false;
      pageManager.show();
    })
    .catch((err) => {
      loading = false;
      console.error('[GameClub] load failed', err);
      const code = err?.errCode ?? err?.errno;
      if (code === -8) {
        showToast('openlink 与当前版本不匹配，请检查体验版/正式版');
      } else if (code === -2) {
        showToast('微信版本过低，请升级后重试');
      } else {
        showToast('游戏圈打开失败，请稍后重试');
      }
    });
}

/** 保留兼容：main.js 初始化用 */
export default class GameClubButton {
  open = openGameClub;

  hide() {}

  update() {}
}
