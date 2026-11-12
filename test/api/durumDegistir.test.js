// PATCH /api/talepler/:id/durum: denetim sırası, yan etkiler ve transaction bütünlüğü.
// Denetim sırası (server/rotalar/talepler.js): görünürlük 404 → üyelik 403 → sürüm 409 CAKISMA → geçiş 409.
import {
  GELISTIRICI_EPOSTA,
  anlikGoruntu,
  baskasininTalebi,
  gecerliTalep,
  gecmisSatirlari,
  kuyrukSatirlari,
  kuyrukYaziminiEngelle,
  satirSayilari,
  sunucuyuBaslat,
  talepSatiri,
  uyeOlunmayanKategori,
} from '../yardimci.js'

import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'

let api
before(async () => {
  api = await sunucuyuBaslat()
})
after(() => api.kapat())

async function talepAc(alanlar) {
  const yanit = await api.istek('POST', '/api/talepler', gecerliTalep(alanlar))
  assert.equal(yanit.durum, 201)
  return yanit.govde.talep.id
}

function durumDegistir(id, govde) {
  return api.istek('PATCH', `/api/talepler/${id}/durum`, govde)
}

test('reddedilen geçişler doğru sırayla doğru kodu döner ve hiçbir şey yazmaz', async () => {
  const uyeTalep = await talepAc()
  const islemdeTalep = await talepAc()
  assert.equal((await durumDegistir(islemdeTalep, { durum: 'İşlemde', surum: 1 })).durum, 200)
  const uyeOlunmayanTalep = await talepAc({ kategori_id: uyeOlunmayanKategori().kategoriId })
  const gorunmeyenTalep = baskasininTalebi()

  const durumlar = [
    { ad: 'var olmayan talep', id: 999999, govde: { durum: 'İşlemde', surum: 1 }, http: 404, kod: 'BULUNAMADI' },
    { ad: 'başkasının görünmeyen talebi', id: gorunmeyenTalep, govde: { durum: 'İşlemde', surum: 1 }, http: 404, kod: 'BULUNAMADI' },
    { ad: 'üye olunmayan birim', id: uyeOlunmayanTalep, govde: { durum: 'İşlemde', surum: 1 }, http: 403, kod: 'YETKI_YOK' },
    // Üyelik sürümden önce denetlenir: eski sürüm de olsa 403.
    { ad: 'üye olunmayan birim, eski sürüm', id: uyeOlunmayanTalep, govde: { durum: 'İşlemde', surum: 99 }, http: 403, kod: 'YETKI_YOK' },
    { ad: 'eski sürüm', id: uyeTalep, govde: { durum: 'İşlemde', surum: 99 }, http: 409, kod: 'CAKISMA' },
    // Sürüm geçişten önce denetlenir: geçersiz geçiş + eski sürüm → CAKISMA.
    { ad: 'eski sürüm, geçersiz geçiş', id: uyeTalep, govde: { durum: 'Açık', surum: 99 }, http: 409, kod: 'CAKISMA' },
    { ad: 'Açık → Açık', id: uyeTalep, govde: { durum: 'Açık', surum: 1 }, http: 409, kod: 'GECERSIZ_GECIS' },
    { ad: 'İşlemde → Açık', id: islemdeTalep, govde: { durum: 'Açık', surum: 2 }, http: 409, kod: 'GECERSIZ_GECIS' },
  ]

  for (const { ad, id, govde, http, kod } of durumlar) {
    const once = anlikGoruntu()
    const yanit = await durumDegistir(id, govde)
    assert.equal(yanit.durum, http, ad)
    assert.equal(yanit.govde.hata.kod, kod, ad)
    assert.deepEqual(anlikGoruntu(), once, `${ad}: veritabanı değişmemeli`)
  }
})

