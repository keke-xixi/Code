import { GAME_CLUB_OPENLINK } from '../config/gameClub.config';

let pageManager = null;
let loading = false;
let nativeBtn = null;

/** 是否支持 createPageManager（指定页面跳转） */
export function canUsePageManager() {
  return typeof wx.createPageManager === 'function';
}

/** 是否支持原生游戏圈按钮 */
export function canUseNativeButton() {
  return typeof wx.createGameClubButton === 'function';
}

/**
 * 通过 PageManager 打开游戏圈（可指定帖子/话题页）
 */
export function openGameClub() {
  if (loading) return;

  if (GAME_CLUB_OPENLINK && canUsePageManager()) {
    loading = true;
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
        wx.showToast({ title: '游戏圈打开失败，请稍后重试', icon: 'none', duration: 2000 });
      });
    return;
  }

  if (nativeBtn && GAME_CLUB_OPENLINK) {
    wx.showToast({ title: '请点击游戏圈按钮', icon: 'none', duration: 1500 });
    return;
  }

  wx.showToast({
    title: GAME_CLUB_OPENLINK ? '当前环境不支持游戏圈' : '请在 gameClub.config.js 配置 OPENLINK',
    icon: 'none',
    duration: 2500,
  });
}

/**
 * 原生游戏圈按钮：仅在暂停/结算时显示，对局中隐藏，避免遮挡操作区域
 */
export default class GameClubButton {
  constructor() {
    this.visible = false;
    this.mode = 'pause'; // 'pause' | 'end'
    this.initNative();
  }

  initNative() {
    if (!canUseNativeButton()) return;

    const opts = {
      type: 'text',
      text: '游戏圈',
      style: {
        left: 0,
        top: 0,
        width: 120,
        height: 34,
        backgroundColor: 'rgba(108, 92, 231, 0.9)',
        color: '#ffffff',
        fontSize: 13,
        borderRadius: 8,
        textAlign: 'center',
        lineHeight: 34,
      },
    };

    if (GAME_CLUB_OPENLINK) opts.openlink = GAME_CLUB_OPENLINK;

    nativeBtn = wx.createGameClubButton(opts);
    nativeBtn.hide();
  }

  /** @param {{ x: number, y: number, w: number, h: number }} rect */
  syncRect(rect) {
    if (!nativeBtn || !rect) return;
    nativeBtn.style.left = rect.x;
    nativeBtn.style.top = rect.y;
    nativeBtn.style.width = rect.w;
    nativeBtn.style.height = rect.h;
    nativeBtn.style.lineHeight = rect.h;
  }

  setMode(mode) {
    this.mode = mode;
  }

  show() {
    if (!nativeBtn || this.visible) return;
    nativeBtn.show();
    this.visible = true;
  }

  hide() {
    if (!nativeBtn || !this.visible) return;
    nativeBtn.hide();
    this.visible = false;
  }

  /**
   * 根据游戏状态自动显隐
   * @param {'pause'|'end'|null} scene
   * @param {{ x: number, y: number, w: number, h: number }|null} rect
   */
  update(scene, rect) {
    if (!nativeBtn) return;

    if (scene && rect) {
      this.setMode(scene);
      this.syncRect(rect);
      this.show();
    } else {
      this.hide();
    }
  }
}
