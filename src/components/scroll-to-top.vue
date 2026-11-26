<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const visible = ref(false)

function updateVisibility() {
  visible.value = window.scrollY > 300
}

function scrollToTop() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'instant' : 'smooth' })
}

onMounted(() => {
  updateVisibility()
  window.addEventListener('scroll', updateVisibility, { passive: true })
})
onUnmounted(() => window.removeEventListener('scroll', updateVisibility))
</script>

<template>
  <button
    type="button"
    class="scroll-to-top"
    title="Scroll to top"
    aria-label="返回顶部"
    :disabled="!visible"
    @click="scrollToTop"
  >
    <i class="i-ri-arrow-up-line" aria-hidden="true" />
  </button>
</template>

<style scoped>
.scroll-to-top {
  position: fixed;
  z-index: 100;
  right: .75rem;
  bottom: .75rem;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  opacity: .3;
  transition: opacity .3s cubic-bezier(.4, 0, .2, 1), background-color .3s cubic-bezier(.4, 0, .2, 1);
}
.scroll-to-top:enabled:is(:hover, :focus-visible) {
  background-color: #8883;
  opacity: 1;
}
.scroll-to-top:disabled {
  opacity: 0;
  pointer-events: none;
}
@media (prefers-reduced-motion: reduce) {
  .scroll-to-top { transition: none; }
}
@media print {
  .scroll-to-top { display: none; }
}
</style>
