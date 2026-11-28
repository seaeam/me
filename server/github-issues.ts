import {
  normalizeRepository,
  type IssueDetails,
} from '../src/lib/github-issues.js'
import {
  fetchIssue,
  issueTtlSeconds,
  projectPageSnapshot,
} from './github-snapshots.js'
import { hasPublishedIssues, homeIssueLinks } from './published-issues.js'

function cacheHeader(maxAge: number) {
  return `public, max-age=${maxAge}, s-maxage=${maxAge}`
}

async function homeIssueResponse(token?: string) {
  const links = await homeIssueLinks()
  const result: Record<string, IssueDetails> = {}
  let expiresAt = Infinity

  await Promise.all(
    Array.from(links, async ([href, { repository, number }]) => {
      const details = await fetchIssue(repository, number, token)

      if (!details) return

      result[href] = { title: details.title, status: details.status }
      expiresAt = Math.min(expiresAt, details.expiresAt)
    }),
  )

  const found = Object.keys(result).length
  const complete = found === links.size

  const maxAge = Math.min(
    issueTtlSeconds,
    Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)),
  )

  return Response.json(result, {
    status: found > 0 || complete ? 200 : 503,
    headers: {
      'Cache-Control': complete ? cacheHeader(maxAge) : 'no-store',
    },
  })
}

export async function githubIssuesResponse(
  params: URLSearchParams,
  token?: string,
) {
  const repositoryParam = params.get('repository')
  const pageParam = params.get('page') ?? '1'
  const page = Number(pageParam)

  try {
    if (repositoryParam === null) return await homeIssueResponse(token)

    const repository = normalizeRepository(repositoryParam)

    if (!repository) return Response.json(null, { status: 404 })
    if (!/^[1-9]\d*$/.test(pageParam) || !Number.isSafeInteger(page))
      return new Response(null, { status: 400 })

    const source = params.get('source') ?? 'home.md'

    if (!(await hasPublishedIssues(source, repository)))
      return Response.json(null, { status: 404 })

    const { value, expiresAt } = await projectPageSnapshot(
      repository,
      page,
      token,
    )

    const maxAge = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))

    return Response.json(value, {
      headers: { 'Cache-Control': cacheHeader(maxAge) },
    })
  } catch (error) {
    console.warn(
      `[github-issues] ${repositoryParam ?? 'home.md'} page ${page}:`,
      error instanceof Error ? error.message : error,
    )

    return new Response(null, {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    })
  }
}
