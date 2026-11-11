import { ayarlar } from './ayarlar.js'
import { db } from './veritabani.js'

// Bildirim kuyruğu işleyicisi (SPEC Bölüm 3 ve Bölüm 8). Express ile aynı süreçte çalışır.
//
// Mükerrer gönderim (tek süreç varsayımı):
// - Bir sonraki tur, önceki tur bittikten sonra setTimeout ile kurulur; turlar üst
//   üste binmez. Bir tur içindeki kayıtlar sırayla gönderilir.
// - Kayıt, yanıt gelir gelmez "durum = 'bekliyor'" koşuluyla güncellenir; gönderilmiş
//   kayıt bir daha seçilmez.
// - POST başarılı olup UPDATE'ten önce süreç çökerse kayıt yeniden gönderilir
//   (en az bir kez teslim). Alıcı, Bildirim-Kimligi başlığıyla ayıklayabilir.
//
// Anahtar yalnızca Authorization başlığına yazılır; hiçbir günlük satırına,
// son_hata alanına veya hata mesajına girmez.

const EN_FAZLA_DENEME = 5
const TUR_BASINA_KAYIT = 20
const ISTEK_ZAMAN_ASIMI_MS = 10_000
const EN_UZUN_BEKLEME_SN = 3600
const IPTAL = 'İptal edildi'

const sorgular = {
  bekleyenler: db.prepare(`
    SELECT id, talep_id, alici, konu, govde, deneme_sayisi
    FROM eposta_kuyrugu
    WHERE durum = 'bekliyor' AND (sonraki_deneme IS NULL OR sonraki_deneme <= ?)
    ORDER BY id
    LIMIT ?`),
  gonderildi: db.prepare(`
    UPDATE eposta_kuyrugu
    SET durum = 'gonderildi', gonderilme = ?, sonraki_deneme = NULL, son_hata = NULL
    WHERE id = ? AND durum = 'bekliyor'`),
  denemeBasarisiz: db.prepare(`
    UPDATE eposta_kuyrugu
    SET durum = ?, deneme_sayisi = ?, sonraki_deneme = ?, son_hata = ?
    WHERE id = ? AND durum = 'bekliyor'`),
}

let calisiyor = false
let zamanlayici = null
let surenIstek = null

// 1., 2., 3. ... başarısızlıktan sonra: aralik, 2×aralik, 4×aralik ... (en fazla 1 saat).
function beklemeSuresiSn(denemeSayisi) {
  return Math.min(ayarlar.bildirim.aralikSn * 2 ** (denemeSayisi - 1), EN_UZUN_BEKLEME_SN)
}

// Başarıda null, başarısızlıkta kısa ve anahtarsız bir açıklama döner.
async function gonder(kayit) {
  const denetleyici = new AbortController()
  surenIstek = denetleyici
  try {
    const yanit = await fetch(ayarlar.bildirim.adres, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ayarlar.bildirim.anahtar}`,
        'Content-Type': 'application/json',
        'Bildirim-Kimligi': String(kayit.id),
      },
      body: JSON.stringify({
        kimlik: kayit.id,
        talep_id: kayit.talep_id,
        alici: kayit.alici,
        konu: kayit.konu,
        metin: kayit.govde,
      }),
      // Yönlendirme izlenmez: anahtar başka bir adrese taşınmasın.
      redirect: 'error',
      signal: AbortSignal.any([denetleyici.signal, AbortSignal.timeout(ISTEK_ZAMAN_ASIMI_MS)]),
    })
    await yanit.body?.cancel()
    return yanit.ok ? null : `HTTP ${yanit.status}`
  } catch (hata) {
    if (hata?.name === 'TimeoutError') return 'Zaman aşımı'
    if (hata?.name === 'AbortError') return IPTAL
    const kod = hata?.cause?.code
    return kod ? `Bağlantı kurulamadı (${kod})` : 'İstek başarısız'
  } finally {
    surenIstek = null
  }
}

async function tur() {
  const kayitlar = sorgular.bekleyenler.all(new Date().toISOString(), TUR_BASINA_KAYIT)

  for (const kayit of kayitlar) {
    if (!calisiyor) return
    const hata = await gonder(kayit)
    const simdi = new Date()

    if (hata === null) {
      sorgular.gonderildi.run(simdi.toISOString(), kayit.id)
      console.log(`[bildirim] #${kayit.id} gönderildi (talep #${kayit.talep_id})`)
      continue
    }

    // Kapanışta kesilen istek deneme sayılmaz; kayıt bekliyor kalır.
    if (hata === IPTAL && !calisiyor) return

    const deneme = kayit.deneme_sayisi + 1
    const etiket = `[bildirim] #${kayit.id} gönderilemedi (${deneme}/${EN_FAZLA_DENEME}): ${hata}`

    if (deneme >= EN_FAZLA_DENEME) {
      sorgular.denemeBasarisiz.run('basarisiz', deneme, null, hata, kayit.id)
      console.warn(`${etiket}; vazgeçildi (basarisiz)`)
    } else {
      const beklemeSn = beklemeSuresiSn(deneme)
      const sonraki = new Date(simdi.getTime() + beklemeSn * 1000).toISOString()
      sorgular.denemeBasarisiz.run('bekliyor', deneme, sonraki, hata, kayit.id)
      console.warn(`${etiket}; ${beklemeSn} sn sonra yeniden denenecek`)
    }
  }
}

async function turuCalistir() {
  zamanlayici = null
  try {
    await tur()
  } catch (hata) {
    // Veritabanı hatası vb.; işleyici durmaz, sonraki turda yeniden dener.
    console.error('[bildirim] Tur tamamlanamadı:', hata?.message ?? hata)
  }
  if (calisiyor) zamanlayici = setTimeout(turuCalistir, ayarlar.bildirim.aralikSn * 1000)
}

// İlk tur hemen çalışır: yeniden başlatmadan önce bekleyen kayıtlar kaldığı yerden gider.
export function isleyiciyiBaslat() {
  if (calisiyor) return
  calisiyor = true
  turuCalistir()
}

export function isleyiciyiDurdur() {
  calisiyor = false
  clearTimeout(zamanlayici)
  zamanlayici = null
  surenIstek?.abort()
}
