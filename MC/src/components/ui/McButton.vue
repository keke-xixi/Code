<template>
  <button
    class="mc-btn"
    :class="[`mc-btn--${variant}`, `mc-btn--${size}`, { 'mc-btn--block': block }]"
    :disabled="disabled"
    @tap="onTap"
  >
    <uni-icons v-if="icon" :type="icon" :size="iconSize" :color="iconColor" />
    <text v-if="$slots.default || label" class="mc-btn__label">
      <slot>{{ label }}</slot>
    </text>
  </button>
</template>

<script setup>
const props = defineProps({
  label: { type: String, default: '' },
  variant: {
    type: String,
    default: 'primary', // primary | secondary | ghost | danger | accent
  },
  size: { type: String, default: 'md' }, // sm | md | lg
  block: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  icon: { type: String, default: '' },
  iconSize: { type: Number, default: 18 },
  iconColor: { type: String, default: '#fff' },
})

const emit = defineEmits(['tap'])

const onTap = (e) => {
  if (!props.disabled) emit('tap', e)
}
</script>

<style scoped lang="scss">
.mc-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  margin: 0;
  padding: 0 16px;
  transition: opacity 0.15s, transform 0.1s;

  &::after {
    border: none;
  }

  &:active:not([disabled]) {
    transform: scale(0.97);
    opacity: 0.9;
  }

  &[disabled] {
    opacity: 0.45;
  }
}

.mc-btn--block {
  width: 100%;
  flex: 1;
}

.mc-btn--sm {
  height: 36px;
  font-size: 13px;
  padding: 0 12px;
}

.mc-btn--md {
  height: 44px;
  font-size: 15px;
}

.mc-btn--lg {
  height: 50px;
  font-size: 16px;
}

.mc-btn__label {
  color: inherit;
}

.mc-btn--primary {
  background: linear-gradient(135deg, #c9a227 0%, #ffd700 100%);
  color: #1a1408;
}

.mc-btn--secondary {
  background: rgba(255, 255, 255, 0.1);
  color: var(--mc-text, #e8edf4);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.mc-btn--ghost {
  background: transparent;
  color: var(--mc-text-muted, #8b9cb3);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.mc-btn--danger {
  background: rgba(255, 107, 107, 0.2);
  color: #ff8a8a;
  border: 1px solid rgba(255, 107, 107, 0.35);
}

.mc-btn--accent {
  background: rgba(61, 139, 253, 0.25);
  color: #7eb8ff;
  border: 1px solid rgba(61, 139, 253, 0.4);
}
</style>
