<template>
  <div style="max-width: 1200px; margin: 24px auto; padding: 0 16px;">
    <h2>自定义 Slash 菜单</h2>
    <MarkdownEditor
      ref="editorRef"
      v-model="content"
      height="400px"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { MarkdownEditor, menuItems, slashAction, plusAction } from '../src/entry'

const content = ref('# 自定义菜单示例\n\n尝试输入 `/` 查看自定义菜单')
const editorRef = ref(null)

// 可以在组件挂载后自定义菜单项
onMounted(() => {
  // 示例：添加自定义菜单项
  // const customItems = [
  //   ...menuItems,
  //   {
  //     label: '自定义块',
  //     desc: '自定义的块类型',
  //     icon: 'star',
  //     keywords: '自定义',
  //     command: (editor) => slashAction(editor, 'setHeading', { level: 1 }),
  //     plusCommand: (editor) => plusAction(editor, 'setHeading', { level: 1 })
  //   }
  // ]
})
</script>
