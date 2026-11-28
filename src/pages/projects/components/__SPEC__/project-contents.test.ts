// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ProjectContents from '../project-contents/index.vue'

describe('project-contents', () => {
  it('目录按钮展开目录，Escape 关闭后归还焦点，选择分组链接收起目录', async () => {
    const menu = mount(ProjectContents, {
      attachTo: document.body,
      props: { groups: [{ id: 'current-focus', name: 'Current Focus' }] },
    })

    const button = menu.get('button')
    const link = menu.get('a')

    expect(button.attributes('aria-expanded')).toBe('false')
    expect(menu.get('ul').attributes('inert')).toBeDefined()

    await button.trigger('click')
    expect(button.attributes('aria-expanded')).toBe('true')
    expect(menu.get('ul').attributes('inert')).toBeUndefined()

    link.element.focus()
    await link.trigger('keydown', { key: 'Escape' })
    expect(document.activeElement).toBe(button.element)
    expect(button.attributes('aria-expanded')).toBe('false')

    await button.trigger('click')
    await link.trigger('click')
    expect(link.attributes('href')).toBe('#current-focus')
    expect(button.attributes('aria-expanded')).toBe('false')

    menu.unmount()
  })

  it('鼠标悬停预览后，第一次点击保持展开，再次点击收起', async () => {
    const menu = mount(ProjectContents, {
      props: { groups: [{ id: 'projects-web', name: 'Web' }] },
    })

    const button = menu.get('button')

    const nav = menu.get('nav')

    await nav.trigger('pointerenter', { pointerType: 'mouse' })
    expect(button.attributes('aria-expanded')).toBe('true')

    await nav.trigger('pointerleave', { pointerType: 'mouse' })
    expect(button.attributes('aria-expanded')).toBe('false')

    await nav.trigger('pointerenter', { pointerType: 'mouse' })
    await button.trigger('click')
    expect(button.attributes('aria-expanded')).toBe('true')

    await nav.trigger('pointerleave', { pointerType: 'mouse' })
    expect(button.attributes('aria-expanded')).toBe('true')

    await button.trigger('click')
    expect(button.attributes('aria-expanded')).toBe('false')
  })
})
