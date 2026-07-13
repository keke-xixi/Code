import { AD_ENABLED, AD_UNITS, SCORE_BONUS_RATIO } from '../config/ads.config';
import { SKILL_CONFIG } from '../config/weapons';

const SKILL_KEYS = Object.keys(SKILL_CONFIG);

function showToast(title, duration = 2500) {
  wx.showToast({ title, icon: 'none', duration });
}

function isDevEnv() {
  try {
    const env = wx.getAccountInfoSync?.()?.miniProgram?.envVersion;
    return env === 'develop' || env === 'trial';
  } catch (e) {
    return true;
  }
}

function isPcClient() {
  try {
    const p = wx.getSystemInfoSync()?.platform || '';
    return p === 'windows' || p === 'mac' || p === 'devtools';
  } catch (e) {
    return false;
  }
}

/** 仅未配置 adUnitId 时在开发环境模拟发奖 */
function shouldSimulateRewarded() {
  return AD_ENABLED && !AD_UNITS.rewardedVideo && isDevEnv();
}

function shouldSimulateReviveRewarded() {
  return AD_ENABLED && !AD_UNITS.reviveRewardedVideo && isDevEnv();
}

function isInterstitialDevSimulate() {
  return AD_ENABLED && !AD_UNITS.interstitial && isDevEnv();
}

function canUseRewardedApi() {
  return typeof wx.createRewardedVideoAd === 'function';
}

function canUseInterstitialApi() {
  return typeof wx.createInterstitialAd === 'function';
}

function formatAdError(err) {
  const code = err?.errCode ?? err?.errno ?? err?.code;
  if (code === 1004) return '暂无广告填充，请稍后再试或发布体验版';
  if (code === 1000) return '广告单元无效，请检查 adUnitId 是否与当前小游戏一致';
  if (isPcClient()) return '电脑模拟器无法播放真实广告，请点「预览」用手机微信扫码';
  return '广告加载失败，请稍后重试';
}

/** 随机技能：清零冷却并立即释放 */
export function grantRandomSkill(player) {
  if (!player?.weaponSystem) return '';
  const key = SKILL_KEYS[Math.floor(Math.random() * SKILL_KEYS.length)];
  player.weaponSystem.skillCooldowns[key] = 0;
  player.weaponSystem.useSkill(key);
  return SKILL_CONFIG[key]?.name || key;
}

class AdManager {
  rewardedVideo = null;
  reviveRewardedVideo = null;
  interstitial = null;
  pendingReward = null;
  pendingReviveReward = null;
  interstitialShownThisDeath = false;
  rewardedInited = false;
  reviveRewardedInited = false;
  showing = false;
  showingRevive = false;

  init() {
    if (!AD_ENABLED || isPcClient()) return;
    if (AD_UNITS.rewardedVideo) this.ensureRewarded();
    if (AD_UNITS.reviveRewardedVideo) this.ensureReviveRewarded();
    if (AD_UNITS.interstitial) this.ensureInterstitial();
  }

  ensureRewarded() {
    if (this.rewardedInited || shouldSimulateRewarded()) return;
    if (!AD_UNITS.rewardedVideo || !canUseRewardedApi()) return;

    try {
      this.rewardedVideo = wx.createRewardedVideoAd({ adUnitId: AD_UNITS.rewardedVideo });
      this.rewardedVideo.onLoad(() => {
        console.log('[Ads] rewarded loaded');
      });
      this.rewardedVideo.onError((err) => {
        console.warn('[Ads] rewarded error', err);
        if (this.pendingReward) {
          const fail = this.pendingReward.onFail;
          this.pendingReward = null;
          this.showing = false;
          fail?.(formatAdError(err));
        }
      });
      this.rewardedVideo.onClose((res) => {
        this.showing = false;
        const pending = this.pendingReward;
        this.pendingReward = null;
        if (!pending) return;
        if (res && res.isEnded) {
          pending.onSuccess?.();
        } else {
          pending.onFail?.('需看完广告才能获得奖励');
        }
        this.rewardedVideo?.load?.().catch(() => {});
      });
      this.rewardedInited = true;
      this.rewardedVideo.load().catch((err) => {
        console.warn('[Ads] rewarded preload failed', err);
      });
    } catch (err) {
      console.warn('[Ads] createRewardedVideoAd failed', err);
    }
  }

