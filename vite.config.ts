/// <reference types="vitest/config" />
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

/**
 * Derives the dev proxy target from the sibling Go API's HTTP_ADDR (e.g. ":8081" or
 * "0.0.0.0:8081"), so changing the backend port needs no change here. Falls back to
 * the API's own default of :8080.
 */
function backendTarget(mode: string): string {
  const backendDir = path.resolve(process.cwd(), '../go-housing-guest-book')
  // Prefix filter: only HTTP_ADDR is read from the backend's .env, nothing else.
  const addr = loadEnv(mode, backendDir, 'HTTP_ADDR').HTTP_ADDR?.trim() || ':8080'
  const sep = addr.lastIndexOf(':')
  const host = addr.slice(0, sep)
  const port = addr.slice(sep + 1) || '8080'
  const reachableHost = !host || host === '0.0.0.0' || host === '[::]' ? 'localhost' : host
  return `http://${reachableHost}:${port}`
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Proxying the Go API in dev keeps the browser on one origin, so no CORS setup is
  // needed locally. API_PROXY_TARGET overrides the address read from the backend's .env.
  const apiTarget = env.API_PROXY_TARGET || backendTarget(mode)
  if (mode !== 'test') console.log(`[hgb] proxying /v1 and /privacy -> ${apiTarget}`)

  return {
    plugins: [react()],
    server: {
      host: true, // reachable from the gate tablet on the LAN
      proxy: {
        '/v1': apiTarget,
        '/privacy': apiTarget,
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: false,
      // antd component tests with user-event are slow on modest machines; 5s default flakes.
      testTimeout: 30_000,
    },
  }
})
