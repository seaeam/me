import type { IssuePage } from './github-issues'

export interface GitHubProjectProps {
  repo: string
  name?: string
  icon?: string
  prefix?: string
  showIssues?: boolean
}

export type MarkdownSection =
  { html: string } | { project: GitHubProjectProps; snapshot?: IssuePage }

export interface MarkdownContent {
  sections: MarkdownSection[]
  source: string
}
