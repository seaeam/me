<script setup lang="ts">
import projectData from '@content/projects.json'
import { vContentLinks } from '@/lib/content-links'
import { site } from '@/lib/site'
import ProjectContents from './project-contents.vue'

type Project = {
  name: string
  group?: string
  description?: string
  icon?: string
  iconDark?: string
  url?: string
}
const projects: Project[] = projectData
const groups = new Map<string, { id: string; name: string; projects: Project[] }>()
const ids = new Set<string>()
for (const project of projects) {
  const name = project.group?.trim() || 'Current Focus'
  let group = groups.get(name)
  if (!group) {
    const slug = name.toLowerCase().match(/[\p{L}\p{N}]+/gu)?.join('-') || 'group'
    const base = name === 'Current Focus' ? 'current-focus' : 'projects-' + slug
    let id = base
    for (let suffix = 2; ids.has(id); suffix++) id = base + '-' + suffix
    ids.add(id)
    group = { id, name, projects: [] }
    groups.set(name, group)
  }
  group.projects.push(project)
}
const projectGroups = [...groups.values()]
</script>

<template>
  <article class="project-page">
    <header class="project-intro">
      <h1 class="slide-enter">{{ site.projectsLabel }}</h1>
      <p v-if="site.projectsIntro">{{ site.projectsIntro }}</p>
      <a
        v-if="site.github"
        v-content-links="site.github"
        :href="site.github"
        class="github-button group">
        <i class="i-ph-github-logo-duotone group-hover:i-ph-github-logo-fill group-focus-visible:i-ph-github-logo-fill" aria-hidden="true" />
        GitHub
      </a>
      <hr>
    </header>

    <ProjectContents v-if="projectGroups.length" :groups="projectGroups" />
    <section v-for="group in projectGroups" :key="group.id" class="focus-section slide-enter" :aria-labelledby="group.id">
      <h2 :id="group.id">{{ group.name.replace(/\s+/g, '\n') }}</h2>
      <div class="project-grid">
        <component
          :is="project.url ? 'a' : 'article'"
          v-for="project in group.projects"
          :key="project.name"
          v-content-links="project.url"
          :href="project.url || undefined"
          class="project-entry">
          <span v-if="project.icon" class="project-icon" aria-hidden="true">
            <img :src="project.icon" :class="{ 'icon-light': project.iconDark }" alt="" width="36" height="36">
            <img v-if="project.iconDark" :src="project.iconDark" class="icon-dark" alt="" width="36" height="36">
          </span>
          <div>
            <h3>{{ project.name }}</h3>
            <p v-if="project.description">{{ project.description }}</p>
          </div>
        </component>
      </div>
    </section>

    <footer class="project-footer">
      <RouterLink to="/" class="parent-link" aria-label="cd ..，返回首页">
        <span aria-hidden="true">❯</span>
        <span>cd ..</span>
      </RouterLink>
    </footer>
  </article>
</template>

<style scoped>
.project-page {
  max-width: 75rem;
  margin-inline: auto;
}
.project-intro {
  text-align: center;
}
.project-intro h1 {
  margin: 0;
}
.project-intro p {
  margin: .5rem 0 0;
  font-size: 1.125rem;
  font-style: italic;
  line-height: 1.75rem;
  opacity: .5;
}
.github-button {
  display: inline-flex;
  align-items: center;
  gap: .4em;
  margin-top: 2.5rem;
  padding: .25rem .625rem;
  border: 1px solid #8884;
  border-radius: .25rem;
  color: var(--heading);
  line-height: 1.75rem;
  text-decoration: none;
  opacity: .5;
}
.github-button:is(:hover, :focus-visible) {
  background: rgb(96 165 250 / 10%);
  color: #60a5fa;
  opacity: 1;
}
.project-intro hr {
  width: 3.125rem;
  margin: 2rem auto 0;
  border: 0;
  border-top: 1px solid #8885;
}
.focus-section {
  margin-top: 2.5rem;
  --stage: 1;
}
.focus-section.slide-enter {
  animation-fill-mode: backwards;
}
.focus-section h2 {
  margin: 0 0 0 -1rem;
  color: transparent;
  -webkit-text-stroke: 1.5px rgb(170 170 170 / 35%);
  -webkit-text-stroke-color: light-dark(rgb(170 170 170 / 35%), rgb(170 170 170 / 20%));
  font-size: clamp(2.25rem, 12vw, 5rem);
  font-weight: 700;
  line-height: 1;
  -webkit-user-select: none;
  user-select: none;
  overflow-wrap: anywhere;
}
.project-grid {
  display: grid;
  grid-template-columns: minmax(0, 350px);
  justify-content: center;
  gap: 1rem;
  padding-block: .5rem;
}
@media (max-width: 767.98px) {
  .focus-section {
    --group-title-size: min(18.5vw, 5rem);
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: var(--group-title-size) auto;
  }
  .focus-section h2 {
    grid-area: 1 / 1 / 3;
    align-self: start;
    margin-inline: -1rem;
    font-size: var(--group-title-size);
    letter-spacing: -.025em;
    line-height: .95;
    white-space: pre-line;
    overflow-wrap: normal;
    pointer-events: none;
  }
  .project-grid {
    grid-area: 2 / 1;
    z-index: 1;
    align-self: start;
    padding-block-start: 0;
  }
}
@media (min-width: 768px) {
  .project-grid { grid-template-columns: repeat(2, minmax(0, 350px)); }
}
@media (min-width: 1024px) {
  .project-grid { grid-template-columns: repeat(3, minmax(0, 350px)); }
}
.project-entry {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  min-width: 0;
  padding: .5rem .875rem .875rem;
  border-radius: 6px;
  color: inherit;
  text-decoration: none;
  opacity: .6;
  transition: opacity .2s ease-out, background-color .2s ease-out;
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
.project-icon .icon-light { display: var(--light-only); }
.project-icon .icon-dark { display: var(--dark-only); }
.project-entry h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 400;
  line-height: 1.5;
}
.project-entry p {
  margin: 0;
  font-size: .875rem;
  line-height: 1.25rem;
  opacity: .5;
}
.project-footer {
  max-width: 65ch;
  margin: 3rem auto 2rem;
}
.parent-link {
  display: inline-flex;
  align-items: baseline;
  gap: .6em;
  padding-block: .5rem;
  color: color-mix(in srgb, var(--heading) 55%, var(--paper));
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  text-decoration: none;
}
.parent-link [aria-hidden] {
  font-size: .85em;
  opacity: .65;
}
.parent-link span:last-child {
  border-bottom: 1px solid #8884;
}
.parent-link:is(:hover, :focus-visible) {
  color: var(--heading);
}
.parent-link:is(:hover, :focus-visible) span:last-child {
  border-color: currentColor;
}
@media (prefers-reduced-motion: reduce) {
  .project-entry { transition: none; }
}
</style>
