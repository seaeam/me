<script setup lang="ts">
import GitHubProject from '../github-project/index.vue'
import { vLiveIssues } from '@/directives/live-issues'
import { vContentLinks } from '@/directives/content-links'
import type { MarkdownContent } from '@/lib/markdown-content'

defineProps<{ content: MarkdownContent; liveIssues?: boolean }>()
</script>

<template>
  <template v-for="(section, index) in content.sections" :key="index">
    <div
      v-if="'html' in section"
      v-content-links
      v-live-issues="liveIssues"
      class="prose markdown-section"
      v-html="section.html" />
    <GitHubProject
      v-else
      v-bind="section.project"
      :snapshot="section.snapshot"
      :source="content.source" />
  </template>
</template>
