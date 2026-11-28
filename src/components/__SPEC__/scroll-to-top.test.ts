// @vitest-environment jsdom
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, expect, it, vi } from 'vitest'
import ScrollToTop from '../scroll-to-top.vue'

enableAutoUnmount(afterEach)

it.each([
  { reduceMotion: true, behavior: 'instant' },
  { reduceMotion: false, behavior: 'smooth' },
])(
  '页面滚动后可用 $behavior 方式返回顶部',
  async ({ reduceMotion, behavior }) => {
    const scrollTo = vi.fn()

    vi.stubGlobal('matchMedia', () => ({ matches: reduceMotion }))
    vi.stubGlobal('scrollTo', scrollTo)
    vi.stubGlobal('scrollY', 0)

    const button = mount(ScrollToTop).get('button')

    expect(button.element.disabled).toBe(true)
    vi.stubGlobal('scrollY', 450)
    window.dispatchEvent(new Event('scroll'))
    await nextTick()

    expect(button.element.disabled).toBe(false)
    await button.trigger('click')
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior })
  },
)
