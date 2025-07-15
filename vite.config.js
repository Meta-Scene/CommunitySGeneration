import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cesium from 'vite-plugin-cesium'

export default defineConfig({
  base: '/HuaFa/', // 设置你的publicPath
  plugins: [vue(), cesium()],
  build: {
    rollupOptions: {
      output: {
        // 确保Cesium资源被正确打包到指定目录
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.includes('cesium')) {
            return 'cesium/[name]-[hash][extname]';
          }
          return '[name]-[hash][extname]';
        },
      }
    }
  }
})