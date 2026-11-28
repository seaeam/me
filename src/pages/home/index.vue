<script setup lang="ts">
import home from '@content/home.md?live-issues'
import MarkdownBody from '@/components/markdown-body/index.vue'
import { site } from '@/lib/site'
import ProductConnections from './components/product-connections/index.vue'
</script>

<template>
  <article class="home-page reading-column">
    <h1 class="slide-enter">{{ site.name }}</h1>
    <MarkdownBody :content="home" live-issues />
    <ProductConnections />
  </article>
</template>

<style>
.home-page {
  position: relative;
}
:where(.home-page) .markdown-section > :nth-child(1) {
  --stage: 1;
}
:where(.home-page) .markdown-section > :nth-child(2) {
  --stage: 2;
}
:where(.home-page) .markdown-section > :nth-child(3) {
  --stage: 3;
}
:where(.home-page) .markdown-section p {
  line-height: 1.95;
}
:where(.home-page) .markdown-section .home-label {
  white-space: nowrap;
}
:where(.home-page) .markdown-section .home-label i {
  width: 1.1em;
  height: 1.1em;
  margin-inline-end: 0.4em;
  vertical-align: -0.15em;
  opacity: 0.8;
}
:where(.home-page) .markdown-section ul:has(> li > .home-label) {
  display: grid;
  gap: 0.35rem;
  padding: 0;
  list-style: none;
}
:where(.home-page) .markdown-section li:has(> .home-label) {
  display: grid;
  grid-template-columns: 5.25rem minmax(0, 1fr);
  column-gap: 0.5rem;
  margin: 0;
  word-break: keep-all;
}
:where(.home-page) .markdown-section img[src$='/converge.png'],
:where(.home-page) .markdown-section img[src$='/mediastorm.svg'],
:where(.home-page) .markdown-section img[src$='/covey.png'],
:where(.home-page) .markdown-section img[src^='/media/social/'][src$='.svg'] {
  filter: var(--dot-filter);
}
:where(.home-page) .markdown-section ul:has(img) {
  padding: 0;
  list-style: none;
}
:where(.home-page) .markdown-section ul:has(img) > li {
  margin: 0;
}
:where(.home-page) .markdown-section ul:has(img[src^='/media/products/']) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem;
  margin-block: 1rem 1.65rem;
}
:where(.home-page) .markdown-section a:has(img[src^='/media/products/']) {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  gap: 0.55em;
  padding-inline: clamp(0.4rem, 1.5vw, 1.25rem);
  border: 0;
  border-radius: 6px;
  color: var(--heading);
  font-size: 1rem;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  opacity: 0.6;
  transition:
    opacity 0.2s ease-out,
    background-color 0.2s ease-out;
}
:where(.home-page) .markdown-section img[src^='/media/products/'] {
  width: 1.4em;
  height: 1.4em;
  flex: none;
  object-fit: contain;
}
:where(.home-page)
  .markdown-section
  a:has(img[src^='/media/products/']):is(:hover, :focus-visible) {
  background-color: #8881;
  opacity: 1;
}
@media (prefers-reduced-motion: reduce) {
  :where(.home-page) .markdown-section a:has(img[src^='/media/products/']) {
    transition: none;
  }
}
:where(.home-page) .markdown-section h2 {
  margin: 2.1rem 0 0.55rem;
  color: var(--prose);
  font-size: 1rem;
  font-weight: 500;
}
:where(.home-page) .markdown-section ul:has(img[src^='/media/social/']) {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  margin: 0;
}
:where(.home-page) .markdown-section a:has(img[src^='/media/social/']) {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding-block: 0.15rem;
}
:where(.home-page) .markdown-section img[src^='/media/social/'] {
  width: 1.05rem;
  height: 1.05rem;
  object-fit: contain;
}
@media (max-width: 480px) {
  :where(.home-page) .markdown-section a:has(img[src^='/media/products/']) {
    gap: 0.3em;
    padding-inline: 0.25rem;
    font-size: 0.875rem;
  }
}
@media (max-width: 22rem) {
  :where(.home-page) .markdown-section ul:has(img[src^='/media/products/']) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  :where(.home-page) .markdown-section a:has(img[src^='/media/products/']) {
    width: 100%;
  }
}
</style>
