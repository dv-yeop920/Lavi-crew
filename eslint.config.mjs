import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import simpleImportSort from 'eslint-plugin-simple-import-sort'

export default defineConfig([
  ...nextVitals,
  {
    name: 'lavi-crew/import-order',
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^\\u0000(?!.*\\.css(?:\\.ts)?$)'],
            ['^node:'],
            ['^@?\\w'],
            ['^@/'],
            ['^'],
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
            ['^\\u0000.*\\.css(?:\\.ts)?$', '^.+\\.css(?:\\.ts)?$'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
      'sort-imports': 'off',
    },
  },
  eslintConfigPrettier,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
])
