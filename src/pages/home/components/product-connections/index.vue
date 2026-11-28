<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import { productTree, twoColumnProductTree } from './paths'

const overlay = useTemplateRef('overlay')
const tree = ref<ReturnType<typeof productTree>>()
let observer: ResizeObserver | undefined

onMounted(async () => {
  const svg = overlay.value!
  const page = svg.parentElement!
  const company = page.querySelector('p a:has(img[src$="/converge.png"])')
  const products = page.querySelectorAll('li a img[src^="/media/products/"]')

  if (!company || !products.length) return

  const row = products[0].closest('ul')!

  const entrances = [company.closest('p')!, row].flatMap((element) =>
    element.getAnimations().map((animation) => animation.finished),
  )

  await Promise.allSettled(entrances)

  if (!overlay.value) return

  const links = Array.from(products, (icon) => icon.closest('a')!)

  const draw = () => {
    const origin = svg.getBoundingClientRect()
    const badge = company.getBoundingClientRect()
    const icons = Array.from(products, (icon) => icon.getBoundingClientRect())
    const columns = icons.findIndex((icon) => icon.top > icons[0].bottom)

    if (columns === 2) {
      // 窄屏链接占满网格列，分支端点应取图标和文字的实际边缘。
      const range = document.createRange()

      const labels = links.map((link) => {
        range.selectNodeContents(link)

        return range.getBoundingClientRect()
      })

      tree.value = twoColumnProductTree(
        origin,
        badge,
        row.getBoundingClientRect(),
        labels,
      )
    } else {
      tree.value = productTree(origin, badge, icons)
    }
  }

  draw()
  observer = new ResizeObserver(draw)
  observer.observe(page)
  observer.observe(company)
  observer.observe(row)
  for (const link of links) observer.observe(link)
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <svg
    ref="overlay"
    class="product-connections"
    aria-hidden="true"
    focusable="false">
    <g v-if="tree" :class="{ vertical: !tree.rails.length }">
      <path class="stem" pathLength="1" :d="tree.stem" />
      <path
        v-for="(rail, index) in tree.rails"
        :key="'rail-' + index"
        class="rail"
        pathLength="1"
        :d="rail" />
      <path
        v-for="(branch, index) in tree.branches"
        :key="'branch-' + index"
        class="branch"
        pathLength="1"
        :d="branch.path"
        :style="{ '--progress': branch.progress }" />
    </g>
  </svg>
</template>

<style scoped>
.product-connections {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  fill: none;
  stroke: var(--prose);
  opacity: 0.48;
  stroke-width: 1.15;
  stroke-linecap: round;
}
@media (prefers-reduced-motion: no-preference) {
  .product-connections {
    --stem-time: 140ms;
    --rail-time: 380ms;
  }
  path {
    stroke-dasharray: 1;
    animation: draw-connection var(--stem-time) linear both;
  }
  .rail {
    animation-duration: var(--rail-time);
    animation-delay: var(--stem-time);
  }
  .branch {
    animation-duration: 200ms;
    animation-delay: calc(
      var(--stem-time) + var(--progress) * var(--rail-time)
    );
    animation-timing-function: ease-out;
  }
  .vertical .stem {
    animation-duration: var(--rail-time);
  }
  .vertical .branch {
    animation-delay: calc(var(--progress) * var(--rail-time));
  }
}
@keyframes draw-connection {
  from {
    stroke-dashoffset: 1;
    opacity: 0;
  }
  1% {
    opacity: 1;
  }
  to {
    stroke-dashoffset: 0;
  }
}
</style>
