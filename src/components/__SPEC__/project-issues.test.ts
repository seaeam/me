// @vitest-environment jsdom
import { flushPromises, mount } from '@vue/test-utils'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { afterEach, expect, it, vi } from 'vitest'
import ProjectIssues from '../project-issues.vue'

const props = { repository: 'example/project', source: 'home.md' }
const issue = { number: 7, title: '修复分页', status: 'Open' }

afterEach(() => vi.unstubAllGlobals())

it('没有构建快照时，静态页面说明尚未获取列表并提供仓库链接', async () => {
  const html = await renderToString(h(ProjectIssues, props))

  expect(html).toContain('尚未获取 issue 列表')
  expect(html).toContain('https://github.com/example/project/issues')
  expect(html).not.toContain('正在加载')
})

it('首次请求期间显示加载提示，只有收到末页的空列表后才显示空态', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(Response.json({ issues: [], nextPage: null })),
  )

  const wrapper = mount(ProjectIssues, { props })

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

  const wrapper = mount(ProjectIssues, {
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

  const wrapper = mount(ProjectIssues, {
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

it('翻页失败保留已显示的 issue，重试同一页并去掉重复项', async () => {
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ issues: [issue], nextPage: 2 }))
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce(
      Response.json({
        issues: [issue, { ...issue, number: 8 }],
        nextPage: null,
      }),
    )

  vi.stubGlobal('fetch', request)

  const wrapper = mount(ProjectIssues, { props })

  await flushPromises()
  expect(wrapper.get('button').text()).toContain('显示更多')
  await wrapper.get('button').trigger('click')
  await flushPromises()

  expect(wrapper.get('li').text()).toContain('修复分页')
  expect(wrapper.text()).toContain('后续 issue 加载失败')
  await wrapper.get('button').trigger('click')
  await flushPromises()

  expect(
    wrapper.findAll('.github-issue-ref').map((label) => label.text()),
  ).toEqual(['#7', '#8'])
  expect(
    request.mock.calls.map(([url]) =>
      new URL(String(url), 'https://example.test').searchParams.get('page'),
    ),
  ).toEqual(['1', '2', '2'])
  expect(wrapper.find('button').exists()).toBe(false)
})

it('连续三页未找到 issue 时允许继续翻页，不提前显示空态', async () => {
  const request = vi.fn<typeof fetch>()

  for (const nextPage of [2, 3, 4]) {
    request.mockResolvedValueOnce(Response.json({ issues: [], nextPage }))
  }

  request.mockResolvedValueOnce(Response.json({ issues: [], nextPage: null }))
  vi.stubGlobal('fetch', request)

  const wrapper = mount(ProjectIssues, { props })

  await flushPromises()
  expect(request).toHaveBeenCalledTimes(3)
  expect(wrapper.get('button').text()).toContain('继续查找')
  expect(wrapper.text()).not.toContain('暂无')

  await wrapper.get('button').trigger('click')
  await flushPromises()
  expect(wrapper.text()).toContain('暂无打开的 issue')
})
