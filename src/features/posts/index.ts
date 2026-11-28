import { readPosts, type CompiledPost } from './read-posts'

export type { Article } from './read-posts'

const files = import.meta.glob<CompiledPost>('@content/posts/*.md', {
  eager: true,
  import: 'default',
})

export const posts = readPosts(files)
