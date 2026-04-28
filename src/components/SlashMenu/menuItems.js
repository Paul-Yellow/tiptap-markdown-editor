const defaultChart = JSON.stringify({
  title: { text: '示例图表' },
  xAxis: { type: 'category', data: ['A', 'B', 'C'] },
  yAxis: {},
  series: [{ type: 'bar', data: [10, 20, 30] }]
}, null, 2)

// Get target node type name from command type
function getTargetTypeName(type) {
  const typeMap = {
    'setHeading': 'heading',
    'setParagraph': 'paragraph',
    'toggleBlockquote': 'blockquote',
    'toggleBulletList': 'bulletList',
    'toggleOrderedList': 'orderedList',
    'toggleCodeBlock': 'codeBlock',
    'setHorizontalRule': 'horizontalRule',
    'setCodeBlock': 'codeBlock',
    'setEChartsChart': 'echartsChart'
  }
  return typeMap[type]
}

// Convert current block to target type (used by slash menu and plus menu)
function convertBlock(editor, type, attrs) {
  const { state, view } = editor
  const { $from } = state.selection
  const nodePos = $from.before()
  const node = $from.node()

  const targetTypeName = getTargetTypeName(type)
  if (!targetTypeName) {
    // For toggle commands without mapping
    editor.chain().focus()[type](attrs).run()
    return
  }

  const targetNodeType = state.schema.nodes[targetTypeName]
  if (!targetNodeType) return

  let tr = state.tr

  if (type === 'setHorizontalRule') {
    // Replace with horizontal rule
    const hrNode = state.schema.nodes.horizontalRule.create()
    tr = tr.replaceWith(nodePos, nodePos + node.nodeSize, hrNode)
  } else if (type === 'setEChartsChart') {
    // Replace with ECharts node
    const chartNode = state.schema.nodes.echartsChart.create({ chartData: attrs })
    tr = tr.replaceWith(nodePos, nodePos + node.nodeSize, chartNode)
  } else if (targetTypeName === 'bulletList' || targetTypeName === 'orderedList') {
    // For lists, we need to wrap content in listItem nodes
    const listItemNodeType = state.schema.nodes.listItem

    // Get text content from current node
    const textContent = node.textContent
    const listItemNode = listItemNodeType.create(null, textContent ? state.schema.text(textContent) : null)
    const listNode = targetNodeType.create(null, listItemNode)
    tr = tr.replaceWith(nodePos, nodePos + node.nodeSize, listNode)
  } else {
    // Create new node with same content
    const newNode = targetNodeType.create(attrs, node.content)
    tr = tr.replaceWith(nodePos, nodePos + node.nodeSize, newNode)
  }

  view.dispatch(tr)
}

// Slash menu: convert current block (requires "/" prefix)
function slashAction(editor, type, attrs) {
  const { state } = editor
  const { $from } = state.selection
  const text = $from.parent.textBetween(0, $from.parentOffset)
  const match = text.match(/\/([^\s]*)$/)
  if (!match) return

  // Delete the slash text first
  const slashStart = $from.pos - match[0].length
  editor.chain().deleteRange({ from: slashStart, to: $from.pos }).run()

  // Now convert the block
  convertBlock(editor, type, attrs)
}

// Plus menu: convert current block if has content, insert new block if empty
function plusAction(editor, type, attrs) {
  const { state } = editor
  const { $from } = state.selection
  const node = $from.node()
  const hasContent = node.content.size > 0

  if (hasContent) {
    // Current block has content: convert it
    convertBlock(editor, type, attrs)
  } else {
    // Current block is empty: just change its type
    editor.chain().focus()[type](attrs).run()
  }
}

export const menuItems = [
  {
    label: '正文',
    desc: '普通文本段落',
    icon: 'text',
    keywords: '文本 段落 正文',
    command: (editor) => slashAction(editor, 'setParagraph'),
    plusCommand: (editor) => plusAction(editor, 'setParagraph')
  },
  {
    label: '标题 1',
    desc: '大章节标题',
    icon: 'h1',
    keywords: '标题  headings h1',
    command: (editor) => slashAction(editor, 'setHeading', { level: 1 }),
    plusCommand: (editor) => plusAction(editor, 'setHeading', { level: 1 })
  },
  {
    label: '标题 2',
    desc: '中等章节标题',
    icon: 'h2',
    keywords: '标题 headings h2',
    command: (editor) => slashAction(editor, 'setHeading', { level: 2 }),
    plusCommand: (editor) => plusAction(editor, 'setHeading', { level: 2 })
  },
  {
    label: '标题 3',
    desc: '小章节标题',
    icon: 'h3',
    keywords: '标题 headings h3',
    command: (editor) => slashAction(editor, 'setHeading', { level: 3 }),
    plusCommand: (editor) => plusAction(editor, 'setHeading', { level: 3 })
  },
  {
    label: '引用',
    desc: '引用文本块',
    icon: 'quote',
    keywords: '引用 引语 blockquote',
    command: (editor) => slashAction(editor, 'toggleBlockquote'),
    plusCommand: (editor) => plusAction(editor, 'toggleBlockquote')
  },
  {
    label: '无序列表',
    desc: '简单无序列表',
    icon: 'bullet',
    keywords: '列表 无序 圆点',
    command: (editor) => slashAction(editor, 'toggleBulletList'),
    plusCommand: (editor) => plusAction(editor, 'toggleBulletList')
  },
  {
    label: '有序列表',
    desc: '带序号的列表',
    icon: 'numbered',
    keywords: '列表 有序 序号',
    command: (editor) => slashAction(editor, 'toggleOrderedList'),
    plusCommand: (editor) => plusAction(editor, 'toggleOrderedList')
  },
  {
    label: '代码块',
    desc: '代码片段',
    icon: 'code',
    keywords: '代码 代码块',
    command: (editor) => slashAction(editor, 'toggleCodeBlock'),
    plusCommand: (editor) => plusAction(editor, 'setCodeBlock')
  },
  {
    label: '分割线',
    desc: '视觉分隔线',
    icon: 'divider',
    keywords: '分割线 横线 分隔符',
    command: (editor) => slashAction(editor, 'setHorizontalRule'),
    plusCommand: (editor) => plusAction(editor, 'setHorizontalRule')
  },
  {
    label: '表格',
    desc: '插入 3x3 表格',
    icon: 'table',
    keywords: '表格 table 网格',
    command: (editor) => {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    },
    plusCommand: (editor) => {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    }
  },
  {
    label: 'ECharts 代码块',
    desc: '渲染为图表的代码块',
    icon: 'chart',
    keywords: '图表 echarts 代码 json',
    command: (editor) => slashAction(editor, 'setCodeBlock', { language: 'echarts' }),
    plusCommand: (editor) => plusAction(editor, 'setCodeBlock', { language: 'echarts' })
  },
  {
    label: 'ECharts 图表',
    desc: '交互式图表',
    icon: 'chart',
    keywords: '图表 echarts 可视化',
    command: (editor) => slashAction(editor, 'setEChartsChart', defaultChart),
    plusCommand: (editor) => plusAction(editor, 'setEChartsChart', defaultChart)
  }
]
