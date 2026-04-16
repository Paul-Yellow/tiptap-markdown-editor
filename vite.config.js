import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { catchErrors } from './vite-plugins/vite-plugin-catch-errors'

export default defineConfig({
  plugins: [vue(), catchErrors()],
})
