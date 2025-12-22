<script setup lang="ts">
import type { UInputProps } from '../models/useInput'
import { useInput } from '../models/useInput'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<UInputProps>(), {
  modelValue: '',
  label: '',
  error: false,
  errorMessage: '',
  loading: false,
  disabled: false,
})

const emit = defineEmits(['update:modelValue'])

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
} = useInput(props, emit)
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
      <input
        v-bind="attrs"
        :id="inputId"
        v-model="value"
        :type="inputType"
        class="u-input"
        placeholder=" "
        :disabled="isDisabled"
        :aria-invalid="hasError"
        :aria-describedby="errorMessage ? `${inputId}-error` : undefined"
        :aria-busy="loading"
      >

      <label
        :for="inputId"
        class="u-input-label"
      >
        {{ label }}
      </label>

      <div
        v-if="loading"
        class="u-input-loading"
        aria-label="Загрузка"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
            stroke-linecap="round"
          />
        </svg>
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
        <svg
          v-if="isPasswordVisible"
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle
            cx="12"
            cy="12"
            r="3"
          />
        </svg>

        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07-2.3 2.3" />
          <line
            x1="1"
            y1="1"
            x2="23"
            y2="23"
          />
        </svg>
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

  &.has-error {
    .u-input {
      border-bottom-color: var(--error-color, #e74c3c);

      &:focus {
        border-bottom-color: var(--error-color, #e74c3c);
      }
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
  border-bottom: 1px solid var(--n-border-color, #ccc);
  padding: 20px 0 5px 0;
  background-color: transparent;
  font-size: 1rem;
  color: var(--text-color, #000);
  outline: none;
  transition: all 0.2s ease;
  cursor: text;

  .u-input-wrapper.has-suffix & {
    padding-right: 30px;
  }

  &:focus {
    border-bottom-color: var(--primary-color, #3498db);
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
}

.u-input-label {
  position: absolute;
  top: 15px;
  left: 0;
  color: var(--n-text-color-disabled, #aaa);
  pointer-events: none;
  transition: all 0.2s ease;
  font-size: 1rem;
}

.u-input:focus ~ .u-input-label,
.u-input-wrapper.is-filled .u-input-label {
  top: -5px;
  left: 0;
  font-size: 0.8rem;
  color: var(--primary-color, #3498db);
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
  bottom: 8px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  color: var(--n-text-color-disabled, #aaa);
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
