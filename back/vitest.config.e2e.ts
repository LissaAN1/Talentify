import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    setupFiles: ['./test/setup-env.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    // las pruebas comparten la misma base de datos: se ejecutan en serie
    fileParallelism: false,
  },
});
