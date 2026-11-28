// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import GitHubProject from '../github-project.vue'

it('仓库入口使用项目名和规范化地址，未开启 issue 列表时只渲染仓库信息', () => {
  const wrapper = mount(GitHubProject, {
    props: { repo: 'Example/Project', name: '示例项目', prefix: '最近在做' },
  })

  expect(wrapper.text()).toContain('最近在做')

  const link = wrapper.get('a')

  expect(link.text()).toBe('示例项目')
  expect(link.attributes('href')).toBe('https://github.com/example/project')
  expect(link.attributes('target')).toBe('_blank')
  expect(wrapper.find('[role="group"]').exists()).toBe(false)
})

it('无效的仓库地址不生成链接或列表', () => {
  const wrapper = mount(GitHubProject, {
    props: { repo: 'example', showIssues: true },
  })

  expect(wrapper.find('a').exists()).toBe(false)
  expect(wrapper.find('[role="group"]').exists()).toBe(false)
})
