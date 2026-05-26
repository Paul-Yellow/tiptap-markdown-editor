import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    },
    dedupe: [
      'vue',
      '@tiptap/core',
      '@tiptap/vue-3',
      '@tiptap/pm',
      '@tiptap/starter-kit',
      '@tiptap/markdown',
      '@tiptap/extension-link',
      '@tiptap/extension-underline',
      '@tiptap/extension-placeholder',
      '@tiptap/extension-text-style',
      '@tiptap/extension-color',
      '@tiptap/extension-text-align',
      '@tiptap/extension-list',
      '@tiptap/extension-table',
      '@tiptap/extension-table-row',
      '@tiptap/extension-table-header',
      '@tiptap/extension-table-cell',
      'prosemirror-state',
      'prosemirror-view',
      'prosemirror-model',
      'prosemirror-transform',
      'prosemirror-keymap',
      'prosemirror-history',
      'prosemirror-inputrules',
      'prosemirror-collab',
      'prosemirror-schema-basic',
      'prosemirror-schema-list',
      'prosemirror-dropcursor',
      'prosemirror-gapcursor',
      'prosemirror-commands',
    ]
  }
})