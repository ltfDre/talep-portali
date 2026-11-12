// Host ve Origin başlıklarını açıkça yazan ham HTTP isteği (node:http).
// fetch (undici) Host başlığını güvenilir biçimde ezmeye izin vermeyebilir; bu yüzden
// Host/Origin denetimi testleri bu yardımcıyı kullanır. Bağlantı her zaman 127.0.0.1'e gider.
import http from 'node:http'

export function hamIstek(port, { yontem = 'GET', yol, host, origin, govde }) {
  const basliklar = { Host: host }
  if (origin !== undefined) basliklar.Origin = origin
  let govdeMetni
  if (govde !== undefined) {
    govdeMetni = JSON.stringify(govde)
    basliklar['Content-Type'] = 'application/json'
    basliklar['Content-Length'] = Buffer.byteLength(govdeMetni)
  }

  return new Promise((coz, reddet) => {
    const istek = http.request(
      { host: '127.0.0.1', port, method: yontem, path: yol, headers: basliklar, agent: false },
      (yanit) => {
        let metin = ''
        yanit.setEncoding('utf8')
        yanit.on('data', (parca) => (metin += parca))
        yanit.on('end', () => {
          let ayrisan = null
          try {
            ayrisan = metin ? JSON.parse(metin) : null
          } catch {
            ayrisan = metin
          }
          coz({ durum: yanit.statusCode, govde: ayrisan })
        })
      },
    )
    istek.on('error', reddet)
    if (govdeMetni !== undefined) istek.write(govdeMetni)
    istek.end()
  })
}
