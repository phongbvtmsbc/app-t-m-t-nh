import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Thiết lập alias để các file tìm thấy nhau dễ dàng hơn
      '@': path.resolve(__dirname, './'),
    },
  },
});
