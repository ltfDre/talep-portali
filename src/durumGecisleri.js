// Kaynak: docs/SPEC.md Bölüm 4, "Durum geçişleri".
const IZINLI_GECISLER = new Map([
  ['Açık', ['İşlemde', 'Çözüldü']],
  ['İşlemde', ['Çözüldü']],
  ['Çözüldü', ['İşlemde']],
])

export function izinliGecisler(durum) {
  return IZINLI_GECISLER.get(durum) ?? []
}

// Yeni talep nesnesi döner; izinsiz geçişte (aynı durum dahil) null döner.
export function durumGecir(talep, yeniDurum, zaman) {
  if (!izinliGecisler(talep.durum).includes(yeniDurum)) return null

  if (yeniDurum === 'Çözüldü') {
    return {
      ...talep,
      durum: yeniDurum,
      ilkYanitTarihi: talep.ilkYanitTarihi || zaman,
      cozulmeTarihi: zaman,
    }
  }

  if (talep.durum === 'Çözüldü') {
    return { ...talep, durum: yeniDurum, cozulmeTarihi: null }
  }

  return {
    ...talep,
    durum: yeniDurum,
    ilkYanitTarihi: talep.ilkYanitTarihi || zaman,
  }
}
