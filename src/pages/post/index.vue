<script setup lang="ts">
import type { Article } from '@/features/posts'
import MarkdownBody from '@/components/markdown-body.vue'

defineProps<{ post: Article }>()
</script>

<template>
  <article class="reading-column">
    <h1>{{ post.title }}</h1>
    <time :datetime="post.date">{{ post.date.slice(0, 10) }}</time>
    <MarkdownBody :content="post" />
  </article>
</template>
