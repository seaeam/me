<script setup lang="ts">
function toggleTheme(event: MouseEvent) {
  const root = document.documentElement

  const dark = root.dataset.theme
    ? root.dataset.theme === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches

  const apply = () => {
    root.dataset.theme = dark ? 'light' : 'dark'
    try {
      localStorage.setItem('mc-theme', root.dataset.theme)
    } catch {
      // 浏览器禁用存储时，主题仍在当前页面生效。
    }
  }

  if (
    !document.startViewTransition ||
    matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    if (!document.startViewTransition) root.classList.add('theme-fade')

    apply()

    return
  }

  const box = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const x = event.detail ? event.clientX : box.x + box.width / 2
  const y = event.detail ? event.clientY : box.y + box.height / 2

  const radius = Math.hypot(
    Math.max(x, innerWidth - x),
    Math.max(y, innerHeight - y),
  )

  const center = `at ${x}px ${y}px`
  const closed = `circle(0px ${center})`
  const open = `circle(${radius}px ${center})`

  document.startViewTransition(() => {
    root.style.setProperty('--theme-clip-from', dark ? closed : open)
    root.style.setProperty('--theme-clip-to', dark ? open : closed)
    apply()
  })
}
</script>
<template>
  <button
    type="button"
    class="theme-toggle nav-link"
    aria-label="切换明暗主题"
    title="切换明暗主题"
    @click="toggleTheme">
    <i class="sun i-ri-sun-line" aria-hidden="true" /><i
      class="moon i-ri-moon-line"
      aria-hidden="true" />
  </button>
</template>
