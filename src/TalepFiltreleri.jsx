import { DURUMLAR, FILTRE_ONCELIKLERI } from './sabitler.js'

export default function TalepFiltreleri({ filtreler, onDegistir }) {
  return (
    <div className="filtreler">
      <label>
        Durum
        <select name="durum" value={filtreler.durum} onChange={onDegistir}>
          <option value="">Tümü</option>
          {DURUMLAR.map((durum) => (
            <option key={durum}>{durum}</option>
          ))}
        </select>
      </label>
      <label>
        Öncelik
        <select name="oncelik" value={filtreler.oncelik} onChange={onDegistir}>
          <option value="">Tümü</option>
          {FILTRE_ONCELIKLERI.map((oncelik) => (
            <option key={oncelik}>{oncelik}</option>
          ))}
        </select>
      </label>
    </div>
  )
}
