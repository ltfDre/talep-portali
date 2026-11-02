import { useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'talep-portali.talepler'
const DURUMLAR = ['Açık', 'İşlemde', 'Çözüldü']
const ONCELIKLER = ['Acil', 'Düşük', 'Orta', 'Yüksek']
const BOS_FORM = { baslik: '', talepEden: '', oncelik: 'Orta', aciklama: '' }

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
  const baslikRef = useRef(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(talepler))
    } catch {
      // Depolama kapalı veya doluysa sayfa bellekteki veriyle çalışmaya devam eder.
    }
  }, [talepler])

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
        <h2>Talepler ({talepler.length})</h2>
        {talepler.length === 0 ? (
          <p className="kart bos">Henüz talep yok. İlk talebi yukarıdaki formdan ekleyin.</p>
        ) : (
          <ul className="liste">
            {talepler.map((talep) => (
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
