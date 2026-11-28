import { expect, it, vi } from 'vitest'
import { startPlum } from '../plum'

it.each([360, 800])(
  '按 %i 像素画布宽度选择生长边缘，并在最后一帧停止',
  (width) => {
    const context = {
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
    }

    const height = 400

    const advance = startPlum(
      context as unknown as CanvasRenderingContext2D,
      width,
      height,
      () => 0.99,
    )

    let frames = 0

    while (advance() && frames < 100) frames++

    const starts = context.moveTo.mock.calls

    expect(frames).toBeLessThan(100)
    expect(starts.some(([, y]) => y === 0)).toBe(true)
    expect(starts.some(([, y]) => y > height)).toBe(true)
    expect(starts.some(([x]) => x < 0)).toBe(width >= 500)
    expect(starts.some(([x]) => x > width)).toBe(width >= 500)

    const segments = starts.length

    expect(advance()).toBe(false)
    expect(context.moveTo).toHaveBeenCalledTimes(segments)
  },
)
