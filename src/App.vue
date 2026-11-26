<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'
import SiteHeader from '@/components/site-header/index.vue'
import ScrollToTop from '@/components/scroll-to-top.vue'
import SiteBackground from '@/components/background/index.vue'
import { site } from '@/lib/site'

const route = useRoute()
useHead({
  htmlAttrs: { lang: 'zh-CN' },
  title: computed(() =>
    route.meta.title ? route.meta.title + ' · ' + site.name : site.name,
  ),
})
</script>
<template>
  <a class="skip-link" href="#main">跳到正文</a>
  <SiteHeader />
  <SiteBackground />
  <main id="main" tabindex="-1"><RouterView /></main>
  <footer class="site-footer">
    <p class="reading-column">
      <small
        ><a
          href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
          rel="license noopener"
          target="_blank"
          >CC BY-NC-SA 4.0</a
        >
        2026-PRESENT © {{ site.name }}</small
      >
    </p>
  </footer>
  <ScrollToTop />
</template>

<style scoped>
.site-footer {
  position: relative;
  margin-top: auto;
  padding: 0 1.75rem 2rem;
}
.site-footer small {
  color: color-mix(in srgb, var(--prose) 52%, var(--paper));
  font-size: 0.875rem;
}
.site-footer a {
  text-decoration-color: #8885;
  text-underline-offset: 0.2em;
}
.site-footer a:is(:hover, :focus-visible) {
  color: var(--prose);
  text-decoration-color: currentColor;
}
</style>
