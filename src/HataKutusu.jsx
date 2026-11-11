// src/api.js'deki ApiHatasi'nı gösterir: {kod, mesaj, alanlar, istekKimligi}.
export default function HataKutusu({ hata }) {
  const alanMesajlari = hata.alanlar ? Object.values(hata.alanlar) : []

  return (
    <div className="kart hata" role="alert">
      <p>{hata.mesaj}</p>
      {alanMesajlari.length > 0 && (
        <ul>
          {alanMesajlari.map((mesaj) => (
            <li key={mesaj}>{mesaj}</li>
          ))}
        </ul>
      )}
      {hata.istekKimligi && <p className="bilgi">Hata kimliği: {hata.istekKimligi}</p>}
    </div>
  )
}
