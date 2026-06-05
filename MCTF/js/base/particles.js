export default class Particles {
  list = []

  burst(x, y, color = '#FFD700', count = 8) {
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count
      this.list.push({
        x, y,
        vx: Math.cos(angle) * (1.5 + Math.random() * 2),
        vy: Math.sin(angle) * (1.5 + Math.random() * 2),
        life: 18 + Math.random() * 10,
        color,
        size: 2 + Math.random() * 3,
      })
    }
  }

  update() {
    this.list = this.list.filter((p) => {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.08
      p.life -= 1
      return p.life > 0
    })
  }

  render(ctx) {
    this.list.forEach((p) => {
      ctx.globalAlpha = Math.min(1, p.life / 20)
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.globalAlpha = 1
  }
}
