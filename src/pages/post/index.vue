<script setup lang="ts">
import type { Article } from '@/features/posts'
import { vContentLinks } from '@/lib/content-links'
defineProps<{ post: Article }>()
</script>
<template>
  <article class="reading-column">
    <h1>{{ post.title }}</h1>
    <time :datetime="post.date">{{ post.date.slice(0, 10) }}</time>
    <div v-content-links class="prose" v-html="post.html" />
  </article>
</template>
