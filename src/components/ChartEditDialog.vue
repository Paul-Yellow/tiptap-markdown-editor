<template>
  <Teleport to="body">
    <div v-if="visible" class="chart-edit-overlay" @click.self="close">
      <div class="chart-edit-dialog">
        <div class="chart-edit-header">
          <h3>编辑图表配置</h3>
          <button class="chart-edit-close" @click="close">&times;</button>
        </div>
        <div class="chart-edit-body">
          <textarea
            ref="editorRef"
            v-model="jsonText"
            class="chart-json-editor"
            spellcheck="false"
          />
          <div v-if="error" class="chart-edit-error">{{ error }}</div>
        </div>
        <div class="chart-edit-footer">
          <button @click="close">取消</button>
          <button class="chart-edit-save" @click="save">保存</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const visible = ref(false)
const jsonText = ref('')
const error = ref('')
const emit = defineEmits(['save', 'close'])
const editorRef = ref(null)

function open(jsonConfig) {
  try {
    jsonText.value = JSON.stringify(JSON.parse(jsonConfig), null, 2)
  } catch {
    jsonText.value = jsonConfig
  }
  error.value = ''
  visible.value = true
  nextTick(() => editorRef.value?.focus())
}

function close() {
  visible.value = false
  emit('close')
}

function save() {
  try {
    const parsed = JSON.parse(jsonText.value)
    if (!parsed.series || !Array.isArray(parsed.series)) {
      throw new Error('缺少 series 配置')
    }
    error.value = ''
    emit('save', JSON.stringify(parsed, null, 2))
    close()
  } catch (e) {
    error.value = `JSON 格式错误: ${e.message}`
  }
}

defineExpose({ open })
</script>

<style scoped>
.chart-edit-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}
.chart-edit-dialog {
  background: #fff;
  border-radius: 8px;
  width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}
.chart-edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}
.chart-edit-header h3 { margin: 0; }
.chart-edit-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}
.chart-edit-body { padding: 16px 20px; flex: 1; }
.chart-json-editor {
  width: 100%;
  min-height: 300px;
  font-family: monospace;
  font-size: 13px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
}
.chart-edit-error {
  color: #e74c3c;
  margin-top: 8px;
  font-size: 13px;
}
.chart-edit-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid #eee;
}
.chart-edit-save {
  background: #3b82f6;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}
</style>
