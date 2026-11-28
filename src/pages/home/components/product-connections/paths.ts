export function twoColumnProductTree(
  origin: DOMRect,
  badge: DOMRect,
  list: DOMRect,
  products: DOMRect[],
) {
  const center = list.left + list.width / 2 - origin.left
  const top = badge.bottom - origin.top

  const rows = products
    .filter((_, index) => index % 2 === 0)
    .map((box) => box.top + box.height / 2 - origin.top)

  const bottom = rows[rows.length - 1]

  return {
    stem: `M ${center} ${top} V ${bottom}`,
    rails: [],
    branches: products.map((box, index) => {
      const y = rows[Math.floor(index / 2)]
      const edge = index % 2 === 0 ? box.right + 5 : box.left - 5

      return {
        path: `M ${center} ${y} H ${edge - origin.left}`,
        progress: (y - top) / (bottom - top),
      }
    }),
  }
}

export function productTree(origin: DOMRect, badge: DOMRect, icons: DOMRect[]) {
  const root = {
    x: badge.left + badge.width / 2 - origin.left,
    y: badge.bottom - origin.top,
  }

  const rowTop = icons[0].top - origin.top - 5
  const railY = (root.y + rowTop) / 2

  const turns = icons.map((icon) => {
    const x = icon.left + icon.width / 2 - origin.left
    const y = icon.top - origin.top - 5
    const offset = x - root.x
    const radius = Math.min(9, Math.abs(offset), Math.max(0, (y - railY) / 2))
    const start = x - Math.sign(offset) * radius

    return {
      start,
      path: `M ${start} ${railY} Q ${x} ${railY}, ${x} ${railY + radius} V ${y}`,
    }
  })

  const starts = turns.map(({ start }) => start)
  const left = Math.min(root.x, ...starts)
  const right = Math.max(root.x, ...starts)

  return {
    stem: `M ${root.x} ${root.y} V ${railY}`,
    rails: [left, right].map((end) => `M ${root.x} ${railY} H ${end}`),
    branches: turns.map(({ start, path }) => {
      const end = start < root.x ? left : right
      const progress = end === root.x ? 0 : (start - root.x) / (end - root.x)

      return { path, progress }
    }),
  }
}
