import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { talepGetir } from './api.js'
import Bulunamadi from './Bulunamadi.jsx'
import { izinliGecisler } from './durumGecisleri.js'
import HataKutusu from './HataKutusu.jsx'
import { tarihYaz } from './tarih.js'

function tarihVeyaBos(iso) {
  return iso ? tarihYaz(iso) : '—'
}

function dugmeMetni(mevcutDurum, hedefDurum) {
  if (hedefDurum === 'Çözüldü') return 'Çözüldü olarak işaretle'
  return mevcutDurum === 'Çözüldü' ? 'Yeniden aç' : 'İşleme al'
}

// Geçersiz numara (400 DOGRULAMA) da kullanıcı için "böyle talep yok" demektir.
function bulunamadiMi(hata) {
  return hata.kod === 'BULUNAMADI' || hata.kod === 'DOGRULAMA'
}

// onDurumDegistir verilmezse durum düğmeleri gösterilmez (durum değiştirme API'ye
// henüz bağlanmadı).
export default function TalepDetayi({ onDurumDegistir }) {
  const { id } = useParams()
  const { state } = useLocation()
  const [talep, setTalep] = useState(null)
  const [hata, setHata] = useState(null)

  useEffect(() => {
    const denetleyici = new AbortController()
    setTalep(null)
    setHata(null)
    talepGetir(id, denetleyici.signal).then(
      (veri) => {
        if (!denetleyici.signal.aborted) setTalep(veri)
      },
      (hata) => {
        if (!denetleyici.signal.aborted) setHata(hata)
      },
    )
    return () => denetleyici.abort()
  }, [id])

  const geriBaglanti = (
    <p className="geri">
      <Link to={`/${state?.listeArama ?? ''}`}>← Listeye dön</Link>
    </p>
  )

  if (hata) {
    if (bulunamadiMi(hata)) return <Bulunamadi />
    return (
      <>
        {geriBaglanti}
        <HataKutusu hata={hata} />
      </>
    )
  }

  if (!talep) {
    return (
      <>
        {geriBaglanti}
        <p className="kart bos" aria-live="polite">
          Yükleniyor…
        </p>
      </>
    )
  }

  return (
    <>
      {geriBaglanti}
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
          {onDurumDegistir && (
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
          )}
        </div>
      </article>
    </>
  )
}
