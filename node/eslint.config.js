import tsParser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.js', '**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      // Add your rules here
    },
  },
];
