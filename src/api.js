// API ile konuşan tek dosya. Sunucunun alan adları (snake_case, iç içe nesneler)
// burada arayüzün alan adlarına çevrilir; bileşenler ham yanıtı görmez.
// Yalnızca ekranda kullanılan alanlar kopyalanır.

const AG_HATASI_MESAJI = 'Sunucuya ulaşılamadı. Lütfen yeniden deneyin.'

// Sunucunun {hata:{kod, mesaj, alanlar, istek_kimligi}} biçimini taşır (SPEC Bölüm 8).
// AG_HATASI kodu yalnızca arayüzde üretilir: istek sunucuya ulaşmadı veya
// yanıt beklenen biçimde değil.
export class ApiHatasi extends Error {
  constructor({ durumKodu = 0, kod, mesaj, alanlar = null, istekKimligi = null }) {
    super(mesaj)
    this.name = 'ApiHatasi'
    this.durumKodu = durumKodu
    this.kod = kod
    this.mesaj = mesaj
    this.alanlar = alanlar
    this.istekKimligi = istekKimligi
  }
}

function hataCevir(durumKodu, govde) {
  const hata = govde?.hata
  if (!hata?.kod || !hata?.mesaj) {
    return new ApiHatasi({ durumKodu, kod: 'AG_HATASI', mesaj: AG_HATASI_MESAJI })
  }
  return new ApiHatasi({
    durumKodu,
    kod: hata.kod,
    mesaj: hata.mesaj,
    alanlar: hata.alanlar ?? null,
    istekKimligi: hata.istek_kimligi ?? null,
  })
}

// Sunucunun hata alan adları → arayüzün form alanı adları. Listede olmayan
// anahtarlar olduğu gibi kalır (ör. "Bu alan kabul edilmiyor." hataları).
const ALAN_ADLARI = {
  baslik: 'baslik',
  aciklama: 'aciklama',
  kategori_id: 'kategoriId',
  oncelik: 'oncelik',
}

function alanlariCevir(alanlar) {
  if (!alanlar) return null
  return Object.fromEntries(
    Object.entries(alanlar).map(([ad, mesaj]) => [ALAN_ADLARI[ad] ?? ad, mesaj]),
  )
}

// İptal (AbortError) olduğu gibi fırlatılır; çağıran bileşen onu yok sayar.
// istekGovdesi verilirse JSON olarak gönderilir.
async function istek(yol, { yontem = 'GET', istekGovdesi, signal } = {}) {
  const basliklar = { Accept: 'application/json' }
  if (istekGovdesi !== undefined) basliklar['Content-Type'] = 'application/json'

  let yanit
  try {
    yanit = await fetch(yol, {
      method: yontem,
      headers: basliklar,
      body: istekGovdesi === undefined ? undefined : JSON.stringify(istekGovdesi),
      signal,
    })
  } catch (hata) {
    if (hata?.name === 'AbortError') throw hata
    throw new ApiHatasi({ kod: 'AG_HATASI', mesaj: AG_HATASI_MESAJI })
  }

  let govde = null
  try {
    govde = await yanit.json()
  } catch (hata) {
    if (hata?.name === 'AbortError') throw hata
    // Gövde JSON değil (ör. API kapalıyken Vite vekilinin yanıtı).
  }

  if (!yanit.ok || govde === null) throw hataCevir(yanit.status, govde)
  return govde
}

function talepCevir(ham) {
  return {
    id: ham.id,
    baslik: ham.baslik,
    aciklama: ham.aciklama ?? '',
    durum: ham.durum,
    oncelik: ham.oncelik,
    olusturma: ham.olusturma,
    ilkYanitTarihi: ham.ilk_yanit_tarihi ?? null,
    cozulmeTarihi: ham.cozulme_tarihi ?? null,
    talepEden: ham.acan?.ad_soyad ?? '',
    kategoriAdi: ham.kategori_adi,
    // Durum değiştirirken sunucuya geri gönderilir (eşzamanlı güncelleme denetimi).
    surum: ham.surum,
  }
}

export async function talepleriGetir({ durum, oncelik } = {}, signal) {
  const sorgu = new URLSearchParams()
  if (durum) sorgu.set('durum', durum)
  if (oncelik) sorgu.set('oncelik', oncelik)
  const ek = sorgu.size > 0 ? `?${sorgu}` : ''

  const { talepler, sayfalama } = await istek(`/api/talepler${ek}`, { signal })
  return {
    talepler: talepler.map(talepCevir),
    sayfaBoyutu: sayfalama.sayfa_boyutu,
    toplamKayit: sayfalama.toplam_kayit,
    toplamSayfa: sayfalama.toplam_sayfa,
  }
}

// Yanıtlar ve geçmiş bu adımda ekranda gösterilmediği için döndürülmez.
export async function talepGetir(id, signal) {
  const { talep } = await istek(`/api/talepler/${encodeURIComponent(id)}`, { signal })
  return talepCevir(talep)
}

// surum, talebin ekrandaki hâlinin sürümüdür; eskiyse sunucu 409 CAKISMA döner.
// signal yok: iptal, sunucuda yapılmış değişikliği geri almaz.
export async function durumDegistir(id, { durum, surum }) {
  const { talep } = await istek(`/api/talepler/${encodeURIComponent(id)}/durum`, {
    yontem: 'PATCH',
    istekGovdesi: { durum, surum },
  })
  return talepCevir(talep)
}

function kategoriCevir(ham) {
  return {
    id: ham.kategori_id,
    ad: ham.kategori_adi,
    yardimMetni: ham.yardim_metni ?? '',
    birimAdi: ham.birim_adi,
  }
}

export async function kategorileriGetir(signal) {
  const { kategoriler } = await istek('/api/kategoriler', { signal })
  return kategoriler.map(kategoriCevir)
}

// Talebi açan kişi gövdede gönderilmez; sunucu geçerli kullanıcıyı kendisi bilir.
// signal yok: sayfadan çıkılsa da istek iptal edilmez, iptal sunucudaki kaydı geri almaz.
// Hata alanları arayüz adlarıyla döner (kategori_id → kategoriId).
export async function talepOlustur({ baslik, aciklama, kategoriId, oncelik }) {
  try {
    const { talep } = await istek('/api/talepler', {
      yontem: 'POST',
      istekGovdesi: { baslik, aciklama, kategori_id: Number(kategoriId), oncelik },
    })
    return talepCevir(talep)
  } catch (hata) {
    if (hata instanceof ApiHatasi) hata.alanlar = alanlariCevir(hata.alanlar)
    throw hata
  }
}
