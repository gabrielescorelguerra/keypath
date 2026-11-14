import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Caminho relativo: o build funciona em qualquer subpasta (ex.: GitHub Pages).
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    css: { modules: { classNameStrategy: 'non-scoped' } },
    projects: [
      {
        // Lógica pura (teoria musical, regras, scripts): sem navegador simulado.
        extends: true,
        test: {
          name: 'logic',
          environment: 'node',
          include: ['src/domain/**/*.test.ts', 'scripts/**/*.test.ts'],
        },
      },
      {
        // Componentes e telas: com DOM simulado.
        extends: true,
        test: {
          name: 'ui',
          environment: 'jsdom',
          globals: true,
          setupFiles: ['./src/test/setup.ts'],
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: ['src/domain/**'],
        },
      },
    ],
    globals: true,
  },
})
