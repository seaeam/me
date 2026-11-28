import {
  fetchGitHubIssuePage,
  githubRequest,
  parseGitHubIssueDetails,
  type IssueDetails,
  type IssuePage,
} from '../src/lib/github-issues.js'
import { cachedSnapshot, type SnapshotCache } from './github-cache.js'

export const issueTtlSeconds = 60 * 60

const projectPageTtlSeconds = 300

// ViteSSG 会加载两次配置，两次渲染需要使用同一份快照。
const runtime = globalThis as typeof globalThis & {
  siteGithubIssues?: SnapshotCache<IssueDetails>
  siteProjectIssuePages?: SnapshotCache<IssuePage>
}

const issueSnapshots = (runtime.siteGithubIssues ??= new Map())
const firstPages = (runtime.siteProjectIssuePages ??= new Map())

export async function fetchIssue(
  repository: string,
  number: string,
  token?: string,
) {
  const path = `${repository}/issues/${number}`

  try {
    const snapshot = await cachedSnapshot(
      issueSnapshots,
      path.toLowerCase(),
      token,
      issueTtlSeconds,
      async () => {
        const response = await githubRequest(path, token)

        return parseGitHubIssueDetails(await response.json(), 'No status')
      },
    )

    return { ...snapshot.value, expiresAt: snapshot.expiresAt }
  } catch (error) {
    console.warn(
      `[github-issue] ${path}:`,
      error instanceof Error ? error.message : error,
    )
  }
}

export async function projectPageSnapshot(
  repository: string,
  page: number,
  token?: string,
) {
  // 构建与 API 共享第一页的内存快照，后续页只交给 CDN 缓存。
  if (page === 1)
    return cachedSnapshot(
      firstPages,
      repository,
      token,
      projectPageTtlSeconds,
      () => fetchGitHubIssuePage(repository, page, token),
    )

  const value = await fetchGitHubIssuePage(repository, page, token)

  return { value, expiresAt: Date.now() + projectPageTtlSeconds * 1000 }
}
