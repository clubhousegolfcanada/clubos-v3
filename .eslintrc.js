module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'quote-props': ['error', 'as-needed'],
    'array-callback-return': 'error',
    'prefer-destructuring': ['error', {
      array: false,
      object: true,
    }],
    'prefer-template': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-param-reassign': ['error', { props: false }],
    'no-return-await': 'error',
    'require-await': 'error',
    'radix': 'error',
  },
  // TypeScript override commented out until TypeScript is added to backend
  // overrides: [
  //   {
  //     files: ['**/*.ts', '**/*.tsx'],
  //     parser: '@typescript-eslint/parser',
  //     plugins: ['@typescript-eslint'],
  //     extends: [
  //       'plugin:@typescript-eslint/recommended',
  //     ],
  //     rules: {
  //       '@typescript-eslint/no-explicit-any': 'warn',
  //       '@typescript-eslint/explicit-function-return-type': 'off',
  //       '@typescript-eslint/no-unused-vars': ['error', {
  //         argsIgnorePattern: '^_',
  //         varsIgnorePattern: '^_',
  //       }],
  //     },
  //   },
  // ],
}