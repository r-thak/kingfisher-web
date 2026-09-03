import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        __COMMIT_HASH__: 'readonly',
        __COMMIT_SHORT__: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      // This application intentionally uses effects to synchronize URL state and
      // async request lifecycles with component state. Keep dependency checking,
      // but do not flag those established patterns as errors.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    files: ['server.js', 'vite.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        Bun: 'readonly',
      },
    },
  },
  {
    files: ['src/context/themeContextValue.js', 'src/hooks/useTheme.js'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
