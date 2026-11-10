import express from 'express'
import { ApiHatasi, bulunamadi, hataAraKatmani } from './hatalar.js'
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

uygulama.use('/api', () => {
  throw bulunamadi()
})

uygulama.use(hataAraKatmani)
