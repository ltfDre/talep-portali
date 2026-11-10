import { Router } from 'express'
import { db } from '../veritabani.js'

export const kategoriRotalari = Router()

// Alan adları talep yanıtlarıyla aynıdır (talepler.js, TALEP_ALANLARI); formda seçilen
// kategori_id, POST /api/talepler gövdesine olduğu gibi gider.
// Aktiflik ölçütü, talep açılırken kullanılan aktifKategori sorgusuyla aynıdır.
const sorgular = {
  aktifKategoriler: db.prepare(`
    SELECT k.id AS kategori_id, k.ad AS kategori_adi, k.yardim_metni,
           k.birim_id, b.ad AS birim_adi
    FROM kategoriler k
    JOIN birimler b ON b.id = k.birim_id
    WHERE k.aktif = 1`),
}

// SQLite'ın varsayılan sıralaması Ç, İ, Ö, Ş, Ü harflerini Z'den sonraya koyar.
const turkceSirala = new Intl.Collator('tr')

// SPEC Bölüm 6 liste uç noktalarını sayfalı (en fazla 50) ister; bu uç nokta bilinçli
// olarak sayfalı değildir. Liste, "Yeni talep" formundaki açılır kutuyu doldurur;
// sayfalansaydı 50'den sonraki kategoriler formda hiç görünmez ve seçilemezdi.
// Kategorileri yalnızca admin eklediği için liste küçük ve sınırlı kalır.
kategoriRotalari.get('/', (req, res) => {
  const kategoriler = sorgular.aktifKategoriler
    .all()
    .sort(
      (a, b) =>
        turkceSirala.compare(a.kategori_adi, b.kategori_adi) || a.kategori_id - b.kategori_id,
    )
  res.json({ kategoriler })
})
