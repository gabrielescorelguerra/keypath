import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { keypathContent } from './scripts/content/vite-plugin.ts'

export default defineConfig({
  // Caminho relativo: o build funciona em qualquer subpasta (ex.: GitHub Pages).
  base: './',
  plugins: [react(), keypathContent()],
  build: {
    // App pessoal, carregado uma vez: ~200 kB compactados no pacote principal é aceitável.
    // Dividir por página (React.lazy) fica para quando o tamanho fizer diferença.
    chunkSizeWarningLimit: 1000,
  },
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
