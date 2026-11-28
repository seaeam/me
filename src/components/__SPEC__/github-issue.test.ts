// @vitest-environment jsdom
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, withDirectives } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { afterEach, expect, it, vi } from 'vitest'
import { GitHubIssue, vLiveIssues } from '../github-issue'

const props = {
  href: 'https://github.com/example/project/issues/7',
  number: '7',
  repository: 'example/project',
  title: '修复分页',
}

enableAutoUnmount(afterEach)
afterEach(() => vi.unstubAllGlobals())

function mountLiveCard(snapshotStatus?: string) {
  return mount(
    defineComponent({
      setup: () => () =>
        withDirectives(
          h('div', [h(GitHubIssue, { ...props, snapshotStatus })]),
          [[vLiveIssues, true]],
        ),
    }),
    { attachTo: document.body },
  )
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

it('请求开始后标记忙碌，返回时更新标题、状态和辅助标签', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      Response.json({
        [props.href]: { title: '已修复分页', status: 'Done' },
      }),
    ),
  )

  const card = mountLiveCard('Todo').get('a')

  expect(card.attributes('aria-busy')).toBe('true')
  await flushPromises()
  expect(card.text()).toContain('已修复分页')
  expect(card.attributes('aria-label')).toBe(
    '已修复分页 · example/project#7 · Done',
  )
  expect(card.attributes('aria-busy')).toBe('false')
})

it('实时记录损坏时保留原标题和快照状态', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      Response.json({
        [props.href]: { status: 'Done' },
      }),
    ),
  )

  const card = mountLiveCard('Todo').get('a')

  await flushPromises()
  expect(card.text()).toContain('修复分页')
  expect(card.attributes('aria-label')).toContain('Todo（最近记录）')
  expect(card.attributes('aria-busy')).toBe('false')
})

it('没有快照也无法获取实时状态时保留标题，说明状态获取失败', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))

  const card = mountLiveCard().get('a')

  await flushPromises()
  expect(card.text()).toContain('修复分页')
  expect(card.attributes('aria-label')).toContain('暂时无法获取状态')
  expect(card.attributes('aria-busy')).toBe('false')
})
