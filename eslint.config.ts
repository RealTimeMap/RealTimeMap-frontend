import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  vue: true,
  typescript: true,

  rules: {
    'unicorn/filename-case': [
      'error',
      {
        cases: {
          pascalCase: true,
          camelCase: true,
        },
        ignore: [
          '\\.config\\.(js|ts)$',
          '\\.d\\.ts$',
          'vite-env\\.d\\.ts$',
        ],
      },
    ],

    'vue/component-name-in-template-casing': [
      'error',
      'kebab-case',
      {
        registeredComponentsOnly: false,
        ignores: [
          'i18n-t',
          'component',
          'router-view',
          'router-link',
          'transition',
          'transition-group',
        ],
      },
    ],

    'vue/component-definition-name-casing': [
      'error',
      'PascalCase',
    ],

    'vue/attribute-hyphenation': [
      'error',
      'always',
    ],

    'vue/prop-name-casing': ['error', 'camelCase'],
    'vue/require-prop-types': 'error',
    'vue/require-default-prop': 'warn',

    'vue/custom-event-name-casing': [
      'error',
      'camelCase',
      {
        ignores: ['/^update:[a-z]+$/'],
      },
    ],

    'vue/v-on-event-hyphenation': [
      'error',
      'always',
      {
        autofix: true,
      },
    ],

    'vue/multi-word-component-names': [
      'error',
      {
        ignores: [
          'index',
          'default',
          'app',
          'error',
          'README',
        ],
      },
    ],

    'vue/max-attributes-per-line': [
      'error',
      {
        singleline: 1,
        multiline: 1,
      },
    ],

    'vue/first-attribute-linebreak': [
      'error',
      {
        singleline: 'ignore',
        multiline: 'below',
      },
    ],

    'vue/html-closing-bracket-newline': [
      'error',
      {
        singleline: 'never',
        multiline: 'always',
      },
    ],

    'vue/attributes-order': [
      'error',
      {
        order: [
          'DEFINITION', // is
          'LIST_RENDERING', // v-for
          'CONDITIONALS', // v-if, v-else-if, v-else, v-show, v-cloak
          'RENDER_MODIFIERS', // v-pre, v-once
          'GLOBAL', // id
          'UNIQUE', // ref, key
          'SLOT', // v-slot, slot
          'TWO_WAY_BINDING', // v-model
          'OTHER_DIRECTIVES', // v-custom-directive
          'OTHER_ATTR', // all other attributes
          'EVENTS', // @click, v-on
          'CONTENT', // v-text, v-html
        ],
        alphabetical: false,
      },
    ],

    'vue/no-unused-vars': 'error',
    'vue/no-unused-components': 'error',
    'vue/no-mutating-props': 'error',
    'vue/no-setup-props-reactivity-loss': 'error',

    'vue/define-emits-declaration': ['error', 'type-based'],
    'vue/define-props-declaration': ['error', 'type-based'],

    'vue/define-macros-order': [
      'error',
      {
        order: [
          'defineOptions',
          'defineProps',
          'defineEmits',
          'defineSlots',
        ],
      },
    ],

    'vue/prefer-import-from-vue': 'error',
    'vue/prefer-separate-static-class': 'error',
    'vue/html-quotes': ['error', 'double'],

    'vue/html-indent': [
      'error',
      2,
      {
        attribute: 1,
        baseIndent: 1,
        closeBracket: 0,
        alignAttributesVertically: true,
      },
    ],

    'vue/padding-line-between-blocks': ['error', 'always'],

    'vue/prefer-true-attribute-shorthand': ['error', 'always'],

    'ts/no-explicit-any': 'warn', // лучше unknown
    'ts/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],

    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'unused-imports/no-unused-imports': 'error',
  },
})
