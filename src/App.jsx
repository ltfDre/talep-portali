import { useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'talep-portali.talepler'
const DURUMLAR = ['Açık', 'İşlemde', 'Çözüldü']
const ONCELIKLER = ['Acil', 'Düşük', 'Orta', 'Yüksek']
const FILTRE_ONCELIKLERI = ['Düşük', 'Orta', 'Yüksek', 'Acil']
const BOS_FORM = { baslik: '', talepEden: '', oncelik: 'Orta', aciklama: '' }

function filtreleriOku() {
  const parametreler = new URLSearchParams(window.location.search)
  const durum = parametreler.get('durum')
  const oncelik = parametreler.get('oncelik')
  return {
    durum: DURUMLAR.includes(durum) ? durum : '',
    oncelik: FILTRE_ONCELIKLERI.includes(oncelik) ? oncelik : '',
  }
}

function talepleriYukle() {
  try {
    const kayit = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return Array.isArray(kayit) ? kayit : []
  } catch {
    return []
  }
}

function tarihYaz(iso) {
  return new Date(iso).toLocaleString('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function App() {
  const [talepler, setTalepler] = useState(talepleriYukle)
  const [form, setForm] = useState(BOS_FORM)
  const [filtreler, setFiltreler] = useState(filtreleriOku)
  const baslikRef = useRef(null)

  const gorunenTalepler = talepler.filter(
    (talep) =>
      (!filtreler.durum || talep.durum === filtreler.durum) &&
      (!filtreler.oncelik || talep.oncelik === filtreler.oncelik),
  )
  const filtreliMi = Boolean(filtreler.durum || filtreler.oncelik)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(talepler))
    } catch {
      // Depolama kapalı veya doluysa sayfa bellekteki veriyle çalışmaya devam eder.
    }
  }, [talepler])

  useEffect(() => {
    const url = new URL(window.location.href)
    for (const [ad, deger] of Object.entries(filtreler)) {
      if (deger) url.searchParams.set(ad, deger)
      else url.searchParams.delete(ad)
    }
    window.history.replaceState(null, '', url)
  }, [filtreler])

  function filtreGuncelle(event) {
    const { name, value } = event.target
    setFiltreler((onceki) => ({ ...onceki, [name]: value }))
  }

  function alanGuncelle(event) {
    const { name, value } = event.target
    setForm((onceki) => ({ ...onceki, [name]: value }))
  }

  function talepEkle(event) {
    event.preventDefault()
    const baslik = form.baslik.trim()
    const talepEden = form.talepEden.trim()
    if (!baslik || !talepEden) return

    setTalepler((onceki) => [
      {
        id: Math.max(0, ...onceki.map((talep) => talep.id)) + 1,
        baslik,
        talepEden,
        oncelik: form.oncelik,
        aciklama: form.aciklama.trim(),
        durum: DURUMLAR[0],
        olusturma: new Date().toISOString(),
      },
      ...onceki,
    ])
    setForm(BOS_FORM)
    baslikRef.current?.focus()
  }

  function durumDegistir(id, durum) {
    setTalepler((onceki) =>
      onceki.map((talep) => (talep.id === id ? { ...talep, durum } : talep)),
    )
  }

  return (
    <main className="sayfa">
      <h1>IT Destek Talepleri</h1>

      <form className="kart form" onSubmit={talepEkle}>
        <h2>Yeni talep</h2>
        <label className="genis">
          Başlık
          <input
            ref={baslikRef}
            name="baslik"
            value={form.baslik}
            onChange={alanGuncelle}
            placeholder="Örn. VPN bağlantısı kurulamıyor"
            required
          />
        </label>
        <label>
          Talep eden
          <input
            name="talepEden"
            value={form.talepEden}
            onChange={alanGuncelle}
            required
          />
        </label>
        <label>
          Öncelik
          <select name="oncelik" value={form.oncelik} onChange={alanGuncelle}>
            {ONCELIKLER.map((oncelik) => (
              <option key={oncelik}>{oncelik}</option>
            ))}
          </select>
        </label>
        <label className="genis">
          Açıklama (isteğe bağlı)
          <textarea
            name="aciklama"
            rows="2"
            value={form.aciklama}
            onChange={alanGuncelle}
          />
        </label>
        <button type="submit">Talep ekle</button>
      </form>

      <section>
        <h2>
          Talepler ({filtreliMi ? `${gorunenTalepler.length} / ${talepler.length}` : talepler.length})
        </h2>
        <div className="filtreler">
          <label>
            Durum
            <select name="durum" value={filtreler.durum} onChange={filtreGuncelle}>
              <option value="">Tümü</option>
              {DURUMLAR.map((durum) => (
                <option key={durum}>{durum}</option>
              ))}
            </select>
          </label>
          <label>
            Öncelik
            <select name="oncelik" value={filtreler.oncelik} onChange={filtreGuncelle}>
              <option value="">Tümü</option>
              {FILTRE_ONCELIKLERI.map((oncelik) => (
                <option key={oncelik}>{oncelik}</option>
              ))}
            </select>
          </label>
        </div>
        {talepler.length === 0 ? (
          <p className="kart bos">Henüz talep yok. İlk talebi yukarıdaki formdan ekleyin.</p>
        ) : gorunenTalepler.length === 0 ? (
          <p className="kart bos">Seçili filtrelere uyan talep yok.</p>
        ) : (
          <ul className="liste">
            {gorunenTalepler.map((talep) => (
              <li key={talep.id} className="kart talep" data-durum={talep.durum} data-oncelik={talep.oncelik}>
                <div className="talep-icerik">
                  <h3>
                    <span className="numara">#{talep.id}</span> {talep.baslik}
                  </h3>
                  {talep.aciklama && <p className="aciklama">{talep.aciklama}</p>}
                  <p className="bilgi">
                    {talep.talepEden} · {talep.oncelik} öncelik · {tarihYaz(talep.olusturma)}
                  </p>
                </div>
                <select
                  className="durum"
                  aria-label={`#${talep.id} durumu`}
                  value={talep.durum}
                  onChange={(event) => durumDegistir(talep.id, event.target.value)}
                >
                  {DURUMLAR.map((durum) => (
                    <option key={durum}>{durum}</option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
