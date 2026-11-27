<script setup lang="ts">
import GitHubProject from './github-project.vue'
import { vLiveIssues } from './github-issue'
import { vContentLinks } from '@/lib/content-links'
import type { MarkdownContent } from '@/lib/markdown-content'

defineProps<{ content: MarkdownContent; home?: boolean }>()
</script>

<template>
  <template v-for="(section, index) in content.sections" :key="index">
    <div
      v-if="'html' in section"
      v-content-links
      v-live-issues="!!home"
      class="prose"
      :class="{ 'home-copy': home }"
      v-html="section.html" />
    <GitHubProject
      v-else
      v-bind="section.project"
      :snapshot="section.snapshot"
      :source="content.source" />
  </template>
</template>
