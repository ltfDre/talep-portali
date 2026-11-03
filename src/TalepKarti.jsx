import { DURUMLAR } from './sabitler.js'

function tarihYaz(iso) {
  return new Date(iso).toLocaleString('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function TalepKarti({ talep, onDurumDegistir }) {
  return (
    <li className="kart talep" data-durum={talep.durum} data-oncelik={talep.oncelik}>
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
        onChange={(event) => onDurumDegistir(talep.id, event.target.value)}
      >
        {DURUMLAR.map((durum) => (
          <option key={durum}>{durum}</option>
        ))}
      </select>
    </li>
  )
}
