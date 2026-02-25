<script setup lang="ts">
interface Props {
  loadLabel: string
  resetLabel?: string
  disableReset?: boolean
  disableLoad?: boolean
}

withDefaults(defineProps<Props>(), {
  resetLabel: 'RESET PRESET',
  disableReset: false,
  disableLoad: false
})

const emit = defineEmits<{
  (event: 'reset'): void
  (event: 'load'): void
}>()
</script>

<template>
  <div class="footer-actions">
    <button class="reset-btn" :disabled="disableReset" @click="emit('reset')">
      {{ resetLabel }}
    </button>
    <button class="load-btn" :disabled="disableLoad" @click="emit('load')">
      {{ loadLabel }}
    </button>
  </div>
</template>

<style scoped>
.footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.reset-btn {
  background: #1e1e1e;
  color: #d4d4d4;
  border: 1px solid #333;
  padding: 12px 18px;
  font-weight: bold;
  border-radius: 4px;
  cursor: pointer;
}

.reset-btn:hover:enabled {
  border-color: #00ff9d;
  color: #00ff9d;
}

.reset-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.load-btn {
  background: #00ff9d;
  color: #000;
  border: none;
  padding: 12px 30px;
  font-weight: bold;
  border-radius: 4px;
  cursor: pointer;
  transition:
    transform 0.1s,
    background 0.2s;
}

.load-btn:hover:enabled {
  background: #00cc7e;
}

.load-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.load-btn:active:enabled {
  transform: scale(0.98);
}
</style>
