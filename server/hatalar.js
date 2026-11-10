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
