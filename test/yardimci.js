// API testleri için ortak yardımcılar. İlk import ortam.js olmalı: ESM bağımlılıkları
// sırayla değerlendirir, böylece ortam sunucu modüllerinden önce ayarlanır.
import './ortam.js'

import { uygulama } from '../server/uygulama.js'
import { db } from '../server/veritabani.js'

export { db }

export const GELISTIRICI_EPOSTA = 'gelistirici@ornek.invalid'

// Sunucuyu rastgele boş bir portta başlatır. Bildirim işleyicisi başlatılmaz
// (yalnızca server/index.js başlatır).
export async function sunucuyuBaslat() {
  const sunucu = await new Promise((coz, reddet) => {
    const s = uygulama.listen(0, '127.0.0.1', (hata) => (hata ? reddet(hata) : coz(s)))
  })
  const { port } = sunucu.address()
  const kok = `http://127.0.0.1:${port}`

  async function istek(yontem, yol, govde) {
    const secenekler = { method: yontem, headers: {} }
    if (govde !== undefined) {
      secenekler.headers['Content-Type'] = 'application/json'
      secenekler.body = typeof govde === 'string' ? govde : JSON.stringify(govde)
    }
    const yanit = await fetch(`${kok}${yol}`, secenekler)
    const metin = await yanit.text()
    return { durum: yanit.status, basliklar: yanit.headers, govde: metin ? JSON.parse(metin) : null }
  }

  function kapat() {
    sunucu.closeAllConnections()
    return new Promise((coz) => sunucu.close(() => coz()))
  }

  return { istek, kapat }
}

// Tohumdaki geliştirme kullanıcısı ve "BT Destek" birimi/kategorisi.
export function tohumKategoriId() {
  return db.prepare("SELECT id FROM kategoriler WHERE ad = 'Genel'").get().id
}

export function gecerliTalep(alanlar = {}) {
  return {
    baslik: 'Yazıcı çalışmıyor',
    aciklama: 'Üçüncü kattaki yazıcı kâğıt sıkıştırıyor.',
    kategori_id: tohumKategoriId(),
    oncelik: 'Orta',
    ...alanlar,
  }
}

let sayac = 0
function benzersiz(onEk) {
  sayac += 1
  return `${onEk} ${process.pid}-${sayac}`
}

// Geliştirme kullanıcısının üyesi olmadığı bir birim ve ona bağlı kategori.
// Bu kategoride açılan talebi kullanıcı (açan olarak) görür ama durumunu değiştiremez (403).
export function uyeOlunmayanKategori({ aktif = 1 } = {}) {
  const birimId = Number(db.prepare('INSERT INTO birimler (ad) VALUES (?)').run(benzersiz('Birim')).lastInsertRowid)
  const kategoriId = Number(
    db
      .prepare('INSERT INTO kategoriler (ad, birim_id, aktif) VALUES (?, ?, ?)')
      .run(benzersiz('Kategori'), birimId, aktif).lastInsertRowid,
  )
  return { birimId, kategoriId }
}

// Başka bir kullanıcının, geliştirme kullanıcısının üyesi olmadığı birimde açtığı talep.
// Geliştirme kullanıcısı bu talebi göremez (404).
export function baskasininTalebi() {
  const zaman = new Date().toISOString()
  const kullaniciId = Number(
    db
      .prepare('INSERT INTO kullanicilar (entra_oid, eposta, ad_soyad, olusturma) VALUES (?, ?, ?, ?)')
      .run(benzersiz('oid'), 'baska@ornek.invalid', 'Başka Kullanıcı', zaman).lastInsertRowid,
  )
  const { birimId, kategoriId } = uyeOlunmayanKategori()
  return Number(
    db
      .prepare(
        `INSERT INTO talepler
           (baslik, aciklama, kategori_id, birim_id, oncelik, acan_kullanici_id, olusturma, guncelleme)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run('Başkasının talebi', 'Görünmemeli.', kategoriId, birimId, 'Orta', kullaniciId, zaman, zaman)
      .lastInsertRowid,
  )
}

export function talepSatiri(id) {
  return db.prepare('SELECT * FROM talepler WHERE id = ?').get(id)
}

export function satirSayilari() {
  const say = (tablo) => db.prepare(`SELECT COUNT(*) AS n FROM ${tablo}`).get().n
  return {
    talepler: say('talepler'),
    talep_gecmisi: say('talep_gecmisi'),
    eposta_kuyrugu: say('eposta_kuyrugu'),
  }
}

// Veritabanının tamamının anlık görüntüsü (reddedilen isteklerin hiçbir şey yazmadığını göstermek için).
export function anlikGoruntu() {
  return {
    talepler: db.prepare('SELECT * FROM talepler ORDER BY id').all(),
    talep_gecmisi: db.prepare('SELECT * FROM talep_gecmisi ORDER BY id').all(),
    eposta_kuyrugu: db.prepare('SELECT * FROM eposta_kuyrugu ORDER BY id').all(),
  }
}

export function kuyrukSatirlari(talepId) {
  return db.prepare('SELECT * FROM eposta_kuyrugu WHERE talep_id = ? ORDER BY id').all(talepId)
}

export function gecmisSatirlari(talepId) {
  return db.prepare('SELECT * FROM talep_gecmisi WHERE talep_id = ? ORDER BY id').all(talepId)
}

// eposta_kuyrugu'na her eklemeyi başarısız kılar; transaction'ın geri alındığını sınamak için.
// Dönen işlev engeli kaldırır.
export function kuyrukYaziminiEngelle() {
  db.exec(`
    CREATE TRIGGER test_kuyruk_engeli BEFORE INSERT ON eposta_kuyrugu
    BEGIN SELECT RAISE(ABORT, 'test: kuyruk yazımı engellendi'); END`)
  return () => db.exec('DROP TRIGGER IF EXISTS test_kuyruk_engeli')
}
