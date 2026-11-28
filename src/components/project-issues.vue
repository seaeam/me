<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { GitHubIssue } from './github-issue'
import { vContentLinks } from '../lib/content-links'
import { fetchProjectIssuePage, type IssuePage } from '../lib/github-issues'

const props = defineProps<{
  repository: string
  snapshot?: IssuePage | null
  source?: string
}>()

const snapshot = props.snapshot
const issues = ref(snapshot?.issues ?? [])
const nextPage = ref(snapshot?.nextPage ?? null)
const hasResult = ref(!!snapshot)
const loading = ref(false)
const failed = ref<{ page: number; replace: boolean }>()
const controller = new AbortController()
const issuesUrl = `https://github.com/${props.repository}/issues`

async function load(page: number, replace = false) {
  if (loading.value) return

  loading.value = true
  failed.value = undefined

  const known = new Set(
    replace ? [] : issues.value.map((issue) => issue.number),
  )

  try {
    // GitHub 的一页可能全是 PR 或重复项，连续读三页后交给读者决定是否继续。
    for (let pagesRead = 1; !controller.signal.aborted; pagesRead++) {
      const batch = await fetchProjectIssuePage(
        props.repository,
        page,
        AbortSignal.any([controller.signal, AbortSignal.timeout(6500)]),
        props.source,
      )

      const additions = batch.issues.filter((issue) => {
        if (known.has(issue.number)) return false

        known.add(issue.number)

        return true
      })

      if (additions.length || batch.nextPage === null || pagesRead === 3) {
        issues.value = replace ? additions : [...issues.value, ...additions]
        nextPage.value = batch.nextPage
        hasResult.value = true
        break
      }

      page = batch.nextPage
    }
  } catch {
    if (!controller.signal.aborted) failed.value = { page, replace }
  } finally {
    loading.value = false
  }
}

onMounted(() => load(1, true))
onBeforeUnmount(() => controller.abort())
</script>

<template>
  <div
    class="prose project-issues"
    :aria-label="`${repository} 打开的 issue`"
    role="group">
    <ul v-if="issues.length" class="project-issue-list">
      <li v-for="issue in issues" :key="issue.number" class="github-issue-row">
        <GitHubIssue
          :href="`${issuesUrl}/${issue.number}`"
          :repository="repository"
          :number="String(issue.number)"
          :title="issue.title"
          :status="issue.status" />
      </li>
    </ul>
    <div class="issue-controls" aria-live="polite">
      <template v-if="failed">
        <span v-if="!failed.replace">后续 issue 加载失败。</span>
        <span v-else-if="issues.length">更新失败，显示上次获取的 issue。</span>
        <span v-else>暂时无法加载 issue。</span>
        <button type="button" @click="load(failed.page, failed.replace)">
          重试
        </button>
        <a v-content-links="issuesUrl" :href="issuesUrl">在 GitHub 查看</a>
      </template>
      <span v-else-if="!issues.length && loading">正在加载 issue…</span>
      <span v-else-if="!hasResult">尚未获取 issue 列表。</span>
      <span v-else-if="!issues.length && !nextPage">暂无打开的 issue</span>
      <button
        v-else-if="nextPage"
        type="button"
        :disabled="loading"
        @click="load(nextPage)">
        {{
          loading
            ? '正在加载…'
            : issues.length
              ? '显示更多 issue'
              : '继续查找 issue'
        }}
      </button>
      <span v-else-if="loading">正在更新 issue…</span>
    </div>
    <noscript v-if="!hasResult || nextPage"
      ><a v-content-links="issuesUrl" :href="issuesUrl"
        >在 GitHub 查看全部 issue</a
      ></noscript
    >
  </div>
</template>

<style scoped>
.project-issues .project-issue-list {
  margin: 0;
  padding: 0;
  list-style: none;
}
.issue-controls:not(:empty) {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  column-gap: 0.75rem;
  margin-inline-start: 0.4rem;
  padding: 0.25rem 0 0.25rem 0.85rem;
  border-inline-start: 1px solid #8884;
  color: var(--prose);
  font-size: 0.8rem;
}
.issue-controls button {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 0.2em;
}
.issue-controls button:disabled {
  opacity: 0.65;
}
</style>
