import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'src/**/*.test.ts',
      'src/**/*.spec.ts',
      'test/**/*.test.ts',
      'test/**/*.spec.ts'
    ],
    exclude: ['dist/**', 'node_modules/**']
  }
})
