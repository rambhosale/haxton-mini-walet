import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import dotenv from 'dotenv'
import path from 'path'

// Load .env first if present
dotenv.config({ path: path.resolve(process.cwd(), '.env') })
// Fallback to .env.local for variables not defined in .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const port = parseInt(process.env.PORT || '3000')

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  server: {
    port,
    host: '0.0.0.0',
  },
  define: {
    'import.meta.env.BE_PORT': JSON.stringify(process.env.BE_PORT || '3001'),
  },
  plugins: [
    devtools(),
    nitro({ rollupConfig: { external: [/^@sentry\//] } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
})

export default config
