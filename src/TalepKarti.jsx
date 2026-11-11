import { Link, useLocation } from 'react-router-dom'
import { tarihYaz } from './tarih.js'

export default function TalepKarti({ talep }) {
  const { search } = useLocation()

  return (
    <li className="kart talep" data-durum={talep.durum} data-oncelik={talep.oncelik}>
      <div className="talep-icerik">
        <h3>
          <span className="numara">#{talep.id}</span>{' '}
          <Link to={`/talepler/${talep.id}`} state={{ listeArama: search }}>
            {talep.baslik}
          </Link>
        </h3>
        {talep.aciklama && <p className="aciklama">{talep.aciklama}</p>}
        <p className="bilgi">
          {talep.kategoriAdi} · {talep.oncelik} öncelik · {tarihYaz(talep.olusturma)}
        </p>
      </div>
      <span className="durum">{talep.durum}</span>
    </li>
  )
}
