// Host/Origin denetimi (DNS rebinding koruması), varsayılan UYGULAMA_URL (http://localhost:5173).
// Karşılaştırma yalnızca hostname üzerindendir; port yok sayılır.
import { anlikGoruntu, gecerliTalep, sunucuyuBaslat } from '../yardimci.js'
import { hamIstek } from '../hamIstek.js'

import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'

let api
before(async () => {
  api = await sunucuyuBaslat()
})
after(() => api.kapat())

const istek = (secenekler) => hamIstek(api.port, secenekler)

function yasakOlmali(yanit) {
  assert.equal(yanit.durum, 403)
  assert.equal(yanit.govde?.hata?.kod, 'YASAK_ISTEK')
  assert.equal(typeof yanit.govde.hata.mesaj, 'string')
  assert.ok(yanit.govde.hata.mesaj.length > 0)
}

test('izinli olmayan Host 403 YASAK_ISTEK alır', async () => {
  yasakOlmali(await istek({ yol: '/api/saglik', host: 'kotu.ornek.invalid' }))
})

test('izinli adla başlayan ama farklı Host 403 alır (tam eşleşme)', async () => {
  yasakOlmali(await istek({ yol: '/api/saglik', host: 'localhost.kotu.ornek.invalid' }))
})

test('Origin olmadan 127.0.0.1 Host geçer (curl, aynı köken GET)', async () => {
  const yanit = await istek({ yol: '/api/saglik', host: `127.0.0.1:${api.port}` })
  assert.equal(yanit.durum, 200)
  assert.deepEqual(yanit.govde, { durum: 'ok' })
})

test('Vite vekili: Host localhost:5173 ve Origin http://localhost:5173 geçer', async () => {
  const yanit = await istek({
    yol: '/api/saglik',
    host: 'localhost:5173',
    origin: 'http://localhost:5173',
  })
  assert.equal(yanit.durum, 200)
})

test('[::1] Host geçer', async () => {
  const yanit = await istek({ yol: '/api/saglik', host: '[::1]:3001' })
  assert.equal(yanit.durum, 200)
})

test('port yok sayılır: localhost:9999 Host ve Origin geçer', async () => {
  const yanit = await istek({
    yol: '/api/saglik',
    host: 'localhost:9999',
    origin: 'http://localhost:9999',
  })
  assert.equal(yanit.durum, 200)
})

test('izinli Host ama izinli olmayan Origin 403 YASAK_ISTEK alır', async () => {
  yasakOlmali(
    await istek({ yol: '/api/saglik', host: `127.0.0.1:${api.port}`, origin: 'http://kotu.ornek.invalid' }),
  )
})

test('Origin: null (opak köken) 403 alır', async () => {
  yasakOlmali(await istek({ yol: '/api/saglik', host: `127.0.0.1:${api.port}`, origin: 'null' }))
})

test('kötü Host ile talep açma 403 alır ve hiçbir şey yazılmaz', async () => {
  const once = anlikGoruntu()
  const yanit = await istek({
    yontem: 'POST',
    yol: '/api/talepler',
    host: 'kotu.ornek.invalid',
    govde: gecerliTalep(),
  })
  yasakOlmali(yanit)
  assert.deepEqual(anlikGoruntu(), once)
})

test('kötü Origin ile talep açma 403 alır ve hiçbir şey yazılmaz', async () => {
  const once = anlikGoruntu()
  const yanit = await istek({
    yontem: 'POST',
    yol: '/api/talepler',
    host: `127.0.0.1:${api.port}`,
    origin: 'http://kotu.ornek.invalid',
    govde: gecerliTalep(),
  })
  yasakOlmali(yanit)
  assert.deepEqual(anlikGoruntu(), once)
})

test('denetim 404\'ten önce çalışır: kötü Host ile var olmayan /api yolu 403 alır', async () => {
  yasakOlmali(await istek({ yol: '/api/yok', host: 'kotu.ornek.invalid' }))
})
