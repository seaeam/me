<script setup lang="ts">
import home from '@content/home.md'
import { vContentLinks } from '@/lib/content-links'
import { site } from '@/lib/site'
</script>

<template>
  <article class="reading-column">
    <h1 class="slide-enter">{{ site.name }}</h1>
    <div v-content-links class="prose home-copy" v-html="home.html" />
  </article>
</template>

<style>
.home-copy > :nth-child(1) {
  --stage: 1;
}
.home-copy > :nth-child(2) {
  --stage: 2;
}
.home-copy > :nth-child(3) {
  --stage: 3;
}
.home-copy p {
  line-height: 1.95;
}
.home-copy a:has(> img) {
  display: inline-flex;
  align-items: center;
  gap: 0.3em;
  padding: 0.08em 0.42em;
  border: 0;
  border-radius: 0.28em;
  background: #8882;
  color: var(--prose);
  font-size: 0.95em;
  line-height: 1.55;
  vertical-align: -0.12em;
  white-space: nowrap;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}
.home-copy a:has(> img):is(:hover, :focus-visible) {
  background: #8883;
  color: var(--heading);
}
.home-copy a > img {
  width: 1.1em;
  height: 1.1em;
  border-radius: 0.18em;
  object-fit: contain;
}
.home-copy img[src$='/converge.png'],
.home-copy img[src$='/mediastorm.svg'] {
  filter: var(--dot-filter);
}
@media (max-width: 480px) {
  .home-copy a:has(> img) {
    font-size: 0.875em;
    padding-inline: 0.3em;
    gap: 0.2em;
  }
}
</style>
