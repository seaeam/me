// @vitest-environment jsdom
import { mount, RouterLinkStub } from '@vue/test-utils'
import { expect, it, vi } from 'vitest'
import type { Article } from '@/features/posts'
import ArchivePage from '../index.vue'

const { articles } = vi.hoisted(() => ({ articles: [] as Article[] }))

vi.mock('@/features/posts', () => ({ posts: articles }))

function mountArchive() {
  return mount(ArchivePage, {
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
}

it('按年份展示文章，标题链接保留文件名并编码空格', () => {
  articles.splice(
    0,
    articles.length,
    ...[
      {
        title: '第一篇',
        slug: '第一 篇',
        date: '2026-10-28',
        duration: '3 分钟',
      },
      { title: '第二篇', slug: 'second', date: '2026-02-20' },
      { title: '第三篇', slug: 'third', date: '2025-12-10' },
    ].map((article) => ({
      ...article,
      source: 'posts/' + article.slug + '.md',
      sections: [],
    })),
  )

  const page = mountArchive()

  expect(page.findAll('.year-label').map((label) => label.text())).toEqual([
    '2026',
    '2025',
  ])
  expect(page.getComponent(RouterLinkStub).props('to')).toBe(
    '/posts/' + encodeURIComponent('第一 篇'),
  )
  expect(page.get('time').text()).toBe('10月28日')
  expect(page.text()).toContain('3 分钟')
  expect(page.text()).not.toContain('还没有发布文章。')
})

it('没有发布的文章时显示真实空状态', () => {
  articles.length = 0

  const page = mountArchive()

  expect(page.text()).toContain('还没有发布文章。')
  expect(page.findComponent(RouterLinkStub).exists()).toBe(false)
})
