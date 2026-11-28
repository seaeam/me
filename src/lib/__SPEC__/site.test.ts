import { expect, it, vi } from 'vitest'

const requiredSettings = {
  name: '站名',
  blogLabel: 'blog',
  projectsLabel: 'Projects',
}

async function loadSite(settings: unknown) {
  vi.resetModules()
  vi.doMock('@content/site.json', () => ({ default: settings }))

  return (await import('../site')).site
}

it('允许只设置必填的站名和导航文字', async () => {
  expect(await loadSite(requiredSettings)).toEqual(requiredSettings)
})

it('清理 CMS 留下的空白链接和标签前后的空格', async () => {
  const site = await loadSite({
    ...requiredSettings,
    github: '   ',
    blogLabel: ' blog ',
  })

  expect(site.github).toBeUndefined()
  expect(site.blogLabel).toBe('blog')
})

it.each([
  [null, 'site.json'],
  [{ ...requiredSettings, name: '  ' }, 'site.json.name'],
  [{ ...requiredSettings, projectsLabel: 0 }, 'site.json.projectsLabel'],
  [{ ...requiredSettings, afdian: false }, 'site.json.afdian'],
])('报告错误的站点字段 %#', async (settings, field) => {
  await expect(loadSite(settings)).rejects.toThrow(String(field))
})
