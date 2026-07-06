import CONFIG from '../config/game.config';
import { getLevel } from '../config/levels.config';

const MUTE_KEY = 'mirror_twin_mute';

export default class Sfx {
  bgmStarted = false;
  currentBgmKey = '';
  muted = false;
  baseVol = { ...CONFIG.audioVol };

  constructor() {
    const a = CONFIG.assets.audio;
    const v = CONFIG.audioVol;
    this.find = this.create(a.find, false, v.find);
    this.miss = this.create(a.miss, false, v.miss);
    this.bgmTracks = {
      menu: this.create(a.bgmMenu, true, v.bgm),
      warm: this.create(a.bgmWarm, true, v.bgm),
      cool: this.create(a.bgmCool, true, v.bgm),
    };
    this.loadMute();
    this.applyMute();
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

  loadMute() {
    try {
      this.muted = !!wx.getStorageSync(MUTE_KEY);
    } catch {
      this.muted = false;
    }
  }

  saveMute() {
    try {
      wx.setStorageSync(MUTE_KEY, this.muted);
    } catch { /* ignore */ }
  }

  isMuted() {
    return this.muted;
  }

  toggleMute() {
    this.muted = !this.muted;
    this.saveMute();
    this.applyMute();
    return this.muted;
  }

  applyMute() {
    const vol = this.muted ? 0 : 1;
    if (this.find) this.find.volume = this.baseVol.find * vol;
    if (this.miss) this.miss.volume = this.baseVol.miss * vol;
    Object.values(this.bgmTracks).forEach((t) => {
      if (!t) return;
      t.volume = this.baseVol.bgm * vol;
      if (this.muted) {
        try { t.stop(); } catch { /* ignore */ }
      }
    });
    if (!this.muted && this.bgmStarted) this.ensureBgm();
  }

  play(audio) {
    if (!audio || this.muted) return;
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
    if (this.muted) return;
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
}
