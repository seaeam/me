// 改编自 Anthony Fu 的 antfu.me ArtPlum.vue（MIT，见 public/licenses/antfu.txt）。
// 每棵树的所有分叉共用一个计数器，包括暂停一帧的枝梢；分开计数会改变树形。
export function startPlum(ctx: CanvasRenderingContext2D, width: number, height: number, random = Math.random) {
  type Step = () => void
  const middle = () => random() * 0.6 + 0.2
  function step(x: number, y: number, angle: number, root = { count: 0 }) {
    const length = random() * 6
    root.count++
    const nx = x + length * Math.cos(angle)
    const ny = y + length * Math.sin(angle)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(nx, ny)
    ctx.stroke()

    const left = angle + random() * (Math.PI / 12)
    const right = angle - random() * (Math.PI / 12)
    if (nx < -100 || nx > width + 100 || ny < -100 || ny > height + 100) return

    const chance = root.count <= 30 ? 0.8 : 0.5
    if (random() < chance) pending.push(() => step(nx, ny, left, root))
    if (random() < chance) pending.push(() => step(nx, ny, right, root))
  }
  let pending: Step[] = [
    () => step(middle() * width, -5, Math.PI / 2),
    () => step(middle() * width, height + 5, -Math.PI / 2),
    () => step(-5, middle() * height, 0),
    () => step(width + 5, middle() * height, Math.PI),
  ]
  if (width < 500) pending = pending.slice(0, 2)
  ctx.lineWidth = 1
  ctx.strokeStyle = '#88888825'

  return () => {
    const previous = pending
    pending = []
    for (const tip of previous) {
      if (random() < 0.5) pending.push(tip)
      else tip()
    }
    return pending.length > 0
  }
}
