import { Router } from 'express'
// Geçiş kuralları arayüzle tek kaynaktan gelir (SPEC Bölüm 4, CLAUDE.md "Kurallar").
import { durumGecir } from '../../src/durumGecisleri.js'
import {
  SAYFA_BOYUTU,
  durumDegistirSemasi,
  talepIdSemasi,
  talepListesiSemasi,
  yeniTalepSemasi,
} from '../dogrulama/talepler.js'
import { durumDegistiBildirimi, talepAcildiBildirimi } from '../bildirimler.js'
import {
  ApiHatasi,
  bulunamadi,
  cakisma,
  dogrulamaHatasi,
  gecersizGecis,
  yetkiYok,
} from '../hatalar.js'
import { GELISTIRME_OID } from '../tohum.js'
import { db } from '../veritabani.js'

export const talepRotalari = Router()

const TALEP_ALANLARI = `
  t.id, t.baslik, t.oncelik, t.durum,
  t.kategori_id, k.ad AS kategori_adi, t.birim_id, b.ad AS birim_adi,
  t.olusturma, t.guncelleme, t.ilk_yanit_tarihi, t.cozulme_tarihi, t.surum`

const TALEP_BIRLESIMLERI = `
  FROM talepler t
  JOIN kategoriler k ON k.id = t.kategori_id
  JOIN birimler b ON b.id = t.birim_id`

const LISTE_KOSULU = `
  WHERE t.acan_kullanici_id = ?
    AND (? IS NULL OR t.durum = ?)
    AND (? IS NULL OR t.oncelik = ?)`

const sorgular = {
  kullanici: db.prepare('SELECT id FROM kullanicilar WHERE entra_oid = ?'),
  listeSayisi: db.prepare(`SELECT COUNT(*) AS sayi ${TALEP_BIRLESIMLERI} ${LISTE_KOSULU}`),
  liste: db.prepare(`
    SELECT ${TALEP_ALANLARI} ${TALEP_BIRLESIMLERI} ${LISTE_KOSULU}
    ORDER BY t.olusturma DESC, t.id DESC
    LIMIT ? OFFSET ?`),
  // SPEC Bölüm 7: talebi açan veya talebin birim üyesi görür; diğerleri 404 alır.
  detay: db.prepare(`
    SELECT ${TALEP_ALANLARI}, t.aciklama,
           u.id AS acan_id, u.ad_soyad AS acan_ad_soyad
    ${TALEP_BIRLESIMLERI}
    JOIN kullanicilar u ON u.id = t.acan_kullanici_id
    WHERE t.id = ?
      AND (t.acan_kullanici_id = ?
           OR EXISTS (SELECT 1 FROM birim_uyeleri bu
                      WHERE bu.birim_id = t.birim_id AND bu.kullanici_id = ?))`),
  yanitlar: db.prepare(`
    SELECT y.id, y.metin, y.olusturma, u.id AS yazar_id, u.ad_soyad AS yazar_ad_soyad
    FROM talep_yanitlari y
    JOIN kullanicilar u ON u.id = y.yazar_kullanici_id
    WHERE y.talep_id = ?
    ORDER BY y.olusturma, y.id`),
  gecmis: db.prepare(`
    SELECT g.id, g.olay, g.eski_deger, g.yeni_deger, g.olusturma,
           u.id AS kullanici_id, u.ad_soyad AS kullanici_ad_soyad
    FROM talep_gecmisi g
    JOIN kullanicilar u ON u.id = g.kullanici_id
    WHERE g.talep_id = ?
    ORDER BY g.olusturma, g.id`),
  aktifKategori: db.prepare('SELECT id, birim_id FROM kategoriler WHERE id = ? AND aktif = 1'),
  talepEkle: db.prepare(`
    INSERT INTO talepler
      (baslik, aciklama, kategori_id, birim_id, oncelik, acan_kullanici_id, olusturma, guncelleme)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`),
  gecmiseEkle: db.prepare(`
    INSERT INTO talep_gecmisi (talep_id, kullanici_id, olay, eski_deger, yeni_deger, olusturma)
    VALUES (?, ?, 'acildi', NULL, 'Açık', ?)`),
  // Görünürlük koşulu detay sorgusuyla aynıdır; üyelik ayrıca döner (403 ile 404'ü ayırmak için).
  durumIcinTalep: db.prepare(`
    SELECT * FROM (
      SELECT t.id, t.durum, t.surum, t.ilk_yanit_tarihi, t.cozulme_tarihi, t.acan_kullanici_id,
             EXISTS (SELECT 1 FROM birim_uyeleri bu
                     WHERE bu.birim_id = t.birim_id AND bu.kullanici_id = ?) AS uye
      FROM talepler t
      WHERE t.id = ?
    )
    WHERE acan_kullanici_id = ? OR uye = 1`),
  durumGuncelle: db.prepare(`
    UPDATE talepler
    SET durum = ?, ilk_yanit_tarihi = ?, cozulme_tarihi = ?, guncelleme = ?, surum = surum + 1
    WHERE id = ? AND surum = ?`),
  durumGecmiseEkle: db.prepare(`
    INSERT INTO talep_gecmisi (talep_id, kullanici_id, olay, eski_deger, yeni_deger, olusturma)
    VALUES (?, ?, 'durum_degisti', ?, ?, ?)`),
}

