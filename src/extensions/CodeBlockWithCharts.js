import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import EChartsCodeBlockView from '../components/EChartsCodeBlockView.vue'

export const CodeBlockWithCharts = Node.create({
  name: 'codeBlock',
  group: 'block',
  content: 'text*',
  marks: '',
  code: true,
  defining: true,
  markdownTokenName: 'code',

  addOptions() {
    return {
      languageClassPrefix: 'language-',
      defaultLanguage: null
    }
  },

  addAttributes() {
    return {
      language: {
        default: this.options.defaultLanguage,
        parseHTML: (element) => {
          const { languageClassPrefix } = this.options
          const classNames = [...(element.firstElementChild?.classList) || []]
          const languages = classNames
            .filter(cls => cls.startsWith(languageClassPrefix))
            .map(cls => cls.replace(languageClassPrefix, ''))
          return languages[0] || null
        },
        rendered: false
      }
    }
  },

  parseHTML() {
    return [{ tag: 'pre', preserveWhitespace: 'full' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'pre',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      [
        'code',
        { class: node.attrs.language ? this.options.languageClassPrefix + node.attrs.language : null },
        0
      ]
    ]
  },

  addNodeView() {
    return VueNodeViewRenderer(EChartsCodeBlockView)
  },

  parseMarkdown(token, helpers) {
    if (token.raw?.startsWith('```') === false && token.raw?.startsWith('~~~') === false && token.codeBlockStyle !== 'indented') {
      return []
    }
    return helpers.createNode(
      'codeBlock',
      { language: token.lang || null },
      token.text ? [helpers.createTextNode(token.text)] : []
    )
  },

  renderMarkdown(node, h) {
    const language = node.attrs?.language || ''
    if (!node.content) {
      return `\`\`\`${language}\n\n\`\`\``
    }
    return `\`\`\`${language}\n${h.renderChildren(node.content)}\n\`\`\``
  },

  addCommands() {
    return {
      setCodeBlock: options => ({ commands }) => commands.setNode(this.name, options),
      toggleCodeBlock: options => ({ commands }) => commands.toggleNode(this.name, 'paragraph', options)
    }
  },

  addKeyboardShortcuts() {
    return { 'Mod-Alt-c': () => this.editor.commands.toggleCodeBlock() }
  }
})
