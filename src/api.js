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

// İptal (AbortError) olduğu gibi fırlatılır; çağıran bileşen onu yok sayar.
async function jsonGetir(yol, signal) {
  let yanit
  try {
    yanit = await fetch(yol, { headers: { Accept: 'application/json' }, signal })
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
  }
}

export async function talepleriGetir({ durum, oncelik } = {}, signal) {
  const sorgu = new URLSearchParams()
  if (durum) sorgu.set('durum', durum)
  if (oncelik) sorgu.set('oncelik', oncelik)
  const ek = sorgu.size > 0 ? `?${sorgu}` : ''

  const { talepler, sayfalama } = await jsonGetir(`/api/talepler${ek}`, signal)
  return {
    talepler: talepler.map(talepCevir),
    sayfaBoyutu: sayfalama.sayfa_boyutu,
    toplamKayit: sayfalama.toplam_kayit,
    toplamSayfa: sayfalama.toplam_sayfa,
  }
}

// Yanıtlar ve geçmiş bu adımda ekranda gösterilmediği için döndürülmez.
export async function talepGetir(id, signal) {
  const { talep } = await jsonGetir(`/api/talepler/${encodeURIComponent(id)}`, signal)
  return talepCevir(talep)
}
