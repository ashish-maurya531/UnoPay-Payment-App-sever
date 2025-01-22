import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  esbuild: {
    jsxInject: `import React from 'react'`
  },
  server: {
    host: '0.0.0.0',
    port: 5000,  // Set the port to 5000 or any other port you prefer
  }
})
