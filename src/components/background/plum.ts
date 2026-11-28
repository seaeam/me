// 改编自 Anthony Fu 的 antfu.me ArtPlum.vue（MIT，见 public/licenses/antfu.txt）。
// 每棵树的所有分叉共用一个计数器，包括暂停一帧的枝梢；分开计数会改变树形。
export function startPlum(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  random = Math.random,
) {
  type Step = () => void

  let pending: Step[] = []
  const middle = () => random() * 0.6 + 0.2
  const topDepth = Math.min(height * 0.18, width * 0.18, 120)

  function step(
    x: number,
    y: number,
    angle: number,
    root = { count: 0 },
    stemDepth = 0,
  ) {
    const length = stemDepth > 0 ? 3 + random() * 3 : random() * 6

    root.count++

    const nextX = x + length * Math.cos(angle)
    const nextY = y + length * Math.sin(angle)

    context.beginPath()
    context.moveTo(x, y)
    context.lineTo(nextX, nextY)
    context.stroke()

    if (
      nextX < -100 ||
      nextX > width + 100 ||
      nextY < -100 ||
      nextY > height + 100
    )
      return

    const chance = root.count <= 30 ? 0.8 : 0.5
    const keepStem = stemDepth > 0 && nextY < stemDepth
    // 顶枝先在画面里分出一长一短两枝，随后沿用普通枝梢的随机分叉。
    const firstFork = keepStem && y < 18 && nextY >= 18
    const turn = ((keepStem && random() < 0.5 ? -1 : 1) * Math.PI) / 12
    const spread = firstFork ? 2 : 0
    const primary = angle + (spread + random()) * turn
    const side = angle - (spread + random()) * turn

    if (keepStem) {
      const inward = Math.max(Math.PI / 4, Math.min((3 * Math.PI) / 4, primary))
      const grow = () => step(nextX, nextY, inward, root, stemDepth)

      if (nextY < 18) grow()
      else pending.push(grow)
    } else if (random() < chance) {
      pending.push(() => step(nextX, nextY, primary, root))
    }
    if (firstFork || random() < (keepStem ? 0.3 : chance)) {
      pending.push(() =>
        step(nextX, nextY, side, root, firstFork ? stemDepth * 0.65 : 0),
      )
    }
  }

  context.lineWidth = 1
  context.strokeStyle = '#88888825'
  step(middle() * width, 0, Math.PI / 2, { count: 0 }, topDepth)
  pending.push(() => step(middle() * width, height + 5, -Math.PI / 2))
  if (width >= 500) {
    pending.push(() => step(-5, middle() * height, 0))
    pending.push(() => step(width + 5, middle() * height, Math.PI))
  }

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
