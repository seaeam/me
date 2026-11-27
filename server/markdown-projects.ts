import type MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token.mjs'
import { parse } from 'vue/compiler-sfc'
import {
  normalizeRepository,
  type GitHubProjectProps,
} from '../src/lib/github-issues.js'

export function markdownProjects(markdown: MarkdownIt) {
  markdown.block.ruler.before(
    'html_block',
    'github_project',
    (state, start, end, silent) => {
      if (state.level !== 0 || state.sCount[start] - state.blkIndent >= 4)
        return false
      const line = (n: number) =>
        state.src.slice(state.bMarks[n] + state.tShift[n], state.eMarks[n])
      if (!/<GitHubProject(?:\s|$)/.test(line(start))) return false
      let last = start
      while (!line(last).trimEnd().endsWith('/>')) {
        if (++last >= end || state.isEmpty(last)) return false
      }
      const markup = state.getLines(start, last + 1, state.blkIndent, false)
      const inline: Token[] = []
      state.md.inline.parse(markup.trim(), state.md, state.env, inline)
      const tag = inline.pop()
      if (
        tag?.type !== 'html_inline' ||
        !/^<GitHubProject\s/.test(tag.content) ||
        inline.some((token) => token.type !== 'text')
      )
        return false
      if (silent) return true

      const prefix = inline.map((token) => token.content).join('')
      const { descriptor, errors } = parse(
        `<template>${tag.content}</template>`,
      )
      const node = descriptor.template?.ast?.children[0]
      if (
        errors.length ||
        node?.type !== 1 ||
        node.tag !== 'GitHubProject' ||
        descriptor.template?.ast?.children.length !== 1
      )
        throw new Error(`Invalid GitHubProject at Markdown line ${start + 1}`)

      // Markdown accepts literal props. Vue templates can bind reactive values directly.
      const attrs = new Map<string, string>()
      for (const prop of node.props) {
        if (prop.type === 6) attrs.set(prop.name, prop.value?.content ?? '')
        else if (
          prop.name === 'bind' &&
          prop.arg?.type === 4 &&
          prop.arg.content === 'show-issues' &&
          prop.exp?.type === 4 &&
          /^(true|false)$/.test(prop.exp.content)
        )
          attrs.set('show-issues', prop.exp.content)
        else
          throw new Error(
            `Use literal GitHubProject props at Markdown line ${start + 1}`,
          )
      }
      const repo = attrs.get('repo')?.trim() ?? ''
      if (!normalizeRepository(repo))
        throw new Error(
          `Expected repo="owner/repo" at Markdown line ${start + 1}`,
        )
      const project: GitHubProjectProps = {
        repo,
        name: attrs.get('name'),
        prefix: (prefix + (attrs.get('prefix') ?? '')).trimEnd() || undefined,
        icon: attrs.get('icon'),
        showIssues:
          attrs.has('show-issues') && attrs.get('show-issues') !== 'false',
      }
      const token = state.push('github_project', '', 0)
      token.meta = project
      token.map = [start, last + 1]
      state.line = last + 1
      return true
    },
    { alt: ['paragraph'] },
  )
}
