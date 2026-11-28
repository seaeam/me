// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { createSSRApp, defineComponent } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { expect, it } from 'vitest'
import { vContentLinks } from '../content-links'

it('静态渲染和客户端挂载都为站外网页启用新标签页', async () => {
  const projectLink = defineComponent({
    directives: { contentLinks: vContentLinks },
    setup: () => ({ href: 'https://example.org/project' }),
    template: '<a v-content-links="href" :href="href">项目</a>',
  })

  const html = await renderToString(createSSRApp(projectLink))

  expect(html).toContain('target="_blank"')
  expect(html).toContain('rel="noopener"')

  const wrapper = mount(projectLink)

  expect(wrapper.get('a').attributes()).toMatchObject({
    target: '_blank',
    rel: 'noopener',
  })
  wrapper.unmount()
})
