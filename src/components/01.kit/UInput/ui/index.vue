<script setup lang="ts">
import type { UInputModel, UInputProps } from '../model/useInput'
import { useInput } from '../model/useInput'

defineOptions({
  inheritAttrs: false,
})

const {
  type = 'text',
  error = false,
  errorMessage = '',
  loading = false,
  disabled = false,
} = defineProps<UInputProps>()

const model = defineModel<UInputModel>({ default: '' })

const {
  attrs,
  inputId,
  value,
  isFilled,
  inputType,
  isPasswordVisible,
  showPasswordToggle,
  togglePasswordVisibility,
  hasError,
  isDisabled,
} = useInput(model, () => ({ type, error, errorMessage, loading, disabled }))
</script>

<template>
  <div class="u-input-container">
    <div
      class="u-input-wrapper"
      :class="{
        'is-filled': isFilled,
        'has-suffix': showPasswordToggle || loading,
        'has-error': hasError,
        'is-loading': loading,
        'is-disabled': isDisabled,
      }"
    >
      <u-icon
        v-if="icon"
        :icon="icon"
        class="left-icon"
        height="18"
        width="18"
      />
      <input
        v-bind="attrs"
        :id="inputId"
        v-model="value"
        :type="inputType"
        class="u-input value-text"
        :class="{ 'no-label': label === undefined }"
        :placeholder="placeholder"
        :disabled="isDisabled"
        :aria-invalid="hasError"
        :aria-describedby="errorMessage ? `${inputId}-error` : undefined"
        :aria-busy="loading"
      >

      <label
        :for="inputId"
        class="u-input-label label-text"
      >
        {{ label }}
      </label>

      <div
        v-if="loading"
        class="u-input-loading"
        aria-label="Загрузка"
      >
        <u-icon
          icon="svg-spinners:ring-resize"
          height="16"
          width="16"
        />
      </div>

      <button
        v-else-if="showPasswordToggle"
        type="button"
        class="u-input-password-toggle"
        :disabled="isDisabled"
        tabindex="-1"
        :aria-label="isPasswordVisible ? 'Скрыть пароль' : 'Показать пароль'"
        @click="togglePasswordVisibility"
      >
        <u-icon
          v-if="!isPasswordVisible"
          width="20"
          height="20"
          icon="ri:eye-off-line"
        />

        <u-icon
          v-else
          width="20"
          height="20"
          icon="ri:eye-line"
        />
      </button>
    </div>

    <div
      v-if="errorMessage"
      :id="`${inputId}-error`"
      class="u-input-error"
      role="alert"
    >
      {{ errorMessage }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.u-input-container {
  width: 100%;
}

.u-input-wrapper {
  position: relative;
  width: 100%;
  font-family: inherit;
  display: flex;
  align-items: center;
  gap: 10px;

  .left-icon {
    color: var(--text-color-secondary);
  }

  &.has-error {
    .u-input {
      color: var(--error-color, #e74c3c);
    }

    .u-input-label {
      color: var(--error-color, #e74c3c);
    }

    .u-input-password-toggle,
    .u-input-loading {
      color: var(--error-color, #e74c3c);
    }
  }

  &.is-loading {
    .u-input {
      padding-right: 30px;
      border-bottom-color: var(--loading-color, #3498db);
    }

    .u-input-label {
      color: var(--loading-color, #3498db);
    }
  }

  &.is-disabled {
    opacity: 0.6;
    cursor: not-allowed;

    .u-input {
      cursor: not-allowed;
    }

    .u-input-password-toggle {
      cursor: not-allowed;
    }
  }
}

.u-input {
  width: 100%;
  border: none;
  padding: 20px 0 0 0;
  background-color: transparent;
  outline: none;
  transition: all 0.2s ease;
  cursor: text;

  &.no-label {
    padding: 0;
  }

  .u-input-wrapper.has-suffix & {
    padding-right: 30px;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    color: var(--n-text-color-disabled, #aaa);
  }

  &::-ms-reveal,
  &::-ms-clear {
    display: none;
  }

  &::placeholder {
    color: var(--text-color-muted);
  }
}

.u-input-label {
  position: absolute;
  left: 0;
  top: 0;
  pointer-events: none;
  transition: all 0.2s ease;
}

.u-input-wrapper.has-error .u-input:focus ~ .u-input-label,
.u-input-wrapper.has-error.is-filled .u-input-label {
  color: var(--error-color, #e74c3c);
}

.u-input-wrapper.is-loading .u-input:focus ~ .u-input-label,
.u-input-wrapper.is-loading.is-filled .u-input-label {
  color: var(--loading-color, #3498db);
}

.u-input-password-toggle,
.u-input-loading {
  position: absolute;
  right: 0;
  bottom: 15px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  color: var(--text-color-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.u-input-password-toggle {
  &:hover:not(:disabled) {
    color: var(--primary-color, #3498db);
  }

  &:focus {
    outline: none;
    color: var(--primary-color, #3498db);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.u-input-loading {
  cursor: default;
  animation: spin 1s linear infinite;

  &:hover {
    color: var(--n-text-color-disabled, #aaa);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.u-input-error {
  color: var(--error-color, #e74c3c);
  font-size: 0.75rem;
  margin-top: 4px;
  min-height: 1.125rem;
  line-height: 1.2;
}
</style>
