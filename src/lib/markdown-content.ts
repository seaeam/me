import type { GitHubProjectProps, IssuePage } from './github-issues'

export type MarkdownSection =
  { html: string } | { project: GitHubProjectProps; snapshot?: IssuePage }

export interface MarkdownContent {
  sections: MarkdownSection[]
  source: string
}
