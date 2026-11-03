import { Link, useLocation, useParams } from 'react-router-dom'
import Bulunamadi from './Bulunamadi.jsx'
import { tarihYaz } from './tarih.js'

function tarihVeyaBos(iso) {
  return iso ? tarihYaz(iso) : '—'
}

export default function TalepDetayi({ talepler }) {
  const { id } = useParams()
  const { state } = useLocation()
  const talep = talepler.find((aday) => String(aday.id) === id)

  if (!talep) return <Bulunamadi />

  return (
    <>
      <p className="geri">
        <Link to={`/${state?.listeArama ?? ''}`}>← Listeye dön</Link>
      </p>
      <article className="kart talep" data-durum={talep.durum} data-oncelik={talep.oncelik}>
        <div className="talep-icerik">
          <h1 className="detay-baslik">
            <span className="numara">#{talep.id}</span> {talep.baslik}
          </h1>
          {talep.aciklama && <p className="aciklama">{talep.aciklama}</p>}
          <dl className="detay-alanlar">
            <dt>Durum</dt>
            <dd>{talep.durum}</dd>
            <dt>Öncelik</dt>
            <dd>{talep.oncelik}</dd>
            <dt>Talep eden</dt>
            <dd>{talep.talepEden}</dd>
            <dt>Açılış</dt>
            <dd>{tarihVeyaBos(talep.olusturma)}</dd>
            <dt>İlk yanıt</dt>
            <dd>{tarihVeyaBos(talep.ilkYanitTarihi)}</dd>
            <dt>Çözülme</dt>
            <dd>{tarihVeyaBos(talep.cozulmeTarihi)}</dd>
          </dl>
        </div>
      </article>
    </>
  )
}
