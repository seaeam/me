import { githubIssuesResponse } from '../server/github-issues.js'

export function GET(request: Request) {
  return githubIssuesResponse(
    new URL(request.url).searchParams,
    process.env.GITHUB_TOKEN,
  )
}
