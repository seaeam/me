import type MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token.mjs'
import { parse } from 'vue/compiler-sfc'
import {
  normalizeRepository,
  type GitHubProjectProps,
} from '../src/lib/github-issues.js'

function parseProjectProps(
  markup: string,
  prefix: string,
  lineNumber: number,
): GitHubProjectProps {
  const { descriptor, errors } = parse(`<template>${markup}</template>`)
  const children = descriptor.template?.ast?.children
  const project = children?.[0]

  if (
    errors.length ||
    children?.length !== 1 ||
    project?.type !== 1 ||
    project.tag !== 'GitHubProject'
  )
    throw new Error(`Invalid GitHubProject at Markdown line ${lineNumber}`)

  // Markdown 在构建时解析，只有 Vue 模板可以绑定运行时的值。
  const attributes = new Map<string, string>()

  for (const prop of project.props) {
    if (prop.type === 6) {
      attributes.set(prop.name, prop.value?.content ?? '')
      continue
    }

    if (
      prop.name !== 'bind' ||
      prop.arg?.type !== 4 ||
      prop.arg.content !== 'show-issues' ||
      prop.exp?.type !== 4 ||
      !/^(true|false)$/.test(prop.exp.content)
    )
      throw new Error(
        `Use literal GitHubProject props at Markdown line ${lineNumber}`,
      )

    attributes.set('show-issues', prop.exp.content)
  }

  const repo = attributes.get('repo')?.trim() ?? ''

  if (!normalizeRepository(repo))
    throw new Error(`Expected repo="owner/repo" at Markdown line ${lineNumber}`)

  return {
    repo,
    name: attributes.get('name'),
    prefix: (prefix + (attributes.get('prefix') ?? '')).trimEnd() || undefined,
    icon: attributes.get('icon'),
    showIssues:
      attributes.has('show-issues') &&
      attributes.get('show-issues') !== 'false',
  }
}

export function markdownProjects(markdown: MarkdownIt) {
  markdown.block.ruler.before(
    'html_block',
    'github_project',
    (state, start, end, silent) => {
      if (state.level !== 0 || state.sCount[start] - state.blkIndent >= 4)
        return false

      const lineAt = (index: number) =>
        state.src.slice(
          state.bMarks[index] + state.tShift[index],
          state.eMarks[index],
        )

      if (!/<GitHubProject(?:\s|$)/.test(lineAt(start))) return false

      let last = start

      while (!lineAt(last).trimEnd().endsWith('/>')) {
        if (++last >= end || state.isEmpty(last)) return false
      }

      const markup = state.getLines(start, last + 1, state.blkIndent, false)
      const inlineTokens: Token[] = []

      state.md.inline.parse(markup.trim(), state.md, state.env, inlineTokens)

      const tag = inlineTokens.pop()

      if (
        tag?.type !== 'html_inline' ||
        !/^<GitHubProject\s/.test(tag.content) ||
        inlineTokens.some((token) => token.type !== 'text')
      )
        return false
      if (silent) return true

      const prefix = inlineTokens.map((token) => token.content).join('')
      const project = parseProjectProps(tag.content, prefix, start + 1)
      const token = state.push('github_project', '', 0)

      token.meta = project
      token.map = [start, last + 1]
      state.line = last + 1

      return true
    },
    { alt: ['paragraph'] },
  )
}
