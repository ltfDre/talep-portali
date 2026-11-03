import { useSearchParams } from 'react-router-dom'
import { DURUMLAR, FILTRE_ONCELIKLERI } from './sabitler.js'
import TalepFiltreleri from './TalepFiltreleri.jsx'
import TalepFormu from './TalepFormu.jsx'
import TalepKarti from './TalepKarti.jsx'

function filtreleriOku(parametreler) {
  const durum = parametreler.get('durum')
  const oncelik = parametreler.get('oncelik')
  return {
    durum: DURUMLAR.includes(durum) ? durum : '',
    oncelik: FILTRE_ONCELIKLERI.includes(oncelik) ? oncelik : '',
  }
}

export default function ListeSayfasi({ talepler, onEkle, onDurumDegistir }) {
  const [parametreler, setParametreler] = useSearchParams()
  const filtreler = filtreleriOku(parametreler)

  const gorunenTalepler = talepler.filter(
    (talep) =>
      (!filtreler.durum || talep.durum === filtreler.durum) &&
      (!filtreler.oncelik || talep.oncelik === filtreler.oncelik),
  )
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

  return (
    <>
      <h1>IT Destek Talepleri</h1>

      <TalepFormu onEkle={onEkle} />

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
              <TalepKarti key={talep.id} talep={talep} onDurumDegistir={onDurumDegistir} />
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
