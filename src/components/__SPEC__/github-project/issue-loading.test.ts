// @vitest-environment jsdom
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { afterEach, expect, it, vi } from 'vitest'
import GitHubProject from '../../github-project/index.vue'

const props = { repo: 'example/project', showIssues: true, source: 'home.md' }
const issue = { number: 7, title: '修复分页', status: 'Open' }

enableAutoUnmount(afterEach)

it('没有构建快照时，静态页面说明尚未获取列表并提供仓库链接', async () => {
  const html = await renderToString(h(GitHubProject, props))

  expect(html).toContain('尚未获取 issue 列表')
  expect(html).toContain('https://github.com/example/project/issues')
  expect(html).not.toContain('正在加载')
})

it('首次请求期间显示加载提示，只有收到末页的空列表后才显示空态', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(Response.json({ issues: [], nextPage: null })),
  )

  const wrapper = mount(GitHubProject, { props })

  await wrapper.vm.$nextTick()
  expect(wrapper.text()).toContain('正在加载 issue')
  expect(wrapper.text()).not.toContain('暂无')

  await flushPromises()
  expect(wrapper.text()).toContain('暂无打开的 issue')
})

it('有快照时立即显示原列表，并在刷新期间说明正在更新', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(Response.json({ issues: [issue], nextPage: null })),
  )

  const wrapper = mount(GitHubProject, {
    props: { ...props, snapshot: { issues: [issue], nextPage: null } },
  })

  await wrapper.vm.$nextTick()
  expect(wrapper.get('li').text()).toContain('修复分页')
  expect(wrapper.text()).toContain('正在更新 issue')

  await flushPromises()
  expect(wrapper.text()).not.toContain('正在更新')
})

it('刷新失败保留快照，重试成功后用新列表替换快照', async () => {
  const request = vi
    .fn<typeof fetch>()
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce(
      Response.json({
        issues: [{ ...issue, number: 8, title: '新标题' }],
        nextPage: null,
      }),
    )

  vi.stubGlobal('fetch', request)

  const wrapper = mount(GitHubProject, {
    props: { ...props, snapshot: { issues: [issue], nextPage: null } },
  })

  await flushPromises()
  expect(wrapper.text()).toContain('更新失败')
  expect(wrapper.text()).toContain('修复分页')
  expect(wrapper.get('.issue-controls a').attributes('href')).toBe(
    'https://github.com/example/project/issues',
  )

  await wrapper.get('button').trigger('click')
  await flushPromises()

  expect(wrapper.findAll('li')).toHaveLength(1)
  expect(wrapper.get('li a').attributes('href')).toBe(
    'https://github.com/example/project/issues/8',
  )
  expect(wrapper.text()).toContain('新标题')
})
