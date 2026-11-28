import { createMemoryHistory, createRouter } from 'vue-router'
import { expect, it, vi } from 'vitest'
import { postPath, sections } from '../sections'
import { routes } from '../routes'

const { post } = vi.hoisted(() => ({
  post: {
    title: '文章标题',
    date: '2026-01-01',
    slug: '笔记 1',
    sections: [{ html: '<p>内容</p>' }],
    source: 'posts/笔记 1.md',
  },
}))

vi.mock('@/features/posts', () => ({ posts: [post] }))
vi.mock('@/pages/home/index.vue', () => ({ default: {} }))

it('导航和文章路径均能解析，文章详情路由携带原文和页面标题', () => {
  const router = createRouter({ history: createMemoryHistory(), routes })

  expect(router.resolve('/').name).toBe('home')
  for (const section of Object.values(sections)) {
    expect(router.resolve(section.path).meta.title).toBe(section.label)
  }

  const article = router.resolve(postPath(post.slug))

  expect(article.meta.title).toBe(post.title)
  expect(article.matched[0].props.default).toEqual({ post })
})
