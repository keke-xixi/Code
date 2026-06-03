let instance;

/**
 * 音效管理（音频文件缺失时静默跳过）
 */
export default class Music {
  constructor() {
    if (instance) return instance;
    instance = this;

    this.bgmAudio = this.createAudio('audio/bgm.mp3', true);
    this.shootAudio = this.createAudio('audio/bullet.mp3');
    this.boomAudio = this.createAudio('audio/boom.mp3');
  }

  createAudio(src, loop = false) {
    try {
      const audio = wx.createInnerAudioContext();
      audio.src = src;
      audio.loop = loop;
      if (loop) audio.autoplay = true;
      audio.onError(() => {});
      return audio;
    } catch (e) {
      return null;
    }
  }

  playShoot() {
    if (!this.shootAudio) return;
    this.shootAudio.currentTime = 0;
    this.shootAudio.play();
  }

  playExplosion() {
    if (!this.boomAudio) return;
    this.boomAudio.currentTime = 0;
    this.boomAudio.play();
  }
}
