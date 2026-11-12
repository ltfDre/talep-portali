import express from 'express'
import { ayarlar } from './ayarlar.js'
import { ApiHatasi, bulunamadi, hataAraKatmani, yasakIstek } from './hatalar.js'
import { kategoriRotalari } from './rotalar/kategoriler.js'
import { talepRotalari } from './rotalar/talepler.js'
import { db } from './veritabani.js'

// DNS rebinding koruması: yalnızca hostname karşılaştırılır (port değil), böylece
// Vite vekili (localhost:5173) ve rastgele portlu testler (127.0.0.1) geçer.
const IZINLI_ADLAR = new Set(['localhost', '127.0.0.1', '[::1]', new URL(ayarlar.uygulamaUrl).hostname])

function hostnameOku(deger) {
  try {
    return new URL(deger).hostname
  } catch {
    return null
  }
}

// Host her zaman denetlenir; Origin yalnızca varsa (curl ve aynı köken GET göndermez).
function hostDenetimi(req, res, next) {
  if (!IZINLI_ADLAR.has(hostnameOku(`http://${req.headers.host ?? ''}`))) throw yasakIstek()
  const origin = req.headers.origin
  if (origin !== undefined && !IZINLI_ADLAR.has(hostnameOku(origin))) throw yasakIstek()
  next()
}

export const uygulama = express()

uygulama.disable('x-powered-by')
uygulama.use('/api', hostDenetimi)
uygulama.use(express.json())

uygulama.get('/api/saglik', (req, res) => {
  try {
    db.prepare('SELECT 1').get()
  } catch (hata) {
    console.error('Veritabanına erişilemedi:', hata)
    throw new ApiHatasi(503, 'GECICI_HATA', 'Veritabanına şu anda erişilemiyor.')
  }
  res.json({ durum: 'ok' })
})

uygulama.use('/api/kategoriler', kategoriRotalari)
uygulama.use('/api/talepler', talepRotalari)

uygulama.use('/api', () => {
  throw bulunamadi()
})

uygulama.use(hataAraKatmani)
