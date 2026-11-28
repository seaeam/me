// @vitest-environment jsdom
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import GitHubProject from '../../github-project/index.vue'

const props = { repo: 'example/project', showIssues: true, source: 'home.md' }
const issue = { number: 7, title: '修复分页', status: 'Open' }

enableAutoUnmount(afterEach)

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

  const wrapper = mount(GitHubProject, { props })

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

  const wrapper = mount(GitHubProject, { props })

  await flushPromises()
  expect(request).toHaveBeenCalledTimes(3)
  expect(wrapper.get('button').text()).toContain('继续查找')
  expect(wrapper.text()).not.toContain('暂无')

  await wrapper.get('button').trigger('click')
  await flushPromises()
  expect(wrapper.text()).toContain('暂无打开的 issue')
})
