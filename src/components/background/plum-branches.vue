<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { startPlum } from './plum'

const surface = ref<HTMLCanvasElement>()
let dispose: (() => void) | undefined

onMounted(() => {
  const canvas = surface.value!
  const context = canvas.getContext('2d')

  if (!context) return

  const motion = matchMedia('(prefers-reduced-motion: reduce)')

  const touchViewport =
    navigator.maxTouchPoints > 0 || matchMedia('(any-pointer: coarse)').matches

  let frame = 0
  let lastSize = ''

  function fit() {
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    if (!width || !height) return

    const pixelRatio = window.devicePixelRatio || 1

    // 手机工具栏伸缩会连续改变高度。保留已有位图和正在生长的枝梢，转屏改变宽度时再适配。
    const size = [
      width,
      touchViewport ? null : height,
      pixelRatio,
      motion.matches,
    ].join('/')

    if (size === lastSize) return

    lastSize = size
    cancelAnimationFrame(frame)
    canvas.width = Math.round(width * pixelRatio)
    canvas.height = Math.round(height * pixelRatio)
    context!.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

    const advance = startPlum(context!, width, height)
    let lastFrameTime = performance.now()

    // 偏好减少动态效果时，等整棵树画完再显示，避免逐帧展示生长过程。
    canvas.style.visibility = motion.matches ? 'hidden' : 'visible'

    function tick(now: number) {
      if (motion.matches) {
        const deadline = performance.now() + 7

        do {
          if (!advance()) {
            canvas.style.visibility = 'visible'

            return
          }
        } while (performance.now() < deadline)
      } else if (now - lastFrameTime >= 1000 / 40) {
        lastFrameTime = now
        if (!advance()) return
      }

      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
  }

  const observer = new ResizeObserver(fit)

  observer.observe(canvas)
  fit()
  motion.addEventListener('change', fit)
  dispose = () => {
    observer.disconnect()
    motion.removeEventListener('change', fit)
    cancelAnimationFrame(frame)
  }
})
onUnmounted(() => dispose?.())
</script>

<template>
  <canvas ref="surface" aria-hidden="true" class="plum-canvas" />
</template>
