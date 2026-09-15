import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    // Keep the node:test policy-impact suite out of Vitest; it is run by the
    // package script with tsx and has no Vitest test declarations.
    include: ['src/admin-cockpit.test.tsx', 'src/msp-flows.test.tsx', 'src/lib/demo-enforcement.test.ts', 'src/lib/demo-action-requests.test.ts'],
    setupFiles: './src/test-setup.ts',
    restoreMocks: true,
    clearMocks: true,
  },
});