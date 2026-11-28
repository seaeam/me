<script setup lang="ts">
import { vContentLinks } from '@/directives/content-links'
import { site } from '@/lib/site'
import ProjectContents from './components/project-contents/index.vue'
import ProjectEntry from './components/project-entry/index.vue'
import { projectGroups } from './project-groups'
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
        class="project-button github-button group">
        <i
          class="i-ph-github-logo-duotone group-hover:i-ph-github-logo-fill group-focus-visible:i-ph-github-logo-fill"
          aria-hidden="true" />
        GitHub
      </a>
      <hr />
    </header>

    <ProjectContents v-if="projectGroups.length" :groups="projectGroups" />
    <p v-else class="project-empty">暂时没有公开的项目。</p>
    <section
      v-for="group in projectGroups"
      :key="group.id"
      class="focus-section slide-enter"
      :aria-labelledby="group.id">
      <h2 :id="group.id">{{ group.name.replace(/\s+/g, '\n') }}</h2>
      <div class="project-grid">
        <ProjectEntry
          v-for="project in group.projects"
          :key="project.name"
          :project="project" />
      </div>
    </section>

    <aside
      v-if="site.afdian"
      class="reading-column project-sponsor"
      aria-label="支持我的开源项目">
      <hr />
      <a
        v-content-links="site.afdian"
        :href="site.afdian"
        class="project-button afdian-button group">
        <i
          class="i-ph-lightning-duotone group-hover:i-ph-lightning-fill group-focus-visible:i-ph-lightning-fill transition-all duration-200 ease-out"
          aria-hidden="true" />
        在爱发电上支持我
      </a>
    </aside>

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
  margin: 0.5rem 0 0;
  font-size: 1.125rem;
  font-style: italic;
  line-height: 1.75rem;
  opacity: 0.5;
}
.project-button {
  padding: 0.25rem 0.625rem;
  border: 1px solid #8884;
  border-radius: 0.25rem;
  color: var(--heading);
  line-height: 1.75rem;
  text-decoration: none;
  opacity: 0.5;
}
.github-button {
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  margin-top: 2.5rem;
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
.project-empty {
  text-align: center;
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
  -webkit-text-stroke-color: light-dark(
    rgb(170 170 170 / 35%),
    rgb(170 170 170 / 20%)
  );
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
  padding-block: 0.5rem;
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
    letter-spacing: -0.025em;
    line-height: 0.95;
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
  .project-grid {
    grid-template-columns: repeat(2, minmax(0, 350px));
  }
}
@media (min-width: 1024px) {
  .project-grid {
    grid-template-columns: repeat(3, minmax(0, 350px));
  }
}
.project-sponsor {
  margin-top: 2.5rem;
  padding-bottom: 1.25rem;
  text-align: center;
}
.project-sponsor hr {
  width: 3.125rem;
  margin: 0 auto 2rem;
  border: 0;
  border-top: 1px solid #7d7d7d4d;
}
.afdian-button {
  display: inline-block;
  border-color: rgb(136 136 136 / 27%);
  transition: border 0.3s ease-in-out;
  -webkit-tap-highlight-color: transparent;
}
.afdian-button:is(:hover, :focus-visible) {
  background: rgb(250 204 21 / 10%);
  color: #facc15;
  opacity: 1;
}
.project-footer {
  max-width: 65ch;
  margin: 3rem auto 2rem;
}
.parent-link {
  display: inline-flex;
  align-items: baseline;
  gap: 0.6em;
  padding-block: 0.5rem;
  color: color-mix(in srgb, var(--heading) 55%, var(--paper));
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  text-decoration: none;
}
.parent-link [aria-hidden] {
  font-size: 0.85em;
  opacity: 0.65;
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
</style>
