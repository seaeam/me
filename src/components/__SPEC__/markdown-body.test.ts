// @vitest-environment jsdom
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { afterEach, expect, it, vi } from 'vitest'
import { GitHubIssue } from '../github-issue/index'
import MarkdownBody from '../markdown-body/index.vue'

enableAutoUnmount(afterEach)

it.each([
  {
    mode: '开启',
    options: { liveIssues: true },
    title: '更新后的标题',
    requests: 1,
  },
  {
    mode: '关闭',
    options: { liveIssues: false },
    title: '静态标题',
    requests: 0,
  },
  { mode: '使用默认设置', options: {}, title: '静态标题', requests: 0 },
])('实时更新$mode时显示“$title”', async ({ options, title, requests }) => {
  const href = 'https://github.com/example/project/issues/9'

  const html = await renderToString(
    h(GitHubIssue, {
      href,
      repository: 'example/project',
      number: '9',
      title: '静态标题',
    }),
  )

  const request = vi.fn().mockResolvedValue(
    Response.json({
      [href]: { title: '更新后的标题', status: 'Done' },
    }),
  )

  vi.stubGlobal('fetch', request)

  const wrapper = mount(MarkdownBody, {
    attachTo: document.body,
    props: { content: { sections: [{ html }], source: 'home.md' }, ...options },
  })

  await flushPromises()
  expect(wrapper.get('a').text()).toContain(title)
  expect(request).toHaveBeenCalledTimes(requests)
})
