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
    label: 'Text',
    desc: 'Plain text block',
    icon: 'text',
    keywords: 'text paragraph normal',
    command: (editor) => slashAction(editor, 'setParagraph'),
    plusCommand: (editor) => plusAction(editor, 'setParagraph')
  },
  {
    label: 'Heading 1',
    desc: 'Large section heading',
    icon: 'h1',
    keywords: 'heading title h1',
    command: (editor) => slashAction(editor, 'setHeading', { level: 1 }),
    plusCommand: (editor) => plusAction(editor, 'setHeading', { level: 1 })
  },
  {
    label: 'Heading 2',
    desc: 'Medium section heading',
    icon: 'h2',
    keywords: 'heading title h2',
    command: (editor) => slashAction(editor, 'setHeading', { level: 2 }),
    plusCommand: (editor) => plusAction(editor, 'setHeading', { level: 2 })
  },
  {
    label: 'Heading 3',
    desc: 'Small section heading',
    icon: 'h3',
    keywords: 'heading title h3',
    command: (editor) => slashAction(editor, 'setHeading', { level: 3 }),
    plusCommand: (editor) => plusAction(editor, 'setHeading', { level: 3 })
  },
  {
    label: 'Quote',
    desc: 'Capture a quote',
    icon: 'quote',
    keywords: 'blockquote quote cite',
    command: (editor) => slashAction(editor, 'toggleBlockquote'),
    plusCommand: (editor) => plusAction(editor, 'toggleBlockquote')
  },
  {
    label: 'Bullet List',
    desc: 'Simple unordered list',
    icon: 'bullet',
    keywords: 'bullet unordered list ul',
    command: (editor) => slashAction(editor, 'toggleBulletList'),
    plusCommand: (editor) => plusAction(editor, 'toggleBulletList')
  },
  {
    label: 'Numbered List',
    desc: 'List with ordering',
    icon: 'numbered',
    keywords: 'numbered ordered list ol',
    command: (editor) => slashAction(editor, 'toggleOrderedList'),
    plusCommand: (editor) => plusAction(editor, 'toggleOrderedList')
  },
  {
    label: 'Code Block',
    desc: 'Code snippet',
    icon: 'code',
    keywords: 'code snippet pre',
    command: (editor) => slashAction(editor, 'toggleCodeBlock'),
    plusCommand: (editor) => plusAction(editor, 'setCodeBlock')
  },
  {
    label: 'Divider',
    desc: 'Visual separator',
    icon: 'divider',
    keywords: 'divider hr horizontal rule separator',
    command: (editor) => slashAction(editor, 'setHorizontalRule'),
    plusCommand: (editor) => plusAction(editor, 'setHorizontalRule')
  },
  {
    label: 'ECharts 代码块',
    desc: 'Code block rendered as chart',
    icon: 'chart',
    keywords: 'echarts chart code json',
    command: (editor) => slashAction(editor, 'setCodeBlock', { language: 'echarts' }),
    plusCommand: (editor) => plusAction(editor, 'setCodeBlock', { language: 'echarts' })
  },
  {
    label: 'ECharts',
    desc: 'Interactive chart',
    icon: 'chart',
    keywords: 'chart graph echarts visualization',
    command: (editor) => slashAction(editor, 'setEChartsChart', defaultChart),
    plusCommand: (editor) => plusAction(editor, 'setEChartsChart', defaultChart)
  }
]
