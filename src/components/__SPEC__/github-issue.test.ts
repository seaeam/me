// @vitest-environment jsdom
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { expect, it } from 'vitest'
import { GitHubIssue } from '../github-issue/index'

const props = {
  href: 'https://github.com/example/project/issues/7',
  number: '7',
  repository: 'example/project',
  title: '修复分页',
}

it('静态卡片显示上次记录的状态，客户端尚未请求时不宣布忙碌', async () => {
  const html = await renderToString(
    h(GitHubIssue, { ...props, snapshotStatus: 'Todo' }),
  )

  const card = document.createElement('div')

  card.innerHTML = html

  const link = card.querySelector('a')!

  expect(link.dataset.status).toBe('Todo')
  expect(link.getAttribute('aria-label')).toContain('Todo（最近记录）')
  expect(link.getAttribute('aria-busy')).not.toBe('true')
})
