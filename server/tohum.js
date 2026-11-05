// Giriş ve yönetim ekranı gelene kadar talep açabilmek için gereken yer tutucu kayıtlar.
// Birim ve kategori adları kesin değildir (SPEC AS-11).
export const GELISTIRME_OID = 'gelistirme-yerel'

const BIRIM_ADI = 'BT Destek'
const KATEGORI_ADI = 'Genel'

export function tohumla(db) {
  db.transaction(() => {
    db.prepare(
      `INSERT OR IGNORE INTO kullanicilar (entra_oid, eposta, ad_soyad, olusturma)
       VALUES (?, ?, ?, ?)`,
    ).run(
      GELISTIRME_OID,
      'gelistirici@ornek.invalid',
      'Geliştirme Kullanıcısı',
      new Date().toISOString(),
    )
    db.prepare('INSERT OR IGNORE INTO birimler (ad) VALUES (?)').run(BIRIM_ADI)

    const { id: kullaniciId } = db
      .prepare('SELECT id FROM kullanicilar WHERE entra_oid = ?')
      .get(GELISTIRME_OID)
    const { id: birimId } = db.prepare('SELECT id FROM birimler WHERE ad = ?').get(BIRIM_ADI)

    db.prepare('INSERT OR IGNORE INTO birim_uyeleri (birim_id, kullanici_id) VALUES (?, ?)').run(
      birimId,
      kullaniciId,
    )
    db.prepare('INSERT OR IGNORE INTO kategoriler (ad, birim_id) VALUES (?, ?)').run(
      KATEGORI_ADI,
      birimId,
    )
  })()
}
