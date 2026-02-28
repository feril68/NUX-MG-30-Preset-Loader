<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAdditionalInfoStorage } from '../services/ai/storage'
import MG30PageLayout from '../components/MG30PageLayout.vue'

const router = useRouter()
const { additionalInfo, generatedJsonOutput, refresh } = useAdditionalInfoStorage()
const isJsonOutputOpen = ref(false)
const copyStatus = ref('')

onMounted(() => {
  refresh()
})

function goToAiLoader(): void {
  void router.push('/ai-loader')
}

function goToJsonLoader(): void {
  void router.push('/')
}

function toggleJsonOutput(): void {
  isJsonOutputOpen.value = !isJsonOutputOpen.value
}

async function copyJsonOutput(): Promise<void> {
  const content = generatedJsonOutput.value.trim()
  if (!content) {
    copyStatus.value = 'No JSON to copy'
    return
  }

  try {
    await navigator.clipboard.writeText(content)
    copyStatus.value = 'Copied'
  } catch {
    copyStatus.value = 'Copy failed'
  }
}
</script>

<template>
  <MG30PageLayout title="MG-30 : AI ADDITIONAL INFO">
    <template #content>
      <div class="content-wrapper">
        <div class="content-label">ADDITIONAL INFO (MARKDOWN)</div>
        <pre class="markdown-text">{{ additionalInfo || 'No additionalInfo found.' }}</pre>

        <div class="json-section">
          <button type="button" class="json-header" @click="toggleJsonOutput">
            <span class="json-title">JSON OUTPUT</span>
            <span class="json-toggle">{{ isJsonOutputOpen ? '▲' : '▼' }}</span>
          </button>

          <div v-if="isJsonOutputOpen" class="json-tools">
            <button type="button" class="copy-btn" @click="copyJsonOutput">COPY JSON</button>
            <span class="copy-status">{{ copyStatus || '\u00A0' }}</span>
          </div>

          <pre v-if="isJsonOutputOpen" class="json-text">
            {{ generatedJsonOutput || 'No JSON output found.' }}
          </pre>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="actions">
        <button class="nav-btn" @click="goToAiLoader">BACK TO AI LOADER</button>
        <button class="nav-btn primary" @click="goToJsonLoader">GO TO JSON LOADER</button>
      </div>
    </template>
  </MG30PageLayout>
</template>

<style scoped>
.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  min-height: 0;
}

.content-label {
  color: #8f8f8f;
  font-size: 0.8rem;
  letter-spacing: 1px;
}

.markdown-text {
  background: #1e1e1e;
  color: #d4d4d4;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 12px;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  flex: 1;
  overflow: auto;
  font-size: 13px;
  line-height: 1.45;
}

.json-section {
  border: 1px solid #333;
  border-radius: 8px;
  padding: 10px;
}

.json-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
}

.json-title {
  color: #00ff9d;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 1px;
}

.json-toggle {
  color: #8f8f8f;
  font-size: 0.9rem;
}

.json-text {
  margin: 10px 0 0;
  background: #1e1e1e;
  color: #d4d4d4;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 12px;
  max-height: 180px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 12px;
  line-height: 1.4;
}

.json-tools {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.copy-btn {
  background: #1e1e1e;
  color: #d4d4d4;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 8px 12px;
  font-weight: 700;
  cursor: pointer;
}

.copy-btn:hover {
  border-color: #00ff9d;
  color: #00ff9d;
}

.copy-status {
  color: #8f8f8f;
  font-size: 0.8rem;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.nav-btn {
  background: #1e1e1e;
  color: #d4d4d4;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 10px 14px;
  font-weight: 700;
  cursor: pointer;
}

.nav-btn:hover {
  border-color: #00ff9d;
  color: #00ff9d;
}

.nav-btn.primary {
  background: #00ff9d;
  color: #000;
  border: none;
}

.nav-btn.primary:hover {
  background: #00cc7e;
  color: #000;
}
</style>
