// Giriş ve yetki henüz yazılmadı; bu sunucu ağa açılmamalı ve üretimde çalışmamalıdır.
// Denetimler, veritabanı dosyası oluşmadan önce yapılsın diye modüller sonradan yükleniyor.
if (process.env.NODE_ENV === 'production') {
  console.error('Sunucu başlatılmadı: giriş ve yetki olmadan üretimde çalıştırılamaz.')
  process.exit(1)
}

let ayarlar
try {
  ;({ ayarlar } = await import('./ayarlar.js'))
} catch (hata) {
  if (hata?.name !== 'AyarHatasi') throw hata
  console.error('Sunucu başlatılmadı: ortam ayarları geçersiz.')
  for (const sorun of hata.sorunlar) console.error(`  - ${sorun}`)
  console.error('.env.example dosyasına bakın.')
  process.exit(1)
}

const { uygulama } = await import('./uygulama.js')

const ADRES = '127.0.0.1'
const { port: PORT } = ayarlar

uygulama.listen(PORT, ADRES, (hata) => {
  if (hata) {
    console.error(`Sunucu başlatılamadı (${ADRES}:${PORT}):`, hata.message)
    process.exit(1)
  }
  console.log(`API hazır: http://${ADRES}:${PORT} (veritabanı: ${ayarlar.veritabaniYolu})`)
})
