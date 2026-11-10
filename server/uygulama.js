import express from 'express'
import { ApiHatasi, bulunamadi, hataAraKatmani } from './hatalar.js'
import { kategoriRotalari } from './rotalar/kategoriler.js'
import { talepRotalari } from './rotalar/talepler.js'
import { db } from './veritabani.js'

export const uygulama = express()

uygulama.disable('x-powered-by')
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
