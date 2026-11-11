import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { talepleriGetir } from './api.js'
import HataKutusu from './HataKutusu.jsx'
import { DURUMLAR, FILTRE_ONCELIKLERI } from './sabitler.js'
import TalepFiltreleri from './TalepFiltreleri.jsx'
import TalepKarti from './TalepKarti.jsx'

function filtreleriOku(parametreler) {
  const durum = parametreler.get('durum')
  const oncelik = parametreler.get('oncelik')
  return {
    durum: DURUMLAR.includes(durum) ? durum : '',
    oncelik: FILTRE_ONCELIKLERI.includes(oncelik) ? oncelik : '',
  }
}

// Yalnızca ilk sayfa okunur; toplam, sayfa boyutunu aşarsa gösterge çıkar.
export default function ListeSayfasi() {
  const [parametreler, setParametreler] = useSearchParams()
  const filtreler = filtreleriOku(parametreler)
  const [sonuc, setSonuc] = useState(null)
  const [hata, setHata] = useState(null)

  // Bağımlılık searchParams nesnesi değil, ondan okunan metinlerdir (nesne değiştirilebilir).
  useEffect(() => {
    const denetleyici = new AbortController()
    setSonuc(null)
    setHata(null)
    talepleriGetir(
      { durum: filtreler.durum, oncelik: filtreler.oncelik },
      denetleyici.signal,
    ).then(
      (veri) => {
        if (!denetleyici.signal.aborted) setSonuc(veri)
      },
      (hata) => {
        if (!denetleyici.signal.aborted) setHata(hata)
      },
    )
    return () => denetleyici.abort()
  }, [filtreler.durum, filtreler.oncelik])

  const filtreliMi = Boolean(filtreler.durum || filtreler.oncelik)

  function filtreGuncelle(event) {
    const { name, value } = event.target
    const yeniFiltreler = { ...filtreler, [name]: value }
    setParametreler(
      (onceki) => {
        const sonraki = new URLSearchParams(onceki)
        for (const [ad, deger] of Object.entries(yeniFiltreler)) {
          if (deger) sonraki.set(ad, deger)
          else sonraki.delete(ad)
        }
        return sonraki
      },
      { replace: true },
    )
  }

  let icerik
  if (hata) {
    icerik = <HataKutusu hata={hata} />
  } else if (!sonuc) {
    icerik = (
      <p className="kart bos" aria-live="polite">
        Yükleniyor…
      </p>
    )
  } else if (sonuc.talepler.length === 0) {
    icerik = (
      <p className="kart bos">
        {filtreliMi ? 'Seçili filtrelere uyan talep yok.' : 'Henüz talep yok.'}
      </p>
    )
  } else {
    icerik = (
      <>
        <ul className="liste">
          {sonuc.talepler.map((talep) => (
            <TalepKarti key={talep.id} talep={talep} />
          ))}
        </ul>
        {sonuc.toplamSayfa > 1 && (
          <p className="bilgi">
            İlk {sonuc.sayfaBoyutu} talep gösteriliyor (toplam {sonuc.toplamKayit}). Filtreleri
            daraltarak arayabilirsiniz.
          </p>
        )}
      </>
    )
  }

  return (
    <>
      <h1>IT Destek Talepleri</h1>

      <section>
        <h2>Talepler{sonuc ? ` (${sonuc.toplamKayit})` : ''}</h2>
        <TalepFiltreleri filtreler={filtreler} onDegistir={filtreGuncelle} />
        {icerik}
      </section>
    </>
  )
}
