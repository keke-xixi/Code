import CONFIG from '../config/game.config'

export default class Music {
  bgm = null
  muted = false

  constructor() {
    const a = CONFIG.assets.audio
    this.bgm = this.create(a.bgm, true, 0.35)
    this.shoot = this.create(a.shoot, false, 0.5)
    this.hit = this.create(a.hit, false, 0.6)
    this.build = this.create(a.build, false, 0.7)
    this.upgrade = this.create(a.upgrade, false, 0.7)
    this.invade = this.create(a.invade || a.hit, false, 0.85)
    if (this.bgm) {
      this.bgm.play()
    }
  }

  create(src, loop, volume) {
    try {
      const audio = wx.createInnerAudioContext()
      audio.src = src
      audio.loop = loop
      audio.volume = volume
      return audio
    } catch {
      return null
    }
  }

  play(audio) {
    if (this.muted || !audio) return
    try {
      audio.stop()
      audio.play()
    } catch { /* ignore */ }
  }

  playShoot() { this.play(this.shoot) }
  playHit() { this.play(this.hit) }
  playBuild() { this.play(this.build) }
  playUpgrade() { this.play(this.upgrade) }
  playInvade() { this.play(this.invade) }
}
