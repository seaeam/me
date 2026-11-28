<script setup lang="ts">
import { computed } from 'vue'
import { vContentLinks } from '@/directives/content-links'
import { normalizeRepository, type IssuePage } from '@/lib/github-issues'
import type { GitHubProjectProps } from '@/lib/markdown-content'
import ProjectIssues from './project-issues.vue'

const props = defineProps<
  GitHubProjectProps & { snapshot?: IssuePage | null; source?: string }
>()

const repository = computed(() => normalizeRepository(props.repo))
const url = computed(() => `https://github.com/${repository.value}`)
</script>

<template>
  <div v-if="repository" class="github-project prose">
    <p class="project-line">
      <span v-if="prefix" class="project-prefix">{{ prefix }}</span>
      <a v-content-links="url" :href="url" class="repo-link">
        <img v-if="icon" :src="icon" alt="" />{{ name || repo }}
      </a>
    </p>
    <ProjectIssues
      v-if="showIssues"
      :key="repository"
      :repository="repository"
      :source="source"
      :snapshot="snapshot" />
  </div>
</template>

<style scoped>
.project-line {
  line-height: 1.95;
}
.project-line:has(+ .project-issues) {
  margin-block-end: 0.4rem;
}
.project-prefix {
  margin-inline-end: 0.25em;
}
</style>
