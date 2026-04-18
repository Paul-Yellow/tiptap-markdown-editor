import { Extension } from '@tiptap/core'
import { textblockTypeInputRule, wrappingInputRule } from '@tiptap/core'

// # 空格 -> 标题
const headingRule = (level) => textblockTypeInputRule({
  find: new RegExp(`^(#{1,${level}})\\s$`),
  type: 'heading',
  getAttributes: { level }
})

// - 或 * 空格 -> 无序列表
const bulletListRule = wrappingInputRule({
  find: new RegExp('^[-*]\\s$'),
  type: 'bulletList'
})

// 1. 空格 -> 有序列表
const orderedListRule = wrappingInputRule({
  find: new RegExp('^1\\.\\s$'),
  type: 'orderedList'
})

// > 空格 -> 引用块
const blockquoteRule = wrappingInputRule({
  find: new RegExp('^>\\s$'),
  type: 'blockquote'
})

// ``` -> 代码块
const codeBlockRule = textblockTypeInputRule({
  find: new RegExp('^```$'),
  type: 'codeBlock'
})

// --- 或 *** -> 分割线
const horizontalRuleRule = textblockTypeInputRule({
  find: new RegExp('^(---|\\*\\*\\*)$'),
  type: 'horizontalRule'
})

export const MarkdownInputRules = Extension.create({
  name: 'markdownInputRules',

  addInputRules() {
    const rules = []

    // 添加标题规则 (H1-H6)
    for (let level = 1; level <= 6; level++) {
      rules.push(headingRule(level))
    }

    // 添加其他规则
    rules.push(bulletListRule)
    rules.push(orderedListRule)
    rules.push(blockquoteRule)
    rules.push(codeBlockRule)
    rules.push(horizontalRuleRule)

    return rules
  }
})