import { useRef, useState } from 'react'
import { ONCELIKLER } from './sabitler.js'

const BOS_FORM = { baslik: '', talepEden: '', oncelik: 'Orta', aciklama: '' }

export default function TalepFormu({ onEkle }) {
  const [form, setForm] = useState(BOS_FORM)
  const baslikRef = useRef(null)

  function alanGuncelle(event) {
    const { name, value } = event.target
    setForm((onceki) => ({ ...onceki, [name]: value }))
  }

  function gonder(event) {
    event.preventDefault()
    const baslik = form.baslik.trim()
    const talepEden = form.talepEden.trim()
    if (!baslik || !talepEden) return

    onEkle({
      baslik,
      talepEden,
      oncelik: form.oncelik,
      aciklama: form.aciklama.trim(),
    })
    setForm(BOS_FORM)
    baslikRef.current?.focus()
  }

  return (
    <form className="kart form" onSubmit={gonder}>
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
  )
}