// Giriş yazılana kadar geçerli kullanıcı tohumdaki geliştirme kullanıcısıdır.
// Oturum gelince değişecek tek nokta burasıdır.
function geciciKullaniciId() {
  const satir = sorgular.kullanici.get(GELISTIRME_OID)
  if (!satir) throw new Error('Geliştirme kullanıcısı veritabanında yok.')
  return satir.id
}

function dogrula(sema, veri) {
  const sonuc = sema.safeParse(veri)
  if (!sonuc.success) throw dogrulamaHatasi(sonuc.error)
  return sonuc.data
}

function talepDetayi(talepId, kullaniciId) {
  const satir = sorgular.detay.get(talepId, kullaniciId, kullaniciId)
  if (!satir) return null

  const { acan_id, acan_ad_soyad, ...talep } = satir
  return {
    talep: { ...talep, acan: { id: acan_id, ad_soyad: acan_ad_soyad } },
    yanitlar: sorgular.yanitlar
      .all(talepId)
      .map(({ yazar_id, yazar_ad_soyad, ...yanit }) => ({
        ...yanit,
        yazar: { id: yazar_id, ad_soyad: yazar_ad_soyad },
      })),
    gecmis: sorgular.gecmis
      .all(talepId)
      .map(({ kullanici_id, kullanici_ad_soyad, ...kayit }) => ({
        ...kayit,
        kullanici: { id: kullanici_id, ad_soyad: kullanici_ad_soyad },
      })),
  }
}

const talepListesiGetir = db.transaction((kullaniciId, { durum, oncelik, sayfa }) => {
  const kosul = [kullaniciId, durum ?? null, durum ?? null, oncelik ?? null, oncelik ?? null]
  const { sayi } = sorgular.listeSayisi.get(...kosul)
  const talepler = sorgular.liste.all(...kosul, SAYFA_BOYUTU, (sayfa - 1) * SAYFA_BOYUTU)
  return {
    talepler,
    sayfalama: {
      sayfa,
      sayfa_boyutu: SAYFA_BOYUTU,
      toplam_kayit: sayi,
      toplam_sayfa: Math.ceil(sayi / SAYFA_BOYUTU),
    },
  }
})

const talepDetayiGetir = db.transaction(talepDetayi)

