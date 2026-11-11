import { useEffect, useId, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { kategorileriGetir, talepOlustur } from './api.js'
import HataKutusu from './HataKutusu.jsx'
import { ACIKLAMA_EN_FAZLA, BASLIK_EN_FAZLA, ONCELIKLER } from './sabitler.js'

// Öncelik ve kategori bilinçli seçilir; varsayılan değer yoktur (SPEC Bölüm 3).
const BOS_FORM = { baslik: '', aciklama: '', kategoriId: '', oncelik: '' }

// Hata olduğunda odak bu sıradaki ilk hatalı alana gider.
const ALAN_SIRASI = ['baslik', 'aciklama', 'kategoriId', 'oncelik']

const KATEGORI_YENILENDI = 'Kategori listesi yenilendi, lütfen yeniden seçin.'

// Sunucuyla aynı ölçü: NFC'ye çevir, kırp, kod noktası say
// (server/dogrulama/talepler.js). JS'in .length'i UTF-16 birimi sayar.
function karakterSayisi(metin) {
  return [...metin.normalize('NFC').trim()].length
}

// Sunucu sınırlarını yansıtan temel denetim. Asıl otorite sunucudur: başlıkta
// satır sonu ve kategorinin hâlâ aktif olması yalnızca orada denetlenir.
function formuDenetle(form) {
  const hatalar = {}

  const baslikUzunlugu = karakterSayisi(form.baslik)
  if (baslikUzunlugu === 0) hatalar.baslik = 'Başlık boş olamaz.'
  else if (baslikUzunlugu > BASLIK_EN_FAZLA) {
    hatalar.baslik = `Başlık en fazla ${BASLIK_EN_FAZLA} karakter olabilir.`
  }

  const aciklamaUzunlugu = karakterSayisi(form.aciklama)
  if (aciklamaUzunlugu === 0) hatalar.aciklama = 'Açıklama boş olamaz.'
  else if (aciklamaUzunlugu > ACIKLAMA_EN_FAZLA) {
    hatalar.aciklama = `Açıklama en fazla ${ACIKLAMA_EN_FAZLA} karakter olabilir.`
  }

  if (!form.kategoriId) hatalar.kategoriId = 'Kategori seçilmeli.'
  if (!form.oncelik) hatalar.oncelik = 'Öncelik seçilmeli.'

  return hatalar
}

export default function TalepFormu() {
  const navigate = useNavigate()
  const { search } = useLocation()
  const kimlik = useId()

  const [form, setForm] = useState(BOS_FORM)
  const [hatalar, setHatalar] = useState({})
  const [genelHata, setGenelHata] = useState(null)
  const [gonderiliyor, setGonderiliyor] = useState(false)

  // null: henüz yüklenmedi. Yenilemede eski liste yenisi gelene kadar kalır.
  const [kategoriler, setKategoriler] = useState(null)
  const [kategoriHatasi, setKategoriHatasi] = useState(null)
  const [yenilemeSayaci, setYenilemeSayaci] = useState(0)

  const alanlar = {
    baslik: useRef(null),
    aciklama: useRef(null),
    kategoriId: useRef(null),
    oncelik: useRef(null),
  }

  useEffect(() => {
    const denetleyici = new AbortController()
    setKategoriHatasi(null)
    kategorileriGetir(denetleyici.signal).then(
      (liste) => {
        if (denetleyici.signal.aborted) return
        setKategoriler(liste)
        // Seçili kategori artık listede yoksa (pasifleştirildi) seçim boşaltılır.
        setForm((onceki) =>
          liste.some((k) => String(k.id) === onceki.kategoriId)
            ? onceki
            : { ...onceki, kategoriId: '' },
        )
      },
      (hata) => {
        if (!denetleyici.signal.aborted) setKategoriHatasi(hata)
      },
    )
    return () => denetleyici.abort()
  }, [yenilemeSayaci])

  function alanGuncelle(event) {
    const { name, value } = event.target
    setForm((onceki) => ({ ...onceki, [name]: value }))
    setHatalar((onceki) => {
      if (!onceki[name]) return onceki
      const { [name]: _silinen, ...kalan } = onceki
      return kalan
    })
  }

  function ilkHatayaOdaklan(alanHatalari) {
    const ad = ALAN_SIRASI.find((alan) => alanHatalari[alan])
    if (ad) alanlar[ad].current?.focus()
  }

  // Formdaki alanlara ait hatalar alanın yanında, diğerleri üstteki kutuda gösterilir.
  function sunucuHatasiniGoster(hata) {
    if (hata.kod !== 'DOGRULAMA' || !hata.alanlar) {
      setGenelHata(hata)
      return
    }

    const alanHatalari = {}
    const digerleri = {}
    for (const [ad, mesaj] of Object.entries(hata.alanlar)) {
      if (ALAN_SIRASI.includes(ad)) alanHatalari[ad] = mesaj
      else digerleri[ad] = mesaj
    }

    // Pasif veya silinmiş kategori (SPEC Bölüm 8): liste yenilenir.
    if (alanHatalari.kategoriId) {
      alanHatalari.kategoriId = `${alanHatalari.kategoriId} ${KATEGORI_YENILENDI}`
      setYenilemeSayaci((n) => n + 1)
    }

    setHatalar(alanHatalari)
    setGenelHata({
      mesaj: 'Formda düzeltilmesi gereken alanlar var.',
      alanlar: Object.keys(digerleri).length > 0 ? digerleri : null,
    })
    ilkHatayaOdaklan(alanHatalari)
  }

  async function gonder(event) {
    event.preventDefault()
    if (gonderiliyor) return

    setGenelHata(null)
    const istemciHatalari = formuDenetle(form)
    setHatalar(istemciHatalari)
    if (Object.keys(istemciHatalari).length > 0) {
      ilkHatayaOdaklan(istemciHatalari)
      return
    }

    setGonderiliyor(true)
    try {
      const talep = await talepOlustur({
        baslik: form.baslik.trim(),
        aciklama: form.aciklama.trim(),
        kategoriId: form.kategoriId,
        oncelik: form.oncelik,
      })
      // Başarıda sayfadan çıkılır; düğme bu arada devre dışı kalır.
      navigate(`/talepler/${talep.id}`, { state: { listeArama: search } })
    } catch (hata) {
      // Alanlar kontrollü olduğu için kullanıcının yazdıkları yerinde kalır.
      sunucuHatasiniGoster(hata)
      setGonderiliyor(false)
    }
  }

  function hataKimligi(ad) {
    return `${kimlik}-${ad}-hata`
  }

  function hataNitelikleri(ad) {
    return hatalar[ad]
      ? { 'aria-invalid': true, 'aria-describedby': hataKimligi(ad) }
      : { 'aria-invalid': false }
  }

  function alanHatasi(ad) {
    return (
      hatalar[ad] && (
        <p id={hataKimligi(ad)} className="alan-hatasi">
          {hatalar[ad]}
        </p>
      )
    )
  }

  const kategoriHazir = Boolean(kategoriler && kategoriler.length > 0)
  const secilenKategori = kategoriler?.find((k) => String(k.id) === form.kategoriId)

  let kategoriSecenekleri
  if (kategoriler === null) {
    kategoriSecenekleri = (
      <option value="">{kategoriHatasi ? 'Kategoriler yüklenemedi' : 'Kategoriler yükleniyor…'}</option>
    )
  } else if (kategoriler.length === 0) {
    kategoriSecenekleri = <option value="">Kategori yok</option>
  } else {
    kategoriSecenekleri = (
      <>
        <option value="">Seçin…</option>
        {kategoriler.map((kategori) => (
          <option key={kategori.id} value={String(kategori.id)}>
            {kategori.ad}
          </option>
        ))}
      </>
    )
  }

  return (
    <form className="kart form" onSubmit={gonder} noValidate aria-busy={gonderiliyor}>
      <h2>Yeni talep</h2>

      {genelHata && (
        <div className="genis">
          <HataKutusu hata={genelHata} />
        </div>
      )}

      <div className="alan genis">
        <label>
          Başlık
          <input
            ref={alanlar.baslik}
            name="baslik"
            value={form.baslik}
            onChange={alanGuncelle}
            placeholder="Örn. VPN bağlantısı kurulamıyor"
            {...hataNitelikleri('baslik')}
          />
        </label>
        <p className="bilgi sayac">
          {karakterSayisi(form.baslik)}/{BASLIK_EN_FAZLA}
        </p>
        {alanHatasi('baslik')}
      </div>

      <div className="alan genis">
        <label>
          Açıklama
          <textarea
            ref={alanlar.aciklama}
            name="aciklama"
            rows="4"
            value={form.aciklama}
            onChange={alanGuncelle}
            {...hataNitelikleri('aciklama')}
          />
        </label>
        <p className="bilgi sayac">
          {karakterSayisi(form.aciklama)}/{ACIKLAMA_EN_FAZLA}
        </p>
        {alanHatasi('aciklama')}
      </div>

      <div className="alan">
        <label>
          Kategori
          <select
            ref={alanlar.kategoriId}
            name="kategoriId"
            value={form.kategoriId}
            onChange={alanGuncelle}
            disabled={!kategoriHazir}
            {...hataNitelikleri('kategoriId')}
          >
            {kategoriSecenekleri}
          </select>
        </label>
        {alanHatasi('kategoriId')}
        {kategoriHatasi && (
          <>
            <HataKutusu hata={kategoriHatasi} />
            <button type="button" onClick={() => setYenilemeSayaci((n) => n + 1)}>
              Yeniden dene
            </button>
          </>
        )}
        {kategoriler?.length === 0 && (
          <p className="bilgi">Şu anda talep açılabilecek kategori yok.</p>
        )}
        <div className="yardim" aria-live="polite">
          {secilenKategori?.yardimMetni && <p>{secilenKategori.yardimMetni}</p>}
          {secilenKategori && (
            <p>
              Talebiniz <strong>{secilenKategori.birimAdi}</strong> birimine iletilecek.
            </p>
          )}
        </div>
      </div>

      <div className="alan">
        <label>
          Öncelik
          <select
            ref={alanlar.oncelik}
            name="oncelik"
            value={form.oncelik}
            onChange={alanGuncelle}
            {...hataNitelikleri('oncelik')}
          >
            <option value="">Seçin…</option>
            {ONCELIKLER.map((oncelik) => (
              <option key={oncelik}>{oncelik}</option>
            ))}
          </select>
        </label>
        {alanHatasi('oncelik')}
      </div>

      <button type="submit" disabled={gonderiliyor || !kategoriHazir}>
        {gonderiliyor ? 'Gönderiliyor…' : 'Talep aç'}
      </button>
    </form>
  )
}
