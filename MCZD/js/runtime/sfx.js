import CONFIG from '../config/game.config';
import { getLevel } from '../config/levels.config';

export default class Sfx {
  bgmStarted = false;
  currentBgmKey = '';

  constructor() {
    const a = CONFIG.assets.audio;
    const v = CONFIG.audioVol;
    this.find = this.create(a.find, false, v.find);
    this.miss = this.create(a.miss, false, v.miss);
    this.bgmTracks = {
      menu: this.create(a.bgmMenu, true, v.bgm),
      warm: this.create(a.bgmWarm, true, v.bgm),
    };
  }

  create(src, loop, volume) {
    try {
      const audio = wx.createInnerAudioContext();
      audio.src = src;
      audio.loop = loop;
      audio.volume = volume;
      return audio;
    } catch {
      return null;
    }
  }

  play(audio) {
    if (!audio) return;
    try {
      audio.stop();
      audio.play();
    } catch { /* ignore */ }
  }

  getBgmKey() {
    const db = GameGlobal.databus;
    if (db.scene === 'menu') return 'menu';
    return getLevel(db.levelId).bgm || 'warm';
  }

  ensureBgm() {
    const key = this.getBgmKey();
    if (!this.bgmStarted) this.bgmStarted = true;
    if (this.currentBgmKey === key) {
      const track = this.bgmTracks[key];
      if (track) try { track.play(); } catch { /* ignore */ }
      return;
    }
    Object.values(this.bgmTracks).forEach((t) => { try { t?.stop(); } catch { /* ignore */ } });
    this.currentBgmKey = key;
    const track = this.bgmTracks[key];
    if (track) try { track.play(); } catch { /* ignore */ }
  }

  refreshBgm() {
    this.currentBgmKey = '';
    if (this.bgmStarted) this.ensureBgm();
  }

  playFind() { this.play(this.find); }
  playMiss() { this.play(this.miss); }
  playClear() { this.play(this.find); }
}
