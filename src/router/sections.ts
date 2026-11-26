import { site } from '@/lib/site'

export const sections = {
  posts: { path: '/posts', label: site.blogLabel },
  projects: { path: '/projects', label: site.projectsLabel },
}

export function postPath(slug: string) {
  return sections.posts.path + '/' + encodeURIComponent(slug)
}
