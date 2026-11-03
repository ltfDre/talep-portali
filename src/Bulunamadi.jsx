import { Link } from 'react-router-dom'

export default function Bulunamadi() {
  return (
    <>
      <h1>Sayfa bulunamadı</h1>
      <p className="kart bos">
        Aradığınız sayfa veya talep bulunamadı. <Link to="/">Talep listesine dön</Link>
      </p>
    </>
  )
}
