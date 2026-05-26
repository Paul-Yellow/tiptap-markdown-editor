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
        /^@tiptap\/.*/,
        /^prosemirror-.*/,
      ],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
    cssCodeSplit: false,
  },
})