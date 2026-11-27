import { homeIssueResponse } from '../server/github-issues.js'

export function GET() {
  return homeIssueResponse(process.env.GITHUB_TOKEN)
}
