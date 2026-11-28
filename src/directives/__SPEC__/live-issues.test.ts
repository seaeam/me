// @vitest-environment jsdom
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, withDirectives } from 'vue'
import { afterEach, expect, it, vi } from 'vitest'
import { GitHubIssue } from '@/components/github-issue/index'
import { vLiveIssues } from '../live-issues'

enableAutoUnmount(afterEach)

const props = {
  href: 'https://github.com/example/project/issues/7',
  number: '7',
  repository: 'example/project',
  title: '修复分页',
}

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
