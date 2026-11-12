// POST /api/talepler: doğrulama ve bildirim kuyruğunun aynı transaction'da yazılması.
import {
  anlikGoruntu,
  gecerliTalep,
  satirSayilari,
  sunucuyuBaslat,
  uyeOlunmayanKategori,
  kuyrukYaziminiEngelle,
} from '../yardimci.js'

import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'

let api
before(async () => {
  api = await sunucuyuBaslat()
})
after(() => api.kapat())

test('kuyruk yazımı başarısız olursa talep ve geçmiş de geri alınır', async (t) => {
  t.mock.method(console, 'error', () => {}) // 500 günlüğünü sustur
  const once = satirSayilari()

  const engeliKaldir = kuyrukYaziminiEngelle()
  let yanit
  try {
    yanit = await api.istek('POST', '/api/talepler', gecerliTalep())
  } finally {
    engeliKaldir()
  }

  assert.equal(yanit.durum, 500)
  assert.equal(yanit.govde.hata.kod, 'SUNUCU_HATASI')
  assert.deepEqual(satirSayilari(), once, 'talep, geçmiş veya kuyruk satırı kalmamalı')

  // Engel kalkınca aynı istek başarılı olur ve üç tabloya birer satır yazılır.
  const ikinci = await api.istek('POST', '/api/talepler', gecerliTalep())
  assert.equal(ikinci.durum, 201)
  assert.deepEqual(satirSayilari(), {
    talepler: once.talepler + 1,
    talep_gecmisi: once.talep_gecmisi + 1,
    eposta_kuyrugu: once.eposta_kuyrugu + 1,
  })
})

test('geçersiz gövde 500 değil alanlı 400 DOGRULAMA döner ve hiçbir şey yazmaz', async () => {
  const pasif = uyeOlunmayanKategori({ aktif: 0 })
  const emoji = '😀' // JS'de 2 UTF-16 birimi, SQLite'ta 1 karakter

  const durumlar = [
    { ad: 'durum alanı', govde: gecerliTalep({ durum: 'Çözüldü' }), alan: 'durum' },
    { ad: 'acan_kullanici_id alanı', govde: gecerliTalep({ acan_kullanici_id: 999 }), alan: 'acan_kullanici_id' },
    { ad: 'surum alanı', govde: gecerliTalep({ surum: 7 }), alan: 'surum' },
    { ad: '201 kod noktalı başlık', govde: gecerliTalep({ baslik: emoji.repeat(201) }), alan: 'baslik' },
    { ad: 'pasif kategori', govde: gecerliTalep({ kategori_id: pasif.kategoriId }), alan: 'kategori_id' },
  ]

  for (const { ad, govde, alan } of durumlar) {
    const once = anlikGoruntu()
    const yanit = await api.istek('POST', '/api/talepler', govde)
    assert.equal(yanit.durum, 400, ad)
    assert.equal(yanit.govde.hata.kod, 'DOGRULAMA', ad)
    assert.equal(typeof yanit.govde.hata.alanlar?.[alan], 'string', `${ad}: alanlar.${alan} olmalı`)
    assert.deepEqual(anlikGoruntu(), once, `${ad}: veritabanı değişmemeli`)
  }

  // Sınır: 200 kod noktası (400 UTF-16 birimi) kabul edilir, SQLite CHECK'e takılmaz.
  const sinir = await api.istek('POST', '/api/talepler', gecerliTalep({ baslik: emoji.repeat(200) }))
  assert.equal(sinir.durum, 201)
  assert.equal(sinir.govde.talep.baslik, emoji.repeat(200))
})
