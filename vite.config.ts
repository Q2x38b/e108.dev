import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: 'node_modules/piper-tts-web/dist/onnx', dest: '.' },
        { src: 'node_modules/piper-tts-web/dist/piper', dest: '.' },
        { src: 'node_modules/piper-tts-web/dist/worker', dest: '.' },
      ]
    }),
  ],
  optimizeDeps: {
    exclude: ['piper-tts-web']
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless'
    }
  },
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless'
    }
  }
})
