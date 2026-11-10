import { randomUUID } from 'node:crypto'

// Hata biçimi ve kodlar: docs/SPEC.md Bölüm 8.
export class ApiHatasi extends Error {
  constructor(durumKodu, kod, mesaj, alanlar) {
    super(mesaj)
    this.durumKodu = durumKodu
    this.kod = kod
    this.alanlar = alanlar
  }
}

export function bulunamadi() {
  return new ApiHatasi(404, 'BULUNAMADI', 'Aradığınız kayıt bulunamadı.')
}

export function yetkiYok() {
  return new ApiHatasi(403, 'YETKI_YOK', 'Bu işlem için yetkiniz yok.')
}

export function cakisma() {
  return new ApiHatasi(
    409,
    'CAKISMA',
    'Talep siz bakarken güncellendi. Lütfen sayfayı yenileyip yeniden deneyin.',
  )
}

export function gecersizGecis(eskiDurum, yeniDurum) {
  return new ApiHatasi(
    409,
    'GECERSIZ_GECIS',
    `'${eskiDurum}' durumundan '${yeniDurum}' durumuna geçilemez.`,
  )
}

// Zod hatasını 400 DOGRULAMA'ya çevirir; her alan için ilk sorun yazılır.
export function dogrulamaHatasi(zodHatasi) {
  const alanlar = {}
  let genelMesaj

  for (const sorun of zodHatasi.issues) {
    if (sorun.code === 'unrecognized_keys') {
      for (const anahtar of sorun.keys) alanlar[anahtar] ??= 'Bu alan kabul edilmiyor.'
    } else if (sorun.path.length === 0) {
      genelMesaj ??= sorun.message
    } else {
      alanlar[sorun.path.join('.')] ??= sorun.message
    }
  }

  const adlar = Object.keys(alanlar)
  if (adlar.length === 0) {
    return new ApiHatasi(400, 'DOGRULAMA', genelMesaj ?? 'İstek geçersiz.')
  }
  const onEk = adlar.length === 1 ? 'Geçersiz alan' : 'Geçersiz alanlar'
  return new ApiHatasi(400, 'DOGRULAMA', `${onEk}: ${adlar.join(', ')}.`, alanlar)
}

function hataGovdesi(kod, mesaj, ekAlanlar) {
  return { hata: { kod, mesaj, ...ekAlanlar } }
}

// Express dört parametreye bakarak hata ara katmanını tanır; next kullanılmasa da kalmalıdır.
export function hataAraKatmani(hata, req, res, next) {
  if (res.headersSent) return next(hata)

  if (hata instanceof ApiHatasi) {
    const ekAlanlar = hata.alanlar ? { alanlar: hata.alanlar } : undefined
    return res.status(hata.durumKodu).json(hataGovdesi(hata.kod, hata.message, ekAlanlar))
  }

  // express.json'un 4xx hataları: bozuk JSON, çok büyük gövde vb.
  if (hata.status >= 400 && hata.status < 500) {
    return res.status(400).json(hataGovdesi('DOGRULAMA', 'İstek gövdesi okunamadı.'))
  }

  if (hata.code?.startsWith('SQLITE_BUSY')) {
    return res
      .status(503)
      .json(hataGovdesi('GECICI_HATA', 'Sistem şu anda meşgul. Lütfen yeniden deneyin.'))
  }

  const istekKimligi = randomUUID()
  console.error(`[${istekKimligi}] ${req.method} ${req.originalUrl}`, hata)
  return res.status(500).json(
    hataGovdesi('SUNUCU_HATASI', 'Beklenmeyen bir hata oluştu.', {
      istek_kimligi: istekKimligi,
    }),
  )
}
