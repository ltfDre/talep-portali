// Host/Origin denetimi: UYGULAMA_URL'nin hostname'i izin listesine eklenir.
// ortam.js UYGULAMA_URL'yi siler; bu dosya ondan sonra kendi değerini koyar ve sunucu
// modüllerini dinamik içe aktarır (ayarlar.js içe aktarıldığı anda ortamı okur).
// node --test her dosyayı ayrı süreçte çalıştırır; bu değer diğer testlere sızmaz.
import '../ortam.js'

import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'

process.env.UYGULAMA_URL = 'https://talep.ornek.invalid'
const { sunucuyuBaslat } = await import('../yardimci.js')
const { hamIstek } = await import('../hamIstek.js')

let api
before(async () => {
  api = await sunucuyuBaslat()
})
after(() => api.kapat())

test('UYGULAMA_URL hostname\'i Host ve Origin olarak geçer', async () => {
  const yanit = await hamIstek(api.port, {
    yol: '/api/saglik',
    host: 'talep.ornek.invalid',
    origin: 'https://talep.ornek.invalid',
  })
  assert.equal(yanit.durum, 200)
})

test('UYGULAMA_URL listeyi genişletir ama başka adları açmaz', async () => {
  const yanit = await hamIstek(api.port, { yol: '/api/saglik', host: 'baska.ornek.invalid' })
  assert.equal(yanit.durum, 403)
  assert.equal(yanit.govde?.hata?.kod, 'YASAK_ISTEK')
})
