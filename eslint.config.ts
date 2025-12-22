import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  vue: true,

  rules: {
    'unicorn/filename-case': [
      'error',
      {
        cases: {
          pascalCase: true,
          camelCase: true,
        },
      },
    ],

    'vue/component-name-in-template-casing': [
      'error',
      'kebab-case',
      {
        registeredComponentsOnly: true,
        ignores: ['i18n-t'],
      },
    ],

    'vue/component-definition-name-casing': [
      'error',
      'kebab-case',
    ],

    'vue/attribute-hyphenation': [
      'error',
      'always',
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

    'vue/html-quotes': [
      'error',
      'double',
    ],
    'vue/padding-line-between-blocks': [
      'error',
      'always',
    ],
    'vue/no-unused-vars': 'error',
    'vue/v-on-event-hyphenation': [
      'error',
      'always',
      {
        autofix: true,
      },
    ],
    'vue/prefer-true-attribute-shorthand': [
      'error',
      'always',
    ],
  },
})
