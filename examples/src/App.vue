<template>
  <div class="app">
    <header class="header">
      <h1>TipTap Markdown Editor 示例</h1>
      <nav class="nav">
        <button
          v-for="(item, idx) in examples"
          :key="idx"
          :class="{ active: current === idx }"
          @click="current = idx"
        >
          {{ item.label }}
        </button>
      </nav>
    </header>
    <main class="main">
      <component :is="examples[current].component" />
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ExampleBasic from './01-basic.vue'
import ExampleExport from './02-export.vue'
import ExampleReadonly from './03-readonly.vue'
import ExampleCustomMenu from './04-custom-menu.vue'
import ExampleStreaming from './05-streaming.vue'

const examples = [
  { label: '01-基础用法', component: ExampleBasic },
  { label: '02-导出功能', component: ExampleExport },
  { label: '03-只读预览', component: ExampleReadonly },
  { label: '04-自定义菜单', component: ExampleCustomMenu },
  { label: '05-流式输出', component: ExampleStreaming }
]

const current = ref(0)
</script>

<style>
.app {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  background: #fff;
  padding: 16px 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header h1 {
  margin: 0 0 12px 0;
  font-size: 20px;
}

.nav {
  display: flex;
  gap: 8px;
}

.nav button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.15s;
}

.nav button:hover {
  background: #f0f0f0;
}

.nav button.active {
  background: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
}

.main {
  padding: 24px;
}
</style>