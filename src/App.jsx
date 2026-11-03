import { useEffect, useState } from 'react'
import { DURUMLAR, FILTRE_ONCELIKLERI } from './sabitler.js'
import TalepFiltreleri from './TalepFiltreleri.jsx'
import TalepFormu from './TalepFormu.jsx'
import TalepKarti from './TalepKarti.jsx'

const STORAGE_KEY = 'talep-portali.talepler'

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

export default function App() {
  const [talepler, setTalepler] = useState(talepleriYukle)
  const [filtreler, setFiltreler] = useState(filtreleriOku)

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

  function talepEkle(alanlar) {
    setTalepler((onceki) => [
      {
        id: Math.max(0, ...onceki.map((talep) => talep.id)) + 1,
        ...alanlar,
        durum: DURUMLAR[0],
        olusturma: new Date().toISOString(),
      },
      ...onceki,
    ])
  }

  function durumDegistir(id, durum) {
    setTalepler((onceki) =>
      onceki.map((talep) => (talep.id === id ? { ...talep, durum } : talep)),
    )
  }

  return (
    <main className="sayfa">
      <h1>IT Destek Talepleri</h1>

      <TalepFormu onEkle={talepEkle} />

      <section>
        <h2>
          Talepler ({filtreliMi ? `${gorunenTalepler.length} / ${talepler.length}` : talepler.length})
        </h2>
        <TalepFiltreleri filtreler={filtreler} onDegistir={filtreGuncelle} />
        {talepler.length === 0 ? (
          <p className="kart bos">Henüz talep yok. İlk talebi yukarıdaki formdan ekleyin.</p>
        ) : gorunenTalepler.length === 0 ? (
          <p className="kart bos">Seçili filtrelere uyan talep yok.</p>
        ) : (
          <ul className="liste">
            {gorunenTalepler.map((talep) => (
              <TalepKarti key={talep.id} talep={talep} onDurumDegistir={durumDegistir} />
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
