import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

function getSlashQuery($from) {
  const text = $from.parent.textBetween(0, $from.parentOffset)
  const match = text.match(/\/([^\s]*)$/)
  return match ? match[1] : null
}

export const SlashMenuExtension = Extension.create({
  name: 'slashMenu',

  addStorage() {
    return {
      visible: false,
      query: ''
    }
  },

  addProseMirrorPlugins() {
    const { editor, storage } = this

    return [
      new Plugin({
        key: new PluginKey('slashMenu'),
        state: {
          init: () => false,
          apply(tr) {
            const { $from } = tr.selection
            const query = getSlashQuery($from)
            if (query !== null) {
              storage.visible = true
              storage.query = query
            } else {
              storage.visible = false
              storage.query = ''
            }
            return tr.docChanged || tr.selectionSet
          }
        },
        props: {
          handleKeyDown(view, event) {
            if (!storage.visible) return false
            if (event.key === 'Escape') {
              storage.visible = false
              storage.query = ''
              return true
            }
            if (event.key === 'Enter' || event.key === 'Tab') {
              event.preventDefault()
              storage._selectCurrent?.()
              return true
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault()
              storage._moveUp?.()
              return true
            }
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              storage._moveDown?.()
              return true
            }
            return false
          }
        }
      })
    ]
  }
})
