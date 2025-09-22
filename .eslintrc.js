module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2022: true,
  },
  extends: ['eslint:recommended', 'plugin:vue/vue3-recommended'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'vue/multi-word-component-names': 'off',
    'vue/no-unused-vars': 'error',
    'no-unused-vars': 'error',
    'no-undef': 'error',
  },
  overrides: [
    {
      files: ['*.vue'],
      rules: {
        'vue/multi-word-component-names': 'off',
      },
    },
  ],
}
