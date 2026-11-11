import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { durumDegistir, talepGetir } from './api.js'
import Bulunamadi from './Bulunamadi.jsx'
import { izinliGecisler } from './durumGecisleri.js'
import HataKutusu from './HataKutusu.jsx'
import { tarihYaz } from './tarih.js'

const CAKISMA_MESAJI = 'Talep başkası tarafından güncellenmiş, güncel hali gösteriliyor.'

// Bu hatalardan sonra ekrandaki talep eskimiş olabilir; sunucudan yeniden okunur.
const YENIDEN_YUKLENECEK = new Set(['CAKISMA', 'GECERSIZ_GECIS', 'YETKI_YOK'])

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

// Durum düğmeleri herkese gösterilir: arayüzde henüz kullanıcı/yetki bilgisi yok.
// Yetkiyi sunucu denetler (403 YETKI_YOK).
export default function TalepDetayi() {
  const { id } = useParams()
  const { state } = useLocation()
  const [talep, setTalep] = useState(null)
  const [hata, setHata] = useState(null)
  const [islemHatasi, setIslemHatasi] = useState(null)
  const [cakismaVar, setCakismaVar] = useState(false)
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [yenilemeSayaci, setYenilemeSayaci] = useState(0)

  // Talep burada boşaltılmaz: yeniden yüklemede eski bilgi ekranda kalır.
  // Başka bir talebe geçildiğinde eski talep, id eşleşmediği için gösterilmez.
  // Yükleme bitince (başarı ya da hata) düğmeler yeniden etkin olur.
  useEffect(() => {
    const denetleyici = new AbortController()
    setHata(null)
    talepGetir(id, denetleyici.signal).then(
      (veri) => {
        if (denetleyici.signal.aborted) return
        setTalep(veri)
        setGonderiliyor(false)
      },
      (hata) => {
        if (denetleyici.signal.aborted) return
        setHata(hata)
        setGonderiliyor(false)
      },
    )
    return () => denetleyici.abort()
  }, [id, yenilemeSayaci])

  async function durumuDegistir(hedefDurum) {
    if (gonderiliyor) return
    setGonderiliyor(true)
    setIslemHatasi(null)
    setCakismaVar(false)

    try {
      const guncel = await durumDegistir(talep.id, { durum: hedefDurum, surum: talep.surum })
      // Bu arada başka bir talebe geçildiyse onun yerine yazılmaz.
      setTalep((onceki) => (onceki?.id === guncel.id ? guncel : onceki))
      setGonderiliyor(false)
    } catch (hata) {
      if (hata.kod === 'BULUNAMADI') {
        setHata(hata)
        setGonderiliyor(false)
        return
      }

      if (hata.kod === 'CAKISMA') setCakismaVar(true)
      else setIslemHatasi(hata)

      // Yeniden yükleme bitene kadar düğmeler devre dışı kalır; eski surum ile
      // ikinci bir istek gidemez. gonderiliyor'u yükleme effect'i kapatır.
      if (YENIDEN_YUKLENECEK.has(hata.kod)) setYenilemeSayaci((n) => n + 1)
      else setGonderiliyor(false)
    }
  }

  const geriBaglanti = (
    <p className="geri">
      <Link to={`/${state?.listeArama ?? ''}`}>← Listeye dön</Link>
    </p>
  )

  const gosterilenTalep = talep && String(talep.id) === id ? talep : null

  if (hata && (bulunamadiMi(hata) || !gosterilenTalep)) {
    if (bulunamadiMi(hata)) return <Bulunamadi />
    return (
      <>
        {geriBaglanti}
        <HataKutusu hata={hata} />
      </>
    )
  }

  if (!gosterilenTalep) {
    return (
      <>
        {geriBaglanti}
        <p className="kart bos" aria-live="polite">
          Yükleniyor…
        </p>
      </>
    )
  }

  const t = gosterilenTalep

  return (
    <>
      {geriBaglanti}
      <article className="kart talep" data-durum={t.durum} data-oncelik={t.oncelik}>
        <div className="talep-icerik">
          <h1 className="detay-baslik">
            <span className="numara">#{t.id}</span> {t.baslik}
          </h1>
          {t.aciklama && <p className="aciklama">{t.aciklama}</p>}
          <dl className="detay-alanlar">
            <dt>Durum</dt>
            <dd aria-live="polite">{t.durum}</dd>
            <dt>Öncelik</dt>
            <dd>{t.oncelik}</dd>
            <dt>Talep eden</dt>
            <dd>{t.talepEden}</dd>
            <dt>Açılış</dt>
            <dd>{tarihVeyaBos(t.olusturma)}</dd>
            <dt>İlk yanıt</dt>
            <dd>{tarihVeyaBos(t.ilkYanitTarihi)}</dd>
            <dt>Çözülme</dt>
            <dd>{tarihVeyaBos(t.cozulmeTarihi)}</dd>
          </dl>
          <div className="durum-dugmeleri" aria-busy={gonderiliyor}>
            {izinliGecisler(t.durum).map((hedefDurum) => (
              <button
                key={hedefDurum}
                type="button"
                disabled={gonderiliyor}
                onClick={() => durumuDegistir(hedefDurum)}
              >
                {dugmeMetni(t.durum, hedefDurum)}
              </button>
            ))}
          </div>
          <div role="status">{cakismaVar && <p className="bilgi">{CAKISMA_MESAJI}</p>}</div>
          {islemHatasi && <HataKutusu hata={islemHatasi} />}
          {/* Yeniden yükleme başarısız olduysa eski bilgi kalır, hata burada görünür. */}
          {hata && <HataKutusu hata={hata} />}
        </div>
      </article>
    </>
  )
}
