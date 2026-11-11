import { ayarlar } from './ayarlar.js'
import { db } from './veritabani.js'

// Bildirim olayları ve alıcıları: docs/SPEC.md Bölüm 6, "E-posta olayları".
// Alıcı her iki olayda da talebi açan kişidir; birime bildirim gitmez (AS-3).
//
// Bu işlevler kendi transaction'ını açmaz ve HTTP isteği yapmaz. Talep işleminin
// transaction'ı içinden çağrılır: biri geri alınırsa öteki de geri alınır.
// Gönderim yalnızca kuyruk işleyicisinin işidir (server/bildirimIsleyici.js).

const sorgular = {
  talepBilgisi: db.prepare(`
    SELECT t.id, t.baslik, t.oncelik, t.durum, b.ad AS birim_adi,
           u.eposta, u.ad_soyad
    FROM talepler t
    JOIN birimler b ON b.id = t.birim_id
    JOIN kullanicilar u ON u.id = t.acan_kullanici_id
    WHERE t.id = ?`),
  kuyrugaEkle: db.prepare(`
    INSERT INTO eposta_kuyrugu (talep_id, alici, konu, govde, olusturma)
    VALUES (?, ?, ?, ?, ?)`),
}

function talepBaglantisi(talepId) {
  return `${ayarlar.uygulamaUrl}/talepler/${talepId}`
}

function talepBilgisi(talepId) {
  const talep = sorgular.talepBilgisi.get(talepId)
  // Transaction'ı geri aldırır; bildirimsiz talep kaydı oluşmaz.
  if (!talep) throw new Error(`Bildirim için talep bulunamadı: #${talepId}`)
  return talep
}

function kuyrugaEkle(talep, konu, satirlar, zaman) {
  sorgular.kuyrugaEkle.run(talep.id, talep.eposta, konu, satirlar.join('\n'), zaman)
}

export function talepAcildiBildirimi(talepId, zaman) {
  const talep = talepBilgisi(talepId)
  kuyrugaEkle(
    talep,
    `[Talep #${talep.id}] Talebiniz alındı: ${talep.baslik}`,
    [
      `Merhaba ${talep.ad_soyad},`,
      '',
      `Talebiniz alındı ve ${talep.birim_adi} birimine iletildi.`,
      '',
      `Numara: #${talep.id}`,
      `Başlık: ${talep.baslik}`,
      `Öncelik: ${talep.oncelik}`,
      `Durum: ${talep.durum}`,
      '',
      `Talebi görüntüle: ${talepBaglantisi(talep.id)}`,
    ],
    zaman,
  )
}

export function durumDegistiBildirimi(talepId, eskiDurum, zaman) {
  const talep = talepBilgisi(talepId)
  kuyrugaEkle(
    talep,
    `[Talep #${talep.id}] Durum güncellendi: ${talep.durum}`,
    [
      `Merhaba ${talep.ad_soyad},`,
      '',
      `#${talep.id} numaralı talebinizin durumu değişti: ${eskiDurum} → ${talep.durum}`,
      '',
      `Başlık: ${talep.baslik}`,
      '',
      `Talebi görüntüle: ${talepBaglantisi(talep.id)}`,
    ],
    zaman,
  )
}
