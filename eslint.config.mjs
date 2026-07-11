import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'

export default defineConfig([
  globalIgnores([
    '.next/**',
    'node_modules/**',
    'next-env.d.ts',
    'tsconfig.tsbuildinfo',
  ]),
  ...nextVitals,
  {
    rules: {
      // shadcn/ui components and demo seed data use apostrophes in Russian copy heavily;
      // keep the rule as a warning so lint stays actionable without blocking CI.
      'react/no-unescaped-entities': 'warn',
    },
  },
])
