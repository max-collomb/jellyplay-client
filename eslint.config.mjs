import tsEslintPlugin from '@typescript-eslint/eslint-plugin';
import tsEslintParser from '@typescript-eslint/parser';

export default [
  {
    ignores: [
      'node_modules',
      'dist',
      'build',
      'release',
      '*.log',
      '*.tmp',
      '*.bak',
      '*.swp',
      '*.swo',
      '*.DS_Store',
      '.env',
      '.vscode',
      '.idea',
      '*.tsbuildinfo',
    ],
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsEslintParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsEslintPlugin,
    },
    rules: {
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
      indent: ['error', 2],
      '@typescript-eslint/no-unused-vars': ['warn'],
    },
  },
];