  ensureReviveRewarded() {
    if (this.reviveRewardedInited || shouldSimulateReviveRewarded()) return;
    if (!AD_UNITS.reviveRewardedVideo || !canUseRewardedApi()) return;

    try {
      this.reviveRewardedVideo = wx.createRewardedVideoAd({
        adUnitId: AD_UNITS.reviveRewardedVideo,
      });
      this.reviveRewardedVideo.onLoad(() => {
        console.log('[Ads] revive rewarded loaded');
      });
      this.reviveRewardedVideo.onError((err) => {
        console.warn('[Ads] revive rewarded error', err);
        if (this.pendingReviveReward) {
          const fail = this.pendingReviveReward.onFail;
          this.pendingReviveReward = null;
          this.showingRevive = false;
          fail?.(formatAdError(err));
        }
      });
      this.reviveRewardedVideo.onClose((res) => {
        this.showingRevive = false;
        const pending = this.pendingReviveReward;
        this.pendingReviveReward = null;
        if (!pending) return;
        if (res && res.isEnded) {
          pending.onSuccess?.();
        } else {
          pending.onFail?.('需看完广告才能获得复活次数');
        }
        this.reviveRewardedVideo?.load?.().catch(() => {});
      });
      this.reviveRewardedInited = true;
      this.reviveRewardedVideo.load().catch((err) => {
        console.warn('[Ads] revive rewarded preload failed', err);
      });
    } catch (err) {
      console.warn('[Ads] createReviveRewardedVideoAd failed', err);
    }
  }

  showReviveRewarded(onSuccess, onFail) {
    if (!AD_ENABLED) {
      onFail?.('广告未启用');
      return;
    }

    if (this.showingRevive) return;

    if (shouldSimulateReviveRewarded()) {
      showToast('开发版模拟复活广告', 2000);
      setTimeout(() => onSuccess?.(), 400);
      return;
    }

    if (isPcClient()) {
      onFail?.('电脑模拟器无法播放真实广告，请点「预览」用手机微信扫码');
      return;
    }

    this.ensureReviveRewarded();
    if (!this.reviveRewardedVideo) {
      onFail?.('当前微信版本不支持激励视频广告');
      return;
    }

    this.pendingReviveReward = { onSuccess, onFail };
    this.showingRevive = true;
    showToast('广告加载中…', 1500);

    const tryShow = () => this.reviveRewardedVideo.show().catch(() => (
      this.reviveRewardedVideo.load().then(() => this.reviveRewardedVideo.show())
    ));

    tryShow().catch((err) => {
      this.pendingReviveReward = null;
      this.showingRevive = false;
      console.warn('[Ads] show revive rewarded failed', err);
      onFail?.(formatAdError(err));
    });
  }

  ensureInterstitial() {
    if (this.interstitial || isInterstitialDevSimulate()) return;
    if (!AD_UNITS.interstitial || !canUseInterstitialApi()) return;

    try {
      this.interstitial = wx.createInterstitialAd({ adUnitId: AD_UNITS.interstitial });
      this.interstitial.onError((err) => console.warn('[Ads] interstitial error', err));
      this.interstitial.load().catch(() => {});
    } catch (err) {
      console.warn('[Ads] createInterstitialAd failed', err);
    }
  }

  showRewarded(onSuccess, onFail) {
    if (!AD_ENABLED) {
      onFail?.('广告未启用');
      return;
    }

    if (this.showing) return;

    if (shouldSimulateRewarded()) {
      showToast('未配置 adUnitId，开发版模拟发奖', 2000);
      setTimeout(() => onSuccess?.(), 400);
      return;
    }

    if (isPcClient()) {
      onFail?.('电脑模拟器无法播放真实广告，请点「预览」用手机微信扫码');
      return;
    }

    this.ensureRewarded();
    if (!this.rewardedVideo) {
      onFail?.('当前微信版本不支持激励视频广告');
      return;
    }

    this.pendingReward = { onSuccess, onFail };
    this.showing = true;
    showToast('广告加载中…', 1500);

    const tryShow = () => this.rewardedVideo.show().catch(() => (
      this.rewardedVideo.load().then(() => this.rewardedVideo.show())
    ));

    tryShow().catch((err) => {
      this.pendingReward = null;
      this.showing = false;
      console.warn('[Ads] show rewarded failed', err);
      onFail?.(formatAdError(err));
    });
  }

