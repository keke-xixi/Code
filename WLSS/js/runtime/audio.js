import CONFIG from '../config/game.config';

export default class AudioMgr {
  constructor() {
    const a = CONFIG.assets.audio;
    this.bgm = this.create(a.bgm, true, 0.28);
    this.absorb = this.create(a.absorb, false, 0.55);
    this.die = this.create(a.die, false, 0.65);
    this.win = this.create(a.win, false, 0.7);
    if (this.bgm) this.bgm.play();
  }

  create(src, loop, volume) {
    try {
      const audio = wx.createInnerAudioContext();
      audio.src = src;
      audio.loop = loop;
      audio.volume = volume;
      return audio;
    } catch (e) {
      return null;
    }
  }

  play(audio) {
    if (!audio) return;
    try {
      audio.stop();
      audio.play();
    } catch (e) { /* ignore */ }
  }

  playAbsorb() { this.play(this.absorb); }
  playDie() { this.play(this.die); }
  playWin() { this.play(this.win); }
}
