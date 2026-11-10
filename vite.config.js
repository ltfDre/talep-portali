import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Ön eksiz okuma yalnızca bu yapılandırma içindir; istemci paketine yalnızca
  // VITE_ önekli değişkenler girer. Gizli değerlere asla VITE_ öneki vermeyin.
  const env = loadEnv(mode, process.cwd(), '')
  const apiPortu = env.PORT || '3001'

  return {
    plugins: [react()],
    server: {
      proxy: {
        // Sunucu yalnızca 127.0.0.1'i dinler; "localhost" bazı sistemlerde ::1'e çözülür.
        '/api': { target: `http://127.0.0.1:${apiPortu}` },
      },
    },
  }
})
