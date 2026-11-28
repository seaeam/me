// @vitest-environment jsdom
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import ThemeToggle from '../site-header/theme-toggle.vue'

enableAutoUnmount(afterEach)

afterEach(() => {
  delete document.documentElement.dataset.theme
  document.documentElement.classList.remove('theme-fade')
  localStorage.clear()
})

it('首次切换以系统主题为起点，随后切换并记住用户的选择', async () => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query === '(prefers-color-scheme: dark)',
  }))

  const button = mount(ThemeToggle).get('button')

  await button.trigger('click')
  expect(document.documentElement.dataset.theme).toBe('light')
  expect(localStorage.getItem('mc-theme')).toBe('light')

  await button.trigger('click')
  expect(document.documentElement.dataset.theme).toBe('dark')
  expect(localStorage.getItem('mc-theme')).toBe('dark')
})

it('浏览器禁止写入存储时仍能切换当前页面的主题', async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('Storage is disabled', 'SecurityError')
  })

  await mount(ThemeToggle).get('button').trigger('click')

  expect(document.documentElement.dataset.theme).toBe('dark')
})
