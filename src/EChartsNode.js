import { Node } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import EChartsNodeView from './components/EChartsNodeView.vue'

export const EChartsNode = Node.create({
  name: 'echartsChart',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      chartData: {
        default: '{}'
      },
      onEdit: {
        default: null
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="echarts-chart"]'
      }
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'echarts-chart', ...HTMLAttributes }]
  },

  addNodeView() {
    return VueNodeViewRenderer(EChartsNodeView)
  },

  addCommands() {
    return {
      setEChartsChart: (options) => ({ commands }) => {
        const data = typeof options === 'string' ? options : JSON.stringify(options, null, 2)
        return commands.insertContent({
          type: this.name,
          attrs: { chartData: data }
        })
      }
    }
  }
})
