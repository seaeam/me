<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'
import SiteHeader from '@/components/site-header/index.vue'
import SiteBackground from '@/components/background/index.vue'
import { site } from '@/lib/site'

const route = useRoute()
useHead({
  htmlAttrs: { lang: 'zh-CN' },
  title: computed(() => route.meta.title ? route.meta.title + ' · ' + site.name : site.name),
})
</script>
<template>
  <a class="skip-link" href="#main">跳到正文</a>
  <SiteHeader />
  <SiteBackground />
  <main id="main" tabindex="-1"><RouterView /></main>
</template>