const talepAc = db.transaction((kullaniciId, { baslik, aciklama, kategori_id, oncelik }) => {
  const kategori = sorgular.aktifKategori.get(kategori_id)
  if (!kategori) {
    throw new ApiHatasi(400, 'DOGRULAMA', 'Geçersiz alan: kategori_id.', {
      kategori_id: 'Seçilen kategori bulunamadı veya artık kullanılmıyor.',
    })
  }

  const zaman = new Date().toISOString()
  const { lastInsertRowid } = sorgular.talepEkle.run(
    baslik,
    aciklama,
    kategori.id,
    kategori.birim_id,
    oncelik,
    kullaniciId,
    zaman,
    zaman,
  )
  const talepId = Number(lastInsertRowid)
  sorgular.gecmiseEkle.run(talepId, kullaniciId, zaman)
  // Aynı transaction: talep kaydedilip bildirim kaybolmaz, ya da tersi olmaz.
  talepAcildiBildirimi(talepId, zaman)
  return talepDetayi(talepId, kullaniciId)
})

// SPEC Bölüm 4 "Durum geçişleri" ve Bölüm 7: yalnızca talebin birim üyesi değiştirir.
// Denetim sırası: görünürlük (404) → üyelik (403) → sürüm (409 CAKISMA) → geçiş (409).
// Sürüm geçişten önce denetlenir: eski veriyle verilen karar yeniden yüklemeyi gerektirir.
const durumDegistir = db.transaction((kullaniciId, talepId, { durum, surum }) => {
  const satir = sorgular.durumIcinTalep.get(kullaniciId, talepId, kullaniciId)
  if (!satir) throw bulunamadi()
  if (!satir.uye) throw yetkiYok()
  if (satir.surum !== surum) throw cakisma()

  const zaman = new Date().toISOString()
  const yeni = durumGecir(
    {
      durum: satir.durum,
      ilkYanitTarihi: satir.ilk_yanit_tarihi,
      cozulmeTarihi: satir.cozulme_tarihi,
    },
    durum,
    zaman,
    // SPEC Bölüm 4 "İlk yanıt": talebi açanın kendi işlemi süreyi başlatmaz.
    { ilkYanitSayilir: kullaniciId !== satir.acan_kullanici_id },
  )
  if (!yeni) throw gecersizGecis(satir.durum, durum)

  const { changes } = sorgular.durumGuncelle.run(
    yeni.durum,
    yeni.ilkYanitTarihi,
    yeni.cozulmeTarihi,
    zaman,
    talepId,
    surum,
  )
  if (changes !== 1) throw cakisma()

  sorgular.durumGecmiseEkle.run(talepId, kullaniciId, satir.durum, yeni.durum, zaman)
  // Aynı transaction (SPEC Bölüm 4: her geçişte talebi açana bildirim kuyruğa alınır).
  durumDegistiBildirimi(talepId, satir.durum, zaman)
  return talepDetayi(talepId, kullaniciId)
})

talepRotalari.get('/', (req, res) => {
  const sorgu = dogrula(talepListesiSemasi, req.query)
  res.json(talepListesiGetir(geciciKullaniciId(), sorgu))
})

talepRotalari.get('/:id', (req, res) => {
  const { id } = dogrula(talepIdSemasi, req.params)
  const detay = talepDetayiGetir(id, geciciKullaniciId())
  if (!detay) throw bulunamadi()
  res.json(detay)
})

talepRotalari.post('/', (req, res) => {
  const girdi = dogrula(yeniTalepSemasi, req.body)
  const detay = talepAc(geciciKullaniciId(), girdi)
  res.status(201).location(`/api/talepler/${detay.talep.id}`).json(detay)
})

talepRotalari.patch('/:id/durum', (req, res) => {
  const { id } = dogrula(talepIdSemasi, req.params)
  const girdi = dogrula(durumDegistirSemasi, req.body)
  // immediate: yazma kilidi okumadan önce alınır; okuma ile UPDATE arasına başka bağlantı giremez.
  res.json(durumDegistir.immediate(geciciKullaniciId(), id, girdi))
})
