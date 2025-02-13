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
// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// export default defineConfig({
//   plugins: [react()],
//   esbuild: {
//     jsxInject: `import React from 'react'`
//   },
//   server: {
//     host: '0.0.0.0',
//     port: 5000,
//   },
//   build: {
//     chunkSizeWarningLimit: 500,
//     rollupOptions: {
//       output: {
//         manualChunks(id) {
//           if (id.includes("node_modules")) {
//             if (id.includes("react") || id.includes("react-dom")) {
//               return "react-vendor";  // Separate React into its own chunk
//             }
//             if (id.includes("ant-design")) {
//               return "antd-vendor";  // Separate Ant Design if used
//             }
//             return "vendor";  // Everything else in vendor
//           }
//         },
//       },
//     },
//   },
// })
