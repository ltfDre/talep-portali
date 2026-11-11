import { Route, Routes } from 'react-router-dom'
import Bulunamadi from './Bulunamadi.jsx'
import ListeSayfasi from './ListeSayfasi.jsx'
import TalepDetayi from './TalepDetayi.jsx'

// Veriyi her ekran kendisi API'den okur (src/api.js). Talep açma formu liste
// sayfasındadır (TalepFormu), durum değiştirme detay ekranındadır (TalepDetayi).
export default function App() {
  return (
    <main className="sayfa">
      <Routes>
        <Route path="/" element={<ListeSayfasi />} />
        <Route path="/talepler/:id" element={<TalepDetayi />} />
        <Route path="*" element={<Bulunamadi />} />
      </Routes>
    </main>
  )
}