test('kuyruk yazımı başarısız olursa durum, sürüm ve geçmiş değişmez', async (t) => {
  const id = await talepAc()
  const talepOnce = talepSatiri(id)
  const gecmisOnce = gecmisSatirlari(id)
  const sayilarOnce = satirSayilari()

  t.mock.method(console, 'error', () => {}) // 500 günlüğünü sustur
  const engeliKaldir = kuyrukYaziminiEngelle()
  let yanit
  try {
    yanit = await durumDegistir(id, { durum: 'İşlemde', surum: 1 })
  } finally {
    engeliKaldir()
  }

  assert.equal(yanit.durum, 500)
  assert.equal(yanit.govde.hata.kod, 'SUNUCU_HATASI')
  assert.deepEqual(talepSatiri(id), talepOnce, 'talep satırı değişmemeli')
  assert.deepEqual(gecmisSatirlari(id), gecmisOnce, 'geçmiş değişmemeli')
  assert.deepEqual(satirSayilari(), sayilarOnce)

  // Engel kalkınca aynı sürümle yeniden denenebilir (yarım kalmış güncelleme yok).
  const ikinci = await durumDegistir(id, { durum: 'İşlemde', surum: 1 })
  assert.equal(ikinci.durum, 200)
  assert.equal(ikinci.govde.talep.surum, 2)
})

test('başarılı geçiş sürümü artırır, geçmişe ve kuyruğa tek satır yazar, tarihleri doğru tutar', async () => {
  const id = await talepAc()
  const kuyrukOnce = kuyrukSatirlari(id).length
  const gecmisOnce = gecmisSatirlari(id).length

  // Açık → İşlemde. Değiştiren, talebi açan kişidir: ilk yanıt sayılmaz.
  const islemde = await durumDegistir(id, { durum: 'İşlemde', surum: 1 })
  assert.equal(islemde.durum, 200)
  assert.equal(islemde.govde.talep.durum, 'İşlemde')
  assert.equal(islemde.govde.talep.surum, 2)
  assert.equal(talepSatiri(id).ilk_yanit_tarihi, null, 'açanın kendi işlemi ilk yanıt sayılmaz')

  const gecmis = gecmisSatirlari(id)
  assert.equal(gecmis.length, gecmisOnce + 1)
  assert.equal(gecmis.at(-1).olay, 'durum_degisti')
  assert.equal(gecmis.at(-1).eski_deger, 'Açık')
  assert.equal(gecmis.at(-1).yeni_deger, 'İşlemde')

  const kuyruk = kuyrukSatirlari(id)
  assert.equal(kuyruk.length, kuyrukOnce + 1)
  assert.equal(kuyruk.at(-1).alici, GELISTIRICI_EPOSTA)
  assert.equal(kuyruk.at(-1).durum, 'bekliyor')
  assert.match(kuyruk.at(-1).konu, /Durum güncellendi: İşlemde/)
  assert.match(kuyruk.at(-1).govde, /Açık → İşlemde/)

  // İşlemde → Çözüldü: çözülme tarihi dolar.
  const cozuldu = await durumDegistir(id, { durum: 'Çözüldü', surum: 2 })
  assert.equal(cozuldu.durum, 200)
  assert.equal(cozuldu.govde.talep.surum, 3)
  assert.ok(talepSatiri(id).cozulme_tarihi, 'Çözüldü\'de cozulme_tarihi dolmalı')

  // Çözüldü → İşlemde: yeniden açılınca çözülme tarihi temizlenir.
  const yenidenAcildi = await durumDegistir(id, { durum: 'İşlemde', surum: 3 })
  assert.equal(yenidenAcildi.durum, 200)
  assert.equal(yenidenAcildi.govde.talep.surum, 4)
  assert.equal(talepSatiri(id).cozulme_tarihi, null)
  assert.equal(talepSatiri(id).ilk_yanit_tarihi, null)

  assert.equal(kuyrukSatirlari(id).length, kuyrukOnce + 3, 'her geçişte tek kuyruk satırı')
  assert.equal(gecmisSatirlari(id).length, gecmisOnce + 3, 'her geçişte tek geçmiş satırı')
})
