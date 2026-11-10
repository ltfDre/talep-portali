// Kaynak: docs/SPEC.md Bölüm 4, "Durum geçişleri".
// Sunucu da bu dosyayı içe aktarır (server/rotalar/talepler.js); tarayıcıya veya
// Vite'a özgü bir şey (DOM, import.meta.env, JSX) eklenmemeli.
const IZINLI_GECISLER = new Map([
  ['Açık', ['İşlemde', 'Çözüldü']],
  ['İşlemde', ['Çözüldü']],
  ['Çözüldü', ['İşlemde']],
])

export function izinliGecisler(durum) {
  return IZINLI_GECISLER.get(durum) ?? []
}

// Yeni talep nesnesi döner; izinsiz geçişte (aynı durum dahil) null döner.
// ilkYanitSayilir: SPEC'e göre talebi açan kişinin kendi işlemi ilk yanıt sayılmaz;
// sunucu bu durumda false geçer.
export function durumGecir(talep, yeniDurum, zaman, { ilkYanitSayilir = true } = {}) {
  if (!izinliGecisler(talep.durum).includes(yeniDurum)) return null

  const ilkYanitTarihi = talep.ilkYanitTarihi || (ilkYanitSayilir ? zaman : null)

  if (yeniDurum === 'Çözüldü') {
    return { ...talep, durum: yeniDurum, ilkYanitTarihi, cozulmeTarihi: zaman }
  }

  if (talep.durum === 'Çözüldü') {
    return { ...talep, durum: yeniDurum, cozulmeTarihi: null }
  }

  return { ...talep, durum: yeniDurum, ilkYanitTarihi }
}
