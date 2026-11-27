import { readFile } from 'node:fs/promises'
import MarkdownIt from 'markdown-it'
import frontMatter from 'front-matter'
import { markdownProjects } from './markdown-projects.js'
import {
  fetchGitHubIssuePage,
  normalizeRepository,
  type IssuePage,
} from '../src/lib/github-issues.js'
import { cachedSnapshot, type SnapshotCache } from './github-cache.js'
import { homeIssueResponse } from './github-issues.js'

const markdown = new MarkdownIt({ html: true }).use(markdownProjects)

// Only a published component with show-issues can use the site's GitHub credential.
async function hasPublishedIssues(source: string, repository: string) {
  if (source !== 'home.md' && !/^posts\/[^/\\\0]+\.md$/u.test(source))
    return false
  let text: string
  try {
    text = await readFile(`content/${source}`, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false
    throw error
  }
  const { body } = frontMatter(text)
  return markdown
    .parse(body, {})
    .some(
      ({ type, meta }) =>
        type === 'github_project' &&
        meta.showIssues &&
        normalizeRepository(meta.repo) === repository,
    )
}

const ttlSeconds = 300
const runtime = globalThis as typeof globalThis & {
  siteProjectIssuePages?: SnapshotCache<IssuePage>
}
const firstPages = (runtime.siteProjectIssuePages ??= new Map())

function firstPage(repository: string, token?: string) {
  return cachedSnapshot(firstPages, repository, token, ttlSeconds, () =>
    fetchGitHubIssuePage(repository, 1, token),
  )
}

export async function projectIssueSnapshot(repo: string, token?: string) {
  try {
    return (await firstPage(repo.toLowerCase(), token)).value
  } catch (error) {
    console.warn(
      `[project-issues] ${repo}:`,
      error instanceof Error ? error.message : error,
    )
  }
}

export async function githubIssuesResponse(
  params: URLSearchParams,
  token?: string,
) {
  if (!params.has('repository')) return homeIssueResponse(token)
  const repository = normalizeRepository(params.get('repository') ?? '')
  if (!repository) return Response.json(null, { status: 404 })
  const input = params.get('page') ?? '1'
  const page = Number(input)
  if (!/^[1-9]\d*$/.test(input) || !Number.isSafeInteger(page))
    return new Response(null, { status: 400 })

  try {
    if (
      !(await hasPublishedIssues(params.get('source') ?? 'home.md', repository))
    )
      return Response.json(null, { status: 404 })
    // Only cache the first page in memory. Subsequent pages can use the CDN.
    const { value, expiresAt } =
      page === 1
        ? await firstPage(repository, token)
        : {
            value: await fetchGitHubIssuePage(repository, page, token),
            expiresAt: Date.now() + ttlSeconds * 1000,
          }
    const maxAge = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
    return Response.json(value, {
      headers: {
        'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge}`,
      },
    })
  } catch (error) {
    console.warn(
      `[project-issues] ${repository} page ${page}:`,
      error instanceof Error ? error.message : error,
    )
    return new Response(null, {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    })
  }
}
