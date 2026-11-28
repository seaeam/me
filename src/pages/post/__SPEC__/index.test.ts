// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import PostPage from '../index.vue'

it('详情页展示传入文章的标题、发布日期和编译好的正文', () => {
  const post = {
    title: '一份笔记',
    date: '2026-06-01T21:00:00.000Z',
    slug: 'notes',
    source: 'posts/notes.md',
    sections: [{ html: '<p>笔记正文</p>' }],
  }

  const page = mount(PostPage, { props: { post } })

  expect(page.get('h1').text()).toBe(post.title)
  expect(page.get('time').text()).toBe('2026-06-01')
  expect(page.get('time').attributes('datetime')).toBe(post.date)
  expect(page.get('p').text()).toBe('笔记正文')
})
