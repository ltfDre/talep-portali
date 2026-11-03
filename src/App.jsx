import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import Bulunamadi from './Bulunamadi.jsx'
import ListeSayfasi from './ListeSayfasi.jsx'
import { DURUMLAR } from './sabitler.js'
import TalepDetayi from './TalepDetayi.jsx'

const STORAGE_KEY = 'talep-portali.talepler'

function talepleriYukle() {
  try {
    const kayit = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return Array.isArray(kayit) ? kayit : []
  } catch {
    return []
  }
}

export default function App() {
  const [talepler, setTalepler] = useState(talepleriYukle)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(talepler))
    } catch {
      // Depolama kapalı veya doluysa sayfa bellekteki veriyle çalışmaya devam eder.
    }
  }, [talepler])

  function talepEkle(alanlar) {
    setTalepler((onceki) => [
      {
        id: Math.max(0, ...onceki.map((talep) => talep.id)) + 1,
        ...alanlar,
        durum: DURUMLAR[0],
        olusturma: new Date().toISOString(),
      },
      ...onceki,
    ])
  }

  function durumDegistir(id, durum) {
    setTalepler((onceki) =>
      onceki.map((talep) => (talep.id === id ? { ...talep, durum } : talep)),
    )
  }

  return (
    <main className="sayfa">
      <Routes>
        <Route
          path="/"
          element={
            <ListeSayfasi
              talepler={talepler}
              onEkle={talepEkle}
              onDurumDegistir={durumDegistir}
            />
          }
        />
        <Route path="/talepler/:id" element={<TalepDetayi talepler={talepler} />} />
        <Route path="*" element={<Bulunamadi />} />
      </Routes>
    </main>
  )
}
