import { Link, useLocation, useParams } from 'react-router-dom'
import Bulunamadi from './Bulunamadi.jsx'
import { izinliGecisler } from './durumGecisleri.js'
import { tarihYaz } from './tarih.js'

function tarihVeyaBos(iso) {
  return iso ? tarihYaz(iso) : '—'
}

function dugmeMetni(mevcutDurum, hedefDurum) {
  if (hedefDurum === 'Çözüldü') return 'Çözüldü olarak işaretle'
  return mevcutDurum === 'Çözüldü' ? 'Yeniden aç' : 'İşleme al'
}

export default function TalepDetayi({ talepler, onDurumDegistir }) {
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
            <dd aria-live="polite">{talep.durum}</dd>
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
          <div className="durum-dugmeleri">
            {izinliGecisler(talep.durum).map((hedefDurum) => (
              <button
                key={hedefDurum}
                type="button"
                onClick={() => onDurumDegistir(talep.id, hedefDurum)}
              >
                {dugmeMetni(talep.durum, hedefDurum)}
              </button>
            ))}
          </div>
        </div>
      </article>
    </>
  )
}
