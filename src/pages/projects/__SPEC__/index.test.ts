// @vitest-environment jsdom
import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

async function mountProjects(content: unknown) {
  vi.resetModules()
  vi.doMock('@content/projects.json', () => ({ default: content }))

  const { default: ProjectsPage } = await import('../index.vue')

  return mount(ProjectsPage, {
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
}

describe('项目页', () => {
  it('保留分组顺序、默认锚点和重名锚点，只有提供地址的项目可以点击', async () => {
    const page = await mountProjects([
      { name: '第一个' },
      { name: '组件库', group: ' UI Kit ', url: '/kit' },
      { name: '工具', group: 'UI-Kit' },
      { name: '另一个', group: 'UI Kit' },
      { name: '学习', group: '学习资源' },
    ])

    expect(
      page.findAll('section h2').map((title) => title.attributes('id')),
    ).toEqual([
      'current-focus',
      'projects-ui-kit',
      'projects-ui-kit-2',
      'projects-学习资源',
    ])
    expect(
      page.findAll('nav a').map((link) => link.attributes('href')),
    ).toEqual([
      '#current-focus',
      '#projects-ui-kit',
      '#projects-ui-kit-2',
      '#projects-学习资源',
    ])
    expect(
      page
        .findAll('section')[1]
        .findAll('h3')
        .map((item) => item.text()),
    ).toEqual(['组件库', '另一个'])
    expect(page.get('a.project-entry').attributes('href')).toBe('/kit')
    expect(page.findAll('article.project-entry')).toHaveLength(4)
    expect(page.getComponent(RouterLinkStub).props('to')).toBe('/')
  })

  it('列表为空时说明没有项目并隐藏目录', async () => {
    const page = await mountProjects([])

    expect(page.text()).toContain('暂时没有公开的项目。')
    expect(page.find('nav').exists()).toBe(false)
  })

  it.each([
    [null, 'projects.json'],
    [[{ name: '  ' }], 'projects.json[0].name'],
    [[{ name: '示例', group: false }], 'projects.json[0].group'],
    [[{ name: '示例', url: 1 }], 'projects.json[0].url'],
  ])('报告错误的项目字段 %#', async (input, field) => {
    await expect(mountProjects(input)).rejects.toThrow(String(field))
  })
})

it('支持区提供一个写明平台和动作的赞助入口', async () => {
  vi.doMock('@content/site.json', () => ({
    default: {
      name: '站点',
      blogLabel: 'blog',
      projectsLabel: 'Projects',
      afdian: 'https://ifdian.net/a/example',
    },
  }))

  const page = await mountProjects([])
  const sponsor = page.get('aside')

  expect(sponsor.get('a').attributes('href')).toBe(
    'https://ifdian.net/a/example',
  )
  expect(sponsor.text()).toBe('在爱发电上支持我')
})