  showInterstitial(onFail) {
    if (!AD_ENABLED || isPcClient()) {
      onFail?.('请用手机微信预览');
      return;
    }

    if (isInterstitialDevSimulate()) {
      console.log('[Ads] dev simulate interstitial');
      showToast('开发版模拟插屏广告', 2000);
      return;
    }

    this.ensureInterstitial();
    if (!this.interstitial) {
      onFail?.('当前版本不支持插屏广告');
      return;
    }

    this.interstitial.show().catch(() => (
      this.interstitial.load().then(() => this.interstitial.show())
    )).catch((err) => {
      console.warn('[Ads] interstitial show failed', err);
      onFail?.(formatAdError(err));
    });
  }

  tryShowGameOverInterstitial() {
    const db = GameGlobal.databus;
    if (!db?.isGameOver || this.interstitialShownThisDeath) return;
    if (!db.reviveUsed) return;

    this.interstitialShownThisDeath = true;
    setTimeout(() => this.showInterstitial(), 600);
  }

  showInterstitialThen(callback) {
    this.showInterstitial();
    setTimeout(() => callback?.(), 300);
  }

  resetDeathFlags() {
    this.interstitialShownThisDeath = false;
  }

  showReviveAd() {
    const db = GameGlobal.databus;
    if (!db.canRevive()) {
      showToast('本局复活次数已用完');
      return;
    }

    this.showRewarded(
      () => {
        if (!db.revivePlayer()) return;
        const skillName = grantRandomSkill(db.player);
        showToast(`复活成功 · 获得${skillName}`, 2500);
      },
      (msg) => showToast(msg || '复活失败'),
    );
  }

  showScoreBonusAd() {
    const db = GameGlobal.databus;
    if (!db.gameCleared || db.scoreBonusClaimed) return;

    this.showRewarded(
      () => {
        const added = db.applyScoreBonus(SCORE_BONUS_RATIO);
        if (added > 0) {
          showToast(`积分 +${added}（+50%）`, 2500);
        }
      },
      (msg) => showToast(msg || '领取失败'),
    );
  }

  showRandomSkillAd() {
    const db = GameGlobal.databus;
    if (db.isGameOver || db.gameCleared || db.isPaused) return;

    this.showRewarded(
      () => {
        const skillName = grantRandomSkill(db.player);
        showToast(`获得技能：${skillName}`, 2500);
      },
      (msg) => showToast(msg || '领取失败'),
    );
  }

  /** 暂停弹窗：看激励广告累积 1 次复活 */
  showPauseReviveAd() {
    const db = GameGlobal.databus;
    if (!db.isPaused || db.isGameOver || db.gameCleared) return;

    this.showReviveRewarded(
      () => {
        const count = db.addStoredRevive(1);
        showToast(`获得 1 次复活 · 共 ${count} 次`, 2500);
      },
      (msg) => showToast(msg || '领取失败'),
    );
  }

  useStoredRevive() {
    const db = GameGlobal.databus;
    if (!db.useStoredRevive()) {
      showToast('暂无可用复活次数');
      return;
    }
    showToast(`复活成功 · 剩余 ${db.storedReviveCount} 次`, 2500);
  }

  canShowReviveBtn() {
    return AD_ENABLED && GameGlobal.databus?.canRevive();
  }

  canShowScoreBonusBtn() {
    const db = GameGlobal.databus;
    return AD_ENABLED && db?.gameCleared && !db.scoreBonusClaimed;
  }

  canShowRandomSkillBtn() {
    const db = GameGlobal.databus;
    return AD_ENABLED && !db?.isGameOver && !db?.gameCleared && !db?.isPaused;
  }

  canShowPauseReviveAdBtn() {
    const db = GameGlobal.databus;
    return AD_ENABLED && db?.isPaused && !db?.isGameOver && !db?.gameCleared;
  }

  canShowStoredReviveBtn() {
    const db = GameGlobal.databus;
    return AD_ENABLED && db?.canUseStoredRevive();
  }
}

export default new AdManager();
