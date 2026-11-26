<script setup lang="ts">
import { posts } from '@/features/posts'
import { postPath, sections } from '@/router/sections'

const dateFormat = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', timeZone: 'UTC' })
</script>
<template>
  <section class="reading-column">
    <h1>{{ sections.posts.label }}</h1>
    <template v-for="(post, index) in posts" :key="post.slug">
      <div v-if="post.date.slice(0, 4) !== posts[index - 1]?.date.slice(0, 4)" class="year-label slide-enter" :style="{ '--stage': index - 2, '--step': '60ms' }">
        <span>{{ post.date.slice(0, 4) }}</span>
      </div>
      <div class="slide-enter" :style="{ '--stage': index, '--step': '60ms' }">
        <RouterLink class="post-link" :to="postPath(post.slug)">
          <span class="post-title">{{ post.title }}</span><time :datetime="post.date">{{ dateFormat.format(new Date(post.date)) }}</time>
          <span v-if="post.duration" class="duration">· {{ post.duration }}</span>
        </RouterLink>
      </div>
    </template>
  </section>
</template>

<style>
.year-label { position: relative; height: 5rem; pointer-events: none; user-select: none; }
.year-label span { position: absolute; left: -3rem; top: -2rem; font-size: 8em; font-weight: 700; color: transparent; opacity: .1; -webkit-text-stroke: 2px #aaa; }
.post-link { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem; margin: .5rem 0 1.5rem; color: var(--heading); opacity: .6; text-decoration: none; transition: opacity .2s ease-out; }
.post-link:hover { opacity: 1; }
.post-link .post-title { font-size: 1.125rem; line-height: 1.2; }
.post-link .duration { font-size: .875rem; opacity: .4; }
@media (max-width: 767.98px) { .post-link { align-items: flex-start; flex-direction: column; } }
</style>
