export type Article = {
  title: string
  date: string
  html: string
  slug: string
  duration?: string
}

const files = import.meta.glob<Omit<Article, 'slug'>>('@content/posts/*.md', {
  eager: true,
  import: 'default',
})

export const posts: Article[] = Object.entries(files)
  .map(([path, page]) => ({
    ...page,
    slug: path.slice(path.lastIndexOf('/') + 1, -3),
  }))
  .sort((a, b) => b.date.localeCompare(a.date))
