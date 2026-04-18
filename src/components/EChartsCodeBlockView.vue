<template>
  <NodeViewWrapper
    class="code-block-wrapper"
    :class="{ 'is-echarts': isECharts, 'is-selected': selected }"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <div v-if="isECharts" class="echarts-code-block">
      <div class="echarts-code-block-toolbar" v-if="selected || hovered">
        <button @click.stop="editChart" class="echarts-code-edit-btn">编辑</button>
        <button @click.stop="toggleView" class="echarts-code-toggle-btn">
          {{ showChart ? '代码' : '图表' }}
        </button>
        <button @click.stop="deleteChart" class="echarts-code-delete-btn">删除</button>
      </div>
      <div v-if="showChart" ref="chartRef" class="echarts-code-chart-container"></div>
      <div v-else class="echarts-code-editable" contenteditable="true" @input="onInput" v-text="nodeContent"></div>

      <!-- Edit dialog -->
      <Teleport to="body">
        <div v-if="editing" class="chart-edit-overlay" @click.self="cancelEdit">
          <div class="chart-edit-dialog">
            <div class="chart-edit-header">
              <h3>编辑图表配置</h3>
              <button class="chart-edit-close" @click="cancelEdit">&times;</button>
            </div>
            <div class="chart-edit-body">
              <textarea ref="editorRef" v-model="editJson" class="chart-json-editor" spellcheck="false" />
              <div v-if="editError" class="chart-edit-error">{{ editError }}</div>
            </div>
            <div class="chart-edit-footer">
              <button @click="cancelEdit">取消</button>
              <button class="chart-edit-save" @click="saveEdit">保存</button>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
    <NodeViewContent v-else class="code-block-content" />
  </NodeViewWrapper>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed, nextTick } from 'vue'
import { NodeViewWrapper, NodeViewContent, nodeViewProps } from '@tiptap/vue-3'
import echarts from '../echarts'

const props = defineProps(nodeViewProps)

const chartRef = ref(null)
let chartInstance = null
const hovered = ref(false)
const showChart = ref(true)

const editing = ref(false)
const editJson = ref('')
const editError = ref('')
const editorRef = ref(null)

const isECharts = computed(() => {
  return props.node?.attrs?.language === 'echarts'
})

const nodeContent = computed(() => {
  return props.node?.textContent || ''
})

function renderChart() {
  if (!isECharts.value || !showChart.value || !chartRef.value) return
  if (chartRef.value.clientWidth === 0 || chartRef.value.clientHeight === 0) {
    setTimeout(renderChart, 100)
    return
  }
  try {
    const text = nodeContent.value.trim()
    const option = JSON.parse(text)
    if (!chartInstance) {
      chartInstance = echarts.init(chartRef.value)
    }
    chartInstance.setOption(option, true)
  } catch {
    // Invalid JSON, skip
  }
}

function onInput(e) {
  const pos = props.getPos()
  const from = pos + 1
  const to = pos + 1 + nodeContent.value.length
  const text = e.target.textContent
  props.editor?.commands.insertContentAt({ from, to }, text)
}

function editChart() {
  try {
    editJson.value = JSON.stringify(JSON.parse(nodeContent.value.trim()), null, 2)
  } catch {
    editJson.value = nodeContent.value
  }
  editError.value = ''
  editing.value = true
  nextTick(() => editorRef.value?.focus())
}

function cancelEdit() {
  editing.value = false
}

function saveEdit() {
  try {
    const parsed = JSON.parse(editJson.value)
    const jsonStr = JSON.stringify(parsed, null, 2)
    const pos = props.getPos()
    const from = pos + 1
    const to = pos + 1 + nodeContent.value.length
    props.editor?.commands.insertContentAt({ from, to }, jsonStr)
    editError.value = ''
    editing.value = false
  } catch (e) {
    editError.value = `JSON 格式错误: ${e.message}`
  }
}

function toggleView() {
  showChart.value = !showChart.value
  if (showChart.value) {
    setTimeout(renderChart, 50)
  }
}

function deleteChart() {
  const pos = props.getPos()
  props.editor?.chain()
    .setNodeSelection(pos)
    .deleteSelection()
    .run()
}

onMounted(() => {
  if (isECharts.value) {
    setTimeout(() => renderChart(), 200)
  }
})

watch(() => props.node?.textContent, () => {
  if (isECharts.value && showChart.value) {
    renderChart()
  }
})

watch(showChart, (val) => {
  if (val) setTimeout(renderChart, 50)
  else if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped>
.code-block-wrapper {
  position: relative;
}

.echarts-code-block {
  position: relative;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: visible;
  margin: 8px 0;
}

.echarts-code-block:hover {
  border-color: #3b82f6;
}

.echarts-code-block-toolbar {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  z-index: 10;
}

.echarts-code-edit-btn,
.echarts-code-toggle-btn,
.echarts-code-delete-btn {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #ddd;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  color: #333;
  backdrop-filter: blur(4px);
}

.echarts-code-edit-btn:hover {
  background: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
}

.echarts-code-toggle-btn:hover {
  background: #10b981;
  color: #fff;
  border-color: #10b981;
}

.echarts-code-delete-btn:hover {
  background: #ef4444;
  color: #fff;
  border-color: #ef4444;
}

.echarts-code-chart-container {
  width: 100%;
  height: 400px;
}

.echarts-code-editable {
  background: #f6f8fa;
  padding: 12px;
  margin: 0;
  font-family: monospace;
  font-size: 13px;
  min-height: 200px;
  white-space: pre-wrap;
  word-break: break-all;
  outline: none;
  border: none;
  overflow: auto;
}

.echarts-code-editable:focus {
  background: #fff;
  border: 1px solid #3b82f6;
}

.chart-edit-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
}
.chart-edit-dialog {
  background: #fff;
  border-radius: 12px;
  width: 700px;
  max-width: 90vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: dialog-enter 0.2s ease-out;
}
@keyframes dialog-enter {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
.chart-edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}
.chart-edit-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}
.chart-edit-close {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #9ca3af;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.15s;
}
.chart-edit-close:hover {
  background: #f3f4f6;
  color: #374151;
}
.chart-edit-body {
  padding: 20px 24px;
  flex: 1;
  overflow-y: auto;
}
.chart-json-editor {
  width: 100%;
  min-height: 350px;
  max-height: 50vh;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  resize: vertical;
  background: #f9fafb;
  transition: border-color 0.15s;
}
.chart-json-editor:focus {
  outline: none;
  border-color: #3b82f6;
  background: #fff;
}
.chart-edit-error {
  color: #dc2626;
  margin-top: 12px;
  font-size: 14px;
  padding: 12px 16px;
  background: #fef2f2;
  border-radius: 8px;
  border: 1px solid #fecaca;
}
.chart-edit-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 0 12px 12px;
}
.chart-edit-footer button {
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.15s;
}
.chart-edit-footer button:first-child {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
}
.chart-edit-footer button:first-child:hover {
  background: #f3f4f6;
}
.chart-edit-save {
  background: #3b82f6;
  color: #fff;
  border: none;
}
.chart-edit-save:hover {
  background: #2563eb;
}

.code-block-content {
  margin: 0;
}
</style>
