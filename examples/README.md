# 示例

本目录是 `@paulyellow/tiptap-markdown-editor` 的完整 Vue3 项目示例。

## 快速开始

```bash
# 进入 examples 目录
cd examples

# 安装依赖
npm install

# 运行开发服务器
npm run dev
```

然后打开 http://localhost:5173 查看。

## 示例列表

| 示例 | 说明 |
| --- | --- |
| [01-basic.vue](./src/01-basic.vue) | 基础用法 - 编辑器和获取内容 |
| [02-export.vue](./src/02-export.vue) | 导出功能 - PDF 和 DOCX |
| [03-readonly.vue](./src/03-readonly.vue) | 只读预览模式 |
| [04-custom-menu.vue](./src/04-custom-menu.vue) | 自定义 Slash 菜单 |
| [05-streaming.vue](./src/05-streaming.vue) | AI 流式输出 / 打字机效果 |

## 项目结构

```
examples/
├── index.html          # 入口 HTML
├── package.json        # 项目配置
├── vite.config.js      # Vite 配置
├── README.md           # 说明文档
└── src/
    ├── main.js         # Vue 入口
    ├── App.vue         # 主应用
    ├── 01-basic.vue    # 基础用法示例
    ├── 02-export.vue   # 导出功能示例
    ├── 03-readonly.vue # 只读预览示例
    ├── 04-custom-menu.vue # 自定义菜单示例
    └── 05-streaming.vue # 流式输出示例
```

## 使用说明

所有示例都引用 npm 包 `@paulyellow/tiptap-markdown-editor`：

```javascript
import { MarkdownEditor } from '@paulyellow/tiptap-markdown-editor'
import '@paulyellow/tiptap-markdown-editor/style.css'
```

## 更多文档

详见 [README.md](../README.md)