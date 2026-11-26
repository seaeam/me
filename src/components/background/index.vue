<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import PlumBranches from './plum-branches.vue'

const DotField = defineAsyncComponent(() => import('./dot-field.vue'))
const route = useRoute()
</script>

<template>
  <DotField v-if="route.meta.art === 'dots'" />
  <PlumBranches v-else-if="route.meta.art === 'plum'" />
</template>

<style>
.dot-field, .plum-canvas {
  display: block; position: fixed; z-index: 0; inset: 0; width: 100%; height: 100%;
  pointer-events: none;
}
.plum-canvas { mask-image: radial-gradient(circle, transparent, black); }
.dot-field { filter: var(--dot-filter); }
</style>
