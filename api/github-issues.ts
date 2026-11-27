import { githubIssuesResponse } from '../server/project-issues.js'

export function GET(request: Request) {
  return githubIssuesResponse(
    new URL(request.url).searchParams,
    process.env.GITHUB_TOKEN,
  )
}
