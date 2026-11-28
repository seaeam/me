// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import ProjectEntry from '../project-entry/index.vue'

it('显示项目简介，按主题提供浅色与深色图标', () => {
  const entry = mount(ProjectEntry, {
    props: {
      project: {
        name: '组件库',
        description: '用于编辑器',
        icon: '/light.svg',
        iconDark: '/dark.svg',
      },
    },
  })

  expect(entry.get('p').text()).toBe('用于编辑器')
  expect(entry.get('.icon-light').attributes('src')).toBe('/light.svg')
  expect(entry.get('.icon-dark').attributes('src')).toBe('/dark.svg')
})
