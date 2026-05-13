import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/entry.js'),
      name: 'TiptapMarkdownEditor',
      fileName: 'tiptap-markdown-editor',
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external: [
        'vue',
        '@tiptap/core',
        '@tiptap/vue-3',
        '@tiptap/extension-text-style',
        '@tiptap/extension-text-align',
        '@tiptap/extension-list',
      ],
      output: {
        globals: {
          vue: 'Vue',
          '@tiptap/core': 'tiptapCore',
          '@tiptap/vue-3': 'tiptapVue3',
          '@tiptap/extension-text-style': 'tiptapTextStyle',
          '@tiptap/extension-text-align': 'tiptapTextAlign',
          '@tiptap/extension-list': 'tiptapList',
        },
      },
    },
    cssCodeSplit: false,
  },
})
