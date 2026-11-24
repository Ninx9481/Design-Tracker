import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' ทำให้ deploy บน GitHub Pages (โฟลเดอร์ย่อย /ชื่อ-repo/) ได้โดยไม่ต้องตั้งค่าเพิ่ม
export default defineConfig({
  base: './',
  plugins: [react()],
  test: { environment: 'node' }
});
