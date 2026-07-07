/**
 * 流量主广告位配置
 * 路径：微信公众平台 → 流量主 → 广告管理 → 新建广告位
 * 将 adunit-xxxx 填入下方
 * 注意：真实广告只能在手机微信中播放，电脑开发者工具模拟器无法展示
 */

/** 是否启用广告（关闭后所有广告入口隐藏） */
export const AD_ENABLED = true;

export const AD_UNITS = {
  /** 激励视频：复活 / 通关加分 / 暂停随机技能 */
  rewardedVideo: 'adunit-75603c3f5807e330',
  /** 插屏：游戏结束（已用过复活或点重新开始时） */
  interstitial: '',
};

/** 通关看广告积分加成比例 */
export const SCORE_BONUS_RATIO = 0.5;
