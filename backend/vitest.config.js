import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Run tests sequentially to avoid port and database conflicts
    maxThreads: 1,
    maxWorkers: 1,
    // Increase timeout for database operations
    testTimeout: 30000,
    // Setup files if needed
    setupFiles: [],
  },
});