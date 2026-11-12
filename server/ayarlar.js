// Ortam değişkenleri yalnızca burada okunur. `.env`, `node --env-file-if-exists=.env`
// ile yüklenir (package.json). Geçersiz ayarda AyarHatasi fırlatılır; süreci
// sonlandırmak çağıranın işidir (server/index.js), böylece testler bu modülü
// içe aktardığında süreç ölmez.

export class AyarHatasi extends Error {
  constructor(sorunlar) {
    super(`Ortam ayarları geçersiz:\n${sorunlar.map((s) => `  - ${s}`).join('\n')}`)
    this.name = 'AyarHatasi'
    this.sorunlar = sorunlar
  }
}

// Boş metin ("PORT=") verilmemiş sayılır ve varsayılana düşer.
function oku(ad) {
  const deger = process.env[ad]?.trim()
  return deger ? deger : undefined
}

function tamSayiOku(ad, varsayilan, enAz, enCok, sorunlar) {
  const deger = oku(ad)
  if (deger === undefined) return varsayilan

  const sayi = Number(deger)
  if (!/^\d+$/.test(deger) || sayi < enAz || sayi > enCok) {
    sorunlar.push(`${ad}: ${enAz} ile ${enCok} arasında bir tam sayı olmalı (verilen: "${deger}")`)
    return varsayilan
  }
  return sayi
}

function urlOku(ad, varsayilan, sorunlar) {
  const deger = oku(ad)
  if (deger === undefined) return varsayilan

  let url
  try {
    url = new URL(deger)
  } catch {
    url = null
  }
  if (!url || (url.protocol !== 'http:' && url.protocol !== 'https:')) {
    sorunlar.push(`${ad}: http:// veya https:// ile başlayan geçerli bir adres olmalı (verilen: "${deger}")`)
    return varsayilan
  }
  return deger
}

function ayarlariOku() {
  const sorunlar = []
  const uretim = process.env.NODE_ENV === 'production'

  const port = tamSayiOku('PORT', 3001, 1, 65535, sorunlar)
  const veritabaniYolu = oku('VERITABANI_YOLU') ?? 'veri/talep.db'
  const uygulamaUrl = urlOku('UYGULAMA_URL', 'http://localhost:5173', sorunlar).replace(/\/+$/, '')

  const bildirimAdresi = urlOku('BILDIRIM_ADRESI', null, sorunlar)
  // Anahtarın değeri hiçbir mesaja yazılmaz.
  const bildirimAnahtari = oku('BILDIRIM_ANAHTARI') ?? null
  const bildirimAraligiSn = tamSayiOku('BILDIRIM_ARALIGI_SN', 60, 5, 3600, sorunlar)

  // Yarım yapılandırma büyük olasılıkla unutkanlıktır; sessizce "bildirim kapalı" olmasın.
  if (oku('BILDIRIM_ADRESI') && !bildirimAnahtari) {
    sorunlar.push('BILDIRIM_ANAHTARI: BILDIRIM_ADRESI verildiğinde bu da verilmeli')
  }
  if (bildirimAnahtari && !oku('BILDIRIM_ADRESI')) {
    sorunlar.push('BILDIRIM_ADRESI: BILDIRIM_ANAHTARI verildiğinde bu da verilmeli')
  }

  // Üretimde e-posta bağlantıları UYGULAMA_URL'ye dayanır; Host/Origin denetimi de
  // (server/uygulama.js) localhost dışında yalnızca onun hostname'ine izin verir,
  // bildirimsiz çalışmak da SPEC'teki "her gelişmede e-posta" kuralını bozar.
  if (uretim) {
    if (!oku('UYGULAMA_URL')) sorunlar.push('UYGULAMA_URL: üretimde zorunludur')
    if (!oku('BILDIRIM_ADRESI') && !bildirimAnahtari) {
      sorunlar.push('BILDIRIM_ADRESI ve BILDIRIM_ANAHTARI: üretimde zorunludur')
    }
  }

  if (sorunlar.length > 0) throw new AyarHatasi(sorunlar)

  return Object.freeze({
    port,
    veritabaniYolu,
    uygulamaUrl,
    bildirim: Object.freeze({
      etkin: Boolean(bildirimAdresi && bildirimAnahtari),
      adres: bildirimAdresi,
      anahtar: bildirimAnahtari,
      aralikSn: bildirimAraligiSn,
    }),
  })
}

export const ayarlar = ayarlariOku()
