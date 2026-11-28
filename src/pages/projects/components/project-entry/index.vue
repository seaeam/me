<script setup lang="ts">
import { vContentLinks } from '@/directives/content-links'
import type { Project } from '../../types'

defineProps<{ project: Project }>()
</script>

<template>
  <component
    :is="project.url ? 'a' : 'article'"
    v-content-links="project.url"
    :href="project.url || undefined"
    class="project-entry">
    <span v-if="project.icon" class="project-icon" aria-hidden="true">
      <img
        :src="project.icon"
        :class="{ 'icon-light': project.iconDark }"
        alt=""
        width="36"
        height="36" />
      <img
        v-if="project.iconDark"
        :src="project.iconDark"
        class="icon-dark"
        alt=""
        width="36"
        height="36" />
    </span>
    <div>
      <h3>{{ project.name }}</h3>
      <p v-if="project.description">{{ project.description }}</p>
    </div>
  </component>
</template>

<style scoped>
.project-entry {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  min-width: 0;
  padding: 0.5rem 0.875rem 0.875rem;
  border-radius: 6px;
  color: inherit;
  text-decoration: none;
  opacity: 0.6;
  transition:
    opacity 0.2s ease-out,
    background-color 0.2s ease-out;
}
a.project-entry:is(:hover, :focus-visible) {
  background: #8881;
  opacity: 1;
}
.project-icon {
  display: grid;
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
}
.project-icon img {
  grid-area: 1 / 1;
  display: block;
  object-fit: contain;
}
.project-icon .icon-light {
  display: var(--light-only);
}
.project-icon .icon-dark {
  display: var(--dark-only);
}
.project-entry h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 400;
  line-height: 1.5;
}
.project-entry p {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.25rem;
  opacity: 0.5;
}
@media (prefers-reduced-motion: reduce) {
  .project-entry {
    transition: none;
  }
}
</style>
