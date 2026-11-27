<script setup lang="ts">
import { vContentLinks } from '@/lib/content-links'
import { site } from '@/lib/site'
import { sections } from '@/router/sections'
import SiteSignature from './signature.vue'
import ThemeToggle from './theme-toggle.vue'

const sectionIcons = {
  posts: 'i-ri-article-line',
  projects: 'i-ri-lightbulb-line',
}
</script>
<template>
  <header class="site-header">
    <SiteSignature />
    <nav aria-label="主导航">
      <div class="nav-items">
        <RouterLink
          v-for="(item, key) in sections"
          :key="item.path"
          :to="item.path"
          :aria-label="item.label"
          :title="item.label"
          class="nav-link">
          <i
            class="section-icon"
            :class="sectionIcons[key]"
            aria-hidden="true" />
          <span class="section-label">{{ item.label }}</span>
        </RouterLink>
        <a
          v-if="site.github"
          v-content-links="site.github"
          :href="site.github"
          class="nav-link"
          aria-label="GitHub 主页"
          title="GitHub 主页">
          <i class="i-uil-github-alt" aria-hidden="true" />
        </a>
        <ThemeToggle />
      </div>
    </nav>
  </header>
</template>

<style>
.site-header {
  position: relative;
  z-index: 3;
}
.site-header nav {
  display: grid;
  grid-template-columns: auto max-content;
  box-sizing: border-box;
  width: 100%;
  padding: 2rem;
}
.nav-items {
  grid-column: 2;
  display: grid;
  grid-auto-flow: column;
  gap: 1.2rem;
  align-items: center;
  justify-items: center;
}
.nav-link {
  margin: auto;
  color: inherit;
  text-decoration: none;
  opacity: 0.6;
  transition: opacity 0.2s ease;
  line-height: 24px;
}
.nav-link:hover,
.nav-link:focus-visible {
  opacity: 1;
}
.nav-link .section-icon {
  display: none;
}
.theme-toggle .sun {
  display: var(--light-only);
}
.theme-toggle .moon {
  display: var(--dark-only);
}
@media (max-width: 767.98px) {
  .site-header .signature {
    top: 10px;
  }
  .site-header nav {
    padding: 0.75rem 1rem;
  }
  .nav-items {
    gap: 0;
  }
  .nav-link {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
  }
  .nav-link .section-label {
    display: none;
  }
  .nav-link .section-icon {
    display: block;
  }
  .nav-link[aria-current='page'] {
    opacity: 1;
  }
}
</style>
