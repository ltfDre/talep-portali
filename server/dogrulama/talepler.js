import { z } from 'zod'

// Değerler: server/sema.sql CHECK kısıtları. Sıra, şemadaki sırayla aynıdır.
export const DURUMLAR = ['Açık', 'İşlemde', 'Çözüldü']
export const ONCELIKLER = ['Acil', 'Düşük', 'Orta', 'Yüksek']

export const SAYFA_BOYUTU = 50
// OFFSET = (sayfa - 1) * SAYFA_BOYUTU güvenli tamsayı aralığında kalmalı.
const EN_BUYUK_SAYFA = Math.floor(Number.MAX_SAFE_INTEGER / SAYFA_BOYUTU) + 1

const POZITIF_TAMSAYI_METNI = /^[1-9][0-9]*$/
const SATIR_SONU = new RegExp(`[\r\n${String.fromCodePoint(0x2028, 0x2029)}]`)

// SQLite length() kod noktası sayar; JS .length UTF-16 birimi sayar. Doğrulama
// şemadaki CHECK ile aynı ölçüyü kullanmalı, yoksa ihlal 500 olarak döner.
function karakterSayisi(metin) {
  return [...metin].length
}

function nfcMetin(mesaj) {
  return z.string({ error: mesaj }).transform((s) => s.normalize('NFC'))
}

function secenek(degerler, mesaj) {
  return nfcMetin(mesaj).pipe(z.enum(degerler, { error: mesaj }))
}

function sinirliMetin(ad, enFazla) {
  return z
    .string({ error: `${ad} zorunludur ve metin olmalı.` })
    .transform((s) => s.normalize('NFC').trim())
    .refine((s) => karakterSayisi(s) >= 1, { error: `${ad} boş olamaz.` })
    .refine((s) => karakterSayisi(s) <= enFazla, {
      error: `${ad} en fazla ${enFazla} karakter olabilir.`,
    })
}

function pozitifTamsayiMetni(mesaj, enFazla = Number.MAX_SAFE_INTEGER) {
  return z
    .string({ error: mesaj })
    .regex(POZITIF_TAMSAYI_METNI, { error: mesaj })
    .transform(Number)
    .refine((n) => n <= enFazla, { error: mesaj })
}

const DURUM_MESAJI = `Durum ${DURUMLAR.join(', ')} değerlerinden biri olmalı.`
const ONCELIK_MESAJI = `Öncelik ${ONCELIKLER.join(', ')} değerlerinden biri olmalı.`

export const talepIdSemasi = z.object({
  id: pozitifTamsayiMetni('Talep numarası 1 veya daha büyük bir tamsayı olmalı.'),
})

// Bilinmeyen sorgu parametreleri yok sayılır (z.object varsayılanı).
// Tekrarlı parametre (?durum=a&durum=b) dizi olarak gelir ve reddedilir.
export const talepListesiSemasi = z.object({
  durum: secenek(DURUMLAR, DURUM_MESAJI).optional(),
  oncelik: secenek(ONCELIKLER, ONCELIK_MESAJI).optional(),
  sayfa: pozitifTamsayiMetni(
    'Sayfa 1 veya daha büyük bir tamsayı olmalı.',
    EN_BUYUK_SAYFA,
  ).default(1),
})

// Bilinmeyen alanlar (durum, birim_id, acan_kullanici_id, surum…) reddedilir.
export const yeniTalepSemasi = z.strictObject(
  {
    baslik: sinirliMetin('Başlık', 200).refine((s) => !SATIR_SONU.test(s), {
      error: 'Başlık tek satır olmalı.',
    }),
    aciklama: sinirliMetin('Açıklama', 5000),
    kategori_id: z
      .number({ error: 'Kategori seçilmeli.' })
      .int({ error: 'Kategori seçilmeli.' })
      .positive({ error: 'Kategori seçilmeli.' }),
    oncelik: secenek(ONCELIKLER, ONCELIK_MESAJI),
  },
  {
    error: (sorun) =>
      sorun.code === 'invalid_type' ? 'İstek gövdesi bir JSON nesnesi olmalı.' : undefined,
  },
)
