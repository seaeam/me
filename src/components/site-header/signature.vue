<script setup lang="ts">
import signature from '@/assets/brand/signature.svg?raw'
import { site } from '@/lib/site'
</script>

<template>
  <RouterLink to="/" class="signature" :aria-label="site.name + ' 首页'">
    <span aria-hidden="true" v-html="signature" />
  </RouterLink>
</template>

<style>
.signature {
  position: absolute;
  display: grid;
  align-items: center;
  justify-items: start;
  left: 20px;
  top: 20px;
  width: 82.56px;
  height: 48px;
  color: var(--pen);
  user-select: none;
}
.signature svg {
  display: block;
  width: 64px;
  height: auto;
}
@media (min-width: 1280px) {
  .signature {
    position: fixed;
  }
}
/* 按笔顺显出原字形，再沿笔迹收回。 */
@property --written {
  syntax: '<number>';
  initial-value: 1;
  inherits: true;
}
@keyframes sign {
  0% {
    --written: 0;
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  40%,
  85% {
    --written: 1;
    opacity: 1;
  }
  94.99% {
    opacity: 1;
  }
  95%,
  100% {
    --written: 0;
    opacity: 0;
  }
}
@media (prefers-reduced-motion: no-preference) {
  .signature svg {
    animation: sign 10s ease infinite;
  }
  .pen {
    stroke-dasharray: 100 150;
    stroke-dashoffset: clamp(
      0px,
      calc((var(--end) - var(--written)) * var(--rate)),
      110px
    );
  }
  .pen-s {
    --end: 0.2;
    --rate: 550px;
  }
  .pen-e {
    --end: 0.42;
    --rate: 500px;
  }
  .pen-a {
    --end: 0.69;
    --rate: 407.407px;
  }
  .pen-m {
    --end: 1;
    --rate: 354.839px;
  }
}
</style>
