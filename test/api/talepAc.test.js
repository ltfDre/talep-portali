// POST /api/talepler: doğrulama ve bildirim kuyruğunun aynı transaction'da yazılması.
import {
  anlikGoruntu,
  baskasininTalebi,
  db,
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

// Tekrar penceresi: aynı kullanıcı, aynı başlık, 60 sn (SPEC Bölüm 8 dışı, ayrı istek).
function geriTarihle(talepId, saniye) {
  const zaman = new Date(Date.now() - saniye * 1000).toISOString()
  db.prepare('UPDATE talepler SET olusturma = ? WHERE id = ?').run(zaman, talepId)
}

test('aynı başlıkla 60 sn içinde ikinci talep 409 TEKRAR döner ve hiçbir şey yazmaz', async () => {
  const govde = gecerliTalep({ baslik: 'Tekrar: VPN bağlanmıyor' })
  const ilk = await api.istek('POST', '/api/talepler', govde)
  assert.equal(ilk.durum, 201)

  const once = anlikGoruntu()
  const ikinci = await api.istek('POST', '/api/talepler', govde)
  assert.equal(ikinci.durum, 409)
  assert.equal(ikinci.govde.hata.kod, 'TEKRAR')
  assert.equal(typeof ikinci.govde.hata.mesaj, 'string')
  assert.equal(ikinci.govde.hata.alanlar, undefined)
  assert.deepEqual(anlikGoruntu(), once, 'talep, geçmiş veya kuyruk satırı yazılmamalı')
})

test('başlık NFC ve baş/son boşluk temizlenerek karşılaştırılır', async () => {
  const baslik = 'Tekrar: Güç kaynağı şişti, ağ çöktü'
  assert.notEqual(baslik.normalize('NFD'), baslik, 'başlık ayrıştırılabilir harf içermeli')

  const ilk = await api.istek('POST', '/api/talepler', gecerliTalep({ baslik }))
  assert.equal(ilk.durum, 201)

  const once = anlikGoruntu()
  const ikinci = await api.istek(
    'POST',
    '/api/talepler',
    gecerliTalep({ baslik: `  ${baslik.normalize('NFD')} \t` }),
  )
  assert.equal(ikinci.durum, 409)
  assert.equal(ikinci.govde.hata.kod, 'TEKRAR')
  assert.deepEqual(anlikGoruntu(), once)
})

test('tekrar penceresi 60 sn: 59 sn önceki talep engeller, 61 sn önceki engellemez', async () => {
  const govde = gecerliTalep({ baslik: 'Tekrar: Pencere sınırı' })
  const ilk = await api.istek('POST', '/api/talepler', govde)
  assert.equal(ilk.durum, 201)

  geriTarihle(ilk.govde.talep.id, 59)
  const icinde = await api.istek('POST', '/api/talepler', govde)
  assert.equal(icinde.durum, 409, '59 sn önce açılan talep tekrar sayılmalı')
  assert.equal(icinde.govde.hata.kod, 'TEKRAR')

  geriTarihle(ilk.govde.talep.id, 61)
  const disinda = await api.istek('POST', '/api/talepler', govde)
  assert.equal(disinda.durum, 201, '61 sn önce açılan talep tekrar sayılmamalı')
})

test('farklı başlık veya başka kullanıcının aynı başlığı engellenmez', async () => {
  baskasininTalebi() // başlık 'Başkasının talebi', şimdi açıldı
  const ayniBaslik = await api.istek('POST', '/api/talepler', gecerliTalep({ baslik: 'Başkasının talebi' }))
  assert.equal(ayniBaslik.durum, 201, 'başka kullanıcının talebi tekrar sayılmamalı')

  const ilk = await api.istek('POST', '/api/talepler', gecerliTalep({ baslik: 'Tekrar: Ekran titriyor' }))
  assert.equal(ilk.durum, 201)
  const farkli = await api.istek('POST', '/api/talepler', gecerliTalep({ baslik: 'Tekrar: Ekran kararıyor' }))
  assert.equal(farkli.durum, 201, 'farklı başlık tekrar sayılmamalı')
})
