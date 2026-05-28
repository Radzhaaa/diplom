import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

const cssStub = path.resolve(__dirname, 'src/__stubs__/css-stub.ts');

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Stub out CSS calc/color packages that deadlock in Node 23 via jsdom 27
      '@csstools/css-calc': cssStub,
      '@csstools/css-color-4': cssStub,
      '@csstools/css-parser-algorithms': cssStub,
      '@csstools/css-tokenizer': cssStub,
      '@asamuzakjp/css-color': cssStub,
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{spec,test}.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
  },
});
