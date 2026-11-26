<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ groups: { id: string; name: string }[] }>()
const open = ref(false)
const toggle = ref<HTMLButtonElement>()

function leavePointer(event: PointerEvent) {
  if (event.pointerType === 'mouse' && !(event.currentTarget as HTMLElement).contains(document.activeElement))
    open.value = false
}
function leaveFocus(event: FocusEvent) {
  if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null))
    open.value = false
}
function dismiss() {
  toggle.value?.focus()
  open.value = false
}
</script>

<template>
  <nav
    class="project-toc"
    :class="{ open }"
    aria-label="项目目录"
    @pointerenter="$event.pointerType === 'mouse' && (open = true)"
    @pointerleave="leavePointer"
    @focusout="leaveFocus"
    @keydown.esc.prevent="dismiss">
    <button
      ref="toggle" type="button" aria-label="项目目录"
      aria-controls="project-contents" :aria-expanded="open"
      @click="open = !open">
      <i class="i-ri-menu-2-fill" aria-hidden="true" />
    </button>
    <ul id="project-contents" :inert="!open">
      <li v-for="group in groups" :key="group.id">
        <a :href="'#' + group.id" @click="open = false">{{ group.name }}</a>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.project-toc { display: none; }
@media screen and (min-width: 1024px) {
  .project-toc {
    position: fixed;
    z-index: 2;
    top: 90px;
    left: 20px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: max-content;
    max-width: 200px;
    max-height: calc(100dvh - 90px);
    font-size: .8rem;
    pointer-events: none;
  }
  .project-toc.open { pointer-events: auto; }
  .project-toc button {
    display: grid;
    flex: none;
    place-items: center;
    width: 1.75rem;
    height: 1.75rem;
    margin-inline: .5rem;
    border-radius: .25rem;
    color: #8887;
    background: var(--paper);
    font-size: 1.125rem;
    pointer-events: auto;
  }
  .project-toc.open button, .project-toc button:focus-visible { color: var(--ink); }
  .project-toc button i { width: 1em; height: 1em; }
  .project-toc ul {
    overflow-y: auto;
    margin: .25rem 0 0;
    padding: 0 .8rem 1.25rem;
    list-style: none;
    visibility: hidden;
    opacity: 0;
    transition: opacity .7s, visibility 0s .7s;
  }
  .project-toc.open ul {
    visibility: visible;
    opacity: 1;
    transition-delay: 0s;
  }
  .project-toc li { margin-top: .5em; line-height: 1.5; overflow-wrap: anywhere; }
  .project-toc a { color: inherit; text-decoration: none; opacity: .6; }
  .project-toc a:is(:hover, :focus-visible) { opacity: 1; }
}
@media (min-width: 1280px) {
  .project-toc { max-width: 300px; }
}
@media (prefers-reduced-motion: reduce) {
  .project-toc ul { transition: none; }
}
</style>
