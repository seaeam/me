import type { RouteRecordRaw } from 'vue-router'
import { posts } from '@/features/posts'
import ArchivePage from '@/pages/archive/index.vue'
import HomePage from '@/pages/home/index.vue'
import PostPage from '@/pages/post/index.vue'
import ProjectsPage from '@/pages/projects/index.vue'
import { postPath, sections } from './sections'

export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomePage, meta: { art: 'plum' } },
  {
    path: sections.posts.path,
    component: ArchivePage,
    meta: { title: sections.posts.label, art: 'plum' },
  },
  {
    path: sections.projects.path,
    component: ProjectsPage,
    meta: { title: sections.projects.label, art: 'dots' },
  },
  ...posts.map(post => ({
    path: postPath(post.slug),
    component: PostPage,
    props: { post },
    meta: { title: post.title },
  })),
]
