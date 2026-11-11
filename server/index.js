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
const { isleyiciyiBaslat, isleyiciyiDurdur } = await import('./bildirimIsleyici.js')

const ADRES = '127.0.0.1'
const { port: PORT } = ayarlar

// Günlükte adresin yalnızca kökü ve yolu gösterilir (adreste kullanıcı adı/parola olabilir).
function bildirimAdresiOzeti() {
  const url = new URL(ayarlar.bildirim.adres)
  return `${url.origin}${url.pathname}`
}

const sunucu = uygulama.listen(PORT, ADRES, (hata) => {
  if (hata) {
    console.error(`Sunucu başlatılamadı (${ADRES}:${PORT}):`, hata.message)
    process.exit(1)
  }
  console.log(`API hazır: http://${ADRES}:${PORT} (veritabanı: ${ayarlar.veritabaniYolu})`)

  if (ayarlar.bildirim.etkin) {
    isleyiciyiBaslat()
    console.log(
      `Bildirim işleyicisi çalışıyor: her ${ayarlar.bildirim.aralikSn} sn, ${bildirimAdresiOzeti()}`,
    )
  } else {
    console.warn(
      'Bildirim kapalı: BILDIRIM_ADRESI ve BILDIRIM_ANAHTARI verilmedi; bildirimler kuyrukta bekleyecek.',
    )
  }
})

// Ctrl+C, concurrently -k ve node --watch yeniden başlatması bu sinyalleri gönderir.
function kapat() {
  isleyiciyiDurdur()
  sunucu.close(() => process.exit(0))
  // Açık kalan bağlantı kapanışı geciktirmesin.
  setTimeout(() => process.exit(0), 3000).unref()
}

process.once('SIGINT', kapat)
process.once('SIGTERM', kapat)
