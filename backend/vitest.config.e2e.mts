import { defineConfig } from 'vitest/config';
import { config as loadEnv } from 'dotenv';

loadEnv();
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required for E2E tests');
}

const databaseUrl = new URL(process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL);
if (!process.env.TEST_DATABASE_URL) {
  databaseUrl.pathname += '_test';
}
if (!databaseUrl.pathname.endsWith('_test')) {
  throw new Error('E2E tests require a database name ending in _test');
}
process.env.DATABASE_URL = databaseUrl.toString();

export default defineConfig({
  test: {
    globals: true,
    include: ['test/**/*.e2e-spec.ts'],
  },
});
