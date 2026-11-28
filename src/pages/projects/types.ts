export type Project = {
  name: string
  description?: string
  icon?: string
  iconDark?: string
  url?: string
}

export type ProjectGroup = {
  id: string
  name: string
  projects: Project[]
}
