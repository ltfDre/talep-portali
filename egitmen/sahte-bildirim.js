// Sahte yerel bildirim servisi: yalnızca eğitim ve geliştirme içindir.
// Gerçek e-posta göndermez; geçerli istekleri konsola yazar.
// Yalnızca Node'un yerleşik modüllerini kullanır, paket gerektirmez.
//
// Çalıştırma: npm run bildirim:sahte   (BILDIRIM_ANAHTARI'nı .env'den okur)
// Başarısızlık senaryosu: servisi Ctrl+C ile durdurun; sunucu yeniden denemeye geçer.
//
// Sözleşme:
//   POST /bildir
//   Authorization: Bearer <BILDIRIM_ANAHTARI>
//   Bildirim-Kimligi: <kuyruk kaydı id>
//   Content-Type: application/json
//   { "kimlik": 7, "talep_id": 12, "alici": "...", "konu": "...", "metin": "..." }
// Yanıtlar: 200 alındı, 400 geçersiz gövde, 401 anahtar geçersiz, 404 yol yok,
// 405 yöntem yanlış, 413 gövde çok büyük.

import { createHash, timingSafeEqual } from 'node:crypto'
import { createServer } from 'node:http'

const ADRES = '127.0.0.1'
const PORT = Number(process.env.SAHTE_BILDIRIM_PORT) || 4000
const EN_BUYUK_GOVDE = 64 * 1024
const ANAHTAR = process.env.BILDIRIM_ANAHTARI?.trim()

if (!ANAHTAR) {
  console.error('Sahte bildirim servisi başlatılmadı: BILDIRIM_ANAHTARI tanımlı değil.')
  console.error('.env dosyasında BILDIRIM_ANAHTARI satırını açın (.env.example\'a bakın).')
  process.exit(1)
}

// Özetleri karşılaştırmak, iki değeri eşit uzunluğa getirir; timingSafeEqual bunu ister.
function ozet(metin) {
  return createHash('sha256').update(metin).digest()
}

const ANAHTAR_OZETI = ozet(ANAHTAR)

function anahtarGecerli(yetkiBasligi) {
  if (typeof yetkiBasligi !== 'string' || !yetkiBasligi.startsWith('Bearer ')) return false
  return timingSafeEqual(ozet(yetkiBasligi.slice('Bearer '.length)), ANAHTAR_OZETI)
}

function yanitla(res, durumKodu, govde) {
  res.writeHead(durumKodu, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(govde))
}

function metinMi(deger) {
  return typeof deger === 'string' && deger.length > 0
}

const sunucu = createServer((req, res) => {
  const yol = new URL(req.url, `http://${ADRES}`).pathname
  const kimlik = req.headers['bildirim-kimligi'] ?? '-'

  if (yol !== '/bildir') {
    req.resume()
    return yanitla(res, 404, { hata: 'Bulunamadı' })
  }
  if (req.method !== 'POST') {
    req.resume()
    res.setHeader('Allow', 'POST')
    return yanitla(res, 405, { hata: 'Yalnızca POST kabul edilir' })
  }
  // Anahtarın değeri hiçbir koşulda yazılmaz.
  if (!anahtarGecerli(req.headers.authorization)) {
    req.resume()
    console.warn(`[sahte-bildirim] 401 anahtar geçersiz (kimlik: ${kimlik})`)
    return yanitla(res, 401, { hata: 'Anahtar geçersiz' })
  }

  const parcalar = []
  let boyut = 0
  let reddedildi = false

  req.on('data', (parca) => {
    if (reddedildi) return
    boyut += parca.length
    if (boyut > EN_BUYUK_GOVDE) {
      reddedildi = true
      yanitla(res, 413, { hata: 'Gövde çok büyük' })
      req.destroy()
      return
    }
    parcalar.push(parca)
  })

  req.on('end', () => {
    if (reddedildi) return
    let govde
    try {
      govde = JSON.parse(Buffer.concat(parcalar).toString('utf8'))
    } catch {
      govde = null
    }
    if (!govde || !metinMi(govde.alici) || !metinMi(govde.konu) || !metinMi(govde.metin)) {
      console.warn(`[sahte-bildirim] 400 geçersiz gövde (kimlik: ${kimlik})`)
      return yanitla(res, 400, { hata: 'alici, konu ve metin zorunludur' })
    }

    console.log(
      [
        `[sahte-bildirim] ${new Date().toISOString()} kimlik: ${kimlik}, talep: #${govde.talep_id ?? '-'}`,
        `  Alıcı: ${govde.alici}`,
        `  Konu : ${govde.konu}`,
        ...govde.metin.split('\n').map((satir) => `  | ${satir}`),
        '',
      ].join('\n'),
    )
    yanitla(res, 200, { durum: 'alindi' })
  })
})

sunucu.on('error', (hata) => {
  console.error(`Sahte bildirim servisi başlatılamadı (${ADRES}:${PORT}):`, hata.message)
  process.exit(1)
})

sunucu.listen(PORT, ADRES, () => {
  console.log(`Sahte bildirim servisi hazır: http://${ADRES}:${PORT}/bildir`)
})
