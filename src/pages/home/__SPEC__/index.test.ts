// @vitest-environment jsdom
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import MarkdownIt from 'markdown-it'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import HomePage from '../index.vue'

vi.mock('@content/home.md?live-issues', async () => {
  const { default: source } = await import('@content/home.md?raw')

  return {
    default: {
      source: 'home.md',
      sections: [{ html: new MarkdownIt().render(source) }],
    },
  }
})

enableAutoUnmount(afterEach)

const getAnimations = vi.fn<(this: Element) => { finished: Promise<void> }[]>(
  () => [],
)

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
  Object.defineProperty(Element.prototype, 'getAnimations', {
    configurable: true,
    value: getAnimations.mockReset(),
  })
})

afterEach(() => {
  Reflect.deleteProperty(Element.prototype, 'getAnimations')
})

function mockIconLayout(positions: number[][]) {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: Element) {
      if (this.matches('a:has(img[src$="/converge.png"])'))
        return new DOMRect(180, 120, 120, 30)

      if (this.matches('ul:has(img[src^="/media/products/"])'))
        return new DOMRect(100, 180, 248, 100)

      if (this.matches('img[src^="/media/products/"]')) {
        const item = this.closest('li')!
        const index = [...item.parentElement!.children].indexOf(item)

        const [left, top] = positions[index]

        return new DOMRect(left, top, 20, 20)
      }

      return new DOMRect(100, 100, 500, 600)
    },
  )
}

it('公司下方共用一条主干，四条圆角分支从横线落到各自图标上方', async () => {
  mockIconLayout([
    [120, 200],
    [220, 200],
    [320, 200],
    [420, 200],
  ])

  const page = mount(HomePage)

  await flushPromises()

  const drawing = page.get('svg[aria-hidden="true"]')
  const stem = drawing.findAll('path.stem')

  expect(stem).toHaveLength(1)
  expect(stem[0].attributes('d')).toMatch(/^M 140 50 V /)

  const junction = Number(stem[0].attributes('d')!.split(' V ')[1])
  const rails = drawing.findAll('path.rail')
  const branches = drawing.findAll('path.branch')

  expect(junction).toBeGreaterThan(50)
  expect(junction).toBeLessThan(95)
  expect(rails).toHaveLength(2)
  for (const rail of rails)
    expect(rail.attributes('d')).toContain(`M 140 ${junction} H `)

  expect(branches).toHaveLength(4)
  for (const [index, branch] of branches.entries()) {
    const path = branch.attributes('d')
    const tip = 30 + index * 100

    expect(path).toContain(` ${junction} Q ${tip} ${junction}, ${tip} `)
    expect(path).toMatch(/V 9[0-9]$/)
  }
})

it('两列产品从中间同一条竖线分支，左右端点停在各产品内容的内侧', async () => {
  mockIconLayout([
    [140, 200],
    [260, 200],
    [132, 250],
    [250, 250],
  ])

  const bounds: Record<string, DOMRect> = {
    Covey: new DOMRect(140, 200, 58, 20),
    Enter: new DOMRect(260, 200, 55, 20),
    Framia: new DOMRect(132, 250, 72, 20),
    Combos: new DOMRect(250, 250, 75, 20),
  }

  const createRange = document.createRange.bind(document)

  vi.spyOn(document, 'createRange').mockImplementation(() => {
    const range = createRange()

    range.getBoundingClientRect = () => bounds[range.toString().trim()]

    return range
  })

  const page = mount(HomePage)

  await flushPromises()

  expect(page.get('path.stem').attributes('d')).toBe('M 124 50 V 160')
  expect(page.findAll('path.rail')).toHaveLength(0)
  expect(
    page.findAll('path.branch').map((branch) => branch.attributes('d')),
  ).toEqual([
    'M 124 110 H 103',
    'M 124 110 H 155',
    'M 124 160 H 109',
    'M 124 160 H 145',
  ])
})

it('公司标签和产品行都完成上移动画后才开始连线', async () => {
  let finishCompany!: () => void
  let finishProducts!: () => void
  const company = new Promise<void>((resolve) => (finishCompany = resolve))
  const products = new Promise<void>((resolve) => (finishProducts = resolve))

  getAnimations.mockImplementation(function (this: Element) {
    const finished = this.matches('ul') ? products : company

    return [{ finished }]
  })

  const page = mount(HomePage)
  const curves = () => page.findAll('svg[aria-hidden="true"] path.branch')

  finishCompany()
  await flushPromises()
  expect(curves()).toHaveLength(0)

  finishProducts()
  await flushPromises()
  expect(curves()).toHaveLength(4)
})
