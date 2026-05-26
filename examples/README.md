# 示例

本目录包含 `tiptap-markdown-editor` 的使用示例。

## 示例列表

| 示例 | 说明 |
| --- | --- |
| [01-basic.vue](./01-basic.vue) | 基础用法 - 编辑器和获取内容 |
| [02-export.vue](./02-export.vue) | 导出功能 - PDF 和 DOCX |
| [03-readonly.vue](./03-readonly.vue) | 只读预览模式 |
| [04-custom-menu.vue](./04-custom-menu.vue) | 自定义 Slash 菜单 |
| [05-streaming.vue](./05-streaming.vue) | AI 流式输出 / 打字机效果 |

## 运行示例

```bash
# 克隆仓库后
cd markdown-editor
npm install

# 将 App.vue 替换为对应示例
cp examples/01-basic.vue src/App.vue
npm run dev
```

## 更多文档

详见 [README.md](../README.md)
