// Giriş ve yetki henüz yazılmadı; bu sunucu ağa açılmamalı ve üretimde çalışmamalıdır.
// Denetim, veritabanı dosyası oluşmadan önce yapılsın diye uygulama sonradan yükleniyor.
if (process.env.NODE_ENV === 'production') {
  console.error('Sunucu başlatılmadı: giriş ve yetki olmadan üretimde çalıştırılamaz.')
  process.exit(1)
}

const { uygulama } = await import('./uygulama.js')

const ADRES = '127.0.0.1'
const PORT = Number(process.env.PORT ?? 3001)

uygulama.listen(PORT, ADRES, (hata) => {
  if (hata) {
    console.error(`Sunucu başlatılamadı (${ADRES}:${PORT}):`, hata.message)
    process.exit(1)
  }
  console.log(`API hazır: http://${ADRES}:${PORT}`)
})
