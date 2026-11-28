<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { createNoise3D } from 'simplex-noise'

// 网格、动效和透明度参考 antfu.me 的 ArtDots（MIT）。
const surface = ref<HTMLCanvasElement>()
let dispose: (() => void) | undefined

onMounted(() => {
  const canvas = surface.value!
  const context = canvas.getContext('2d')

  if (!context) return

  const noise = createNoise3D()
  const motion = matchMedia('(prefers-reduced-motion: reduce)')
  const points: { x: number; y: number; alpha: number }[] = []
  let frame = 0

  function paint() {
    cancelAnimationFrame(frame)
    context!.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)

    const time = Date.now() / 10000

    context!.fillStyle = '#ccc'
    for (const point of points) {
      const angle =
        (noise(point.x / 200, point.y / 200, time) - 0.5) * 2 * Math.PI

      const distance = (noise(point.x / 200, point.y / 200, time * 2) + 0.5) * 5

      context!.globalAlpha =
        (Math.abs(Math.cos(angle)) * 0.8 + 0.2) * point.alpha
      context!.beginPath()
      context!.arc(
        point.x + Math.cos(angle) * distance,
        point.y + Math.sin(angle) * distance,
        1,
        0,
        Math.PI * 2,
      )
      context!.fill()
    }

    if (!motion.matches && !document.hidden)
      frame = requestAnimationFrame(paint)
  }

  function resize() {
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    const pixelRatio = window.devicePixelRatio || 1

    canvas.width = Math.round(width * pixelRatio)
    canvas.height = Math.round(height * pixelRatio)
    context!.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    points.length = 0
    for (let x = -7.5; x < width + 15; x += 15) {
      for (let y = -7.5; y < height + 15; y += 15) {
        points.push({ x, y, alpha: 0.5 + Math.random() * 0.5 })
      }
    }

    paint()
  }

  const observer = new ResizeObserver(resize)

  observer.observe(canvas)
  motion.addEventListener('change', paint)
  document.addEventListener('visibilitychange', paint)
  dispose = () => {
    observer.disconnect()
    motion.removeEventListener('change', paint)
    document.removeEventListener('visibilitychange', paint)
    cancelAnimationFrame(frame)
  }
})
onUnmounted(() => dispose?.())
</script>
<template>
  <canvas ref="surface" aria-hidden="true" class="dot-field" />
</template>
