# RAG Karar Tablosu

**Soru:** Bu proje için RAG (Retrieval-Augmented Generation) gerekir mi?

| Soru | Proje 1: Vaka A (`docs/` altında 407 satır) | Proje 2: 300 sayfalık BT politika dokümanı |
| --- | --- | --- |
| Bilgi kaynağı ne kadar büyük? | 407 satır, `@` ile tek seferde okunabilir | 300 sayfa, ajanın tek seferde bağlamına sığması zor |
| Sık değişiyor mu? | Proje ilerledikçe değişir, ama dosya doğrudan güncellenir | Yılda iki kez, seyrek |
| Ajan bunu doğrudan dosyadan okuyabilir mi? | Evet, satır numarasıyla kaynak gösterdi | Kısmen. Her talepte ilgili maddeleri bulup getirmek gerekir |
| **RAG gerekir mi?** | **Hayır** | **Evet** |
| Gerekçe | Bilgi küçük ve ajan dosyadan okuyabiliyor, ek altyapı gereksiz karmaşıklık | Her talep için 300 sayfadan yalnızca ilgili maddeleri bulup kaynağıyla göstermek gerekiyor |

## Deney notu (Vaka A)

Ajana `@docs/PRD.md` ve `@docs/SPEC.md` ile "talep durumları nelerdir" sorusu soruldu.
Ajan cevabı ek bir altyapı olmadan iki dosyadan çıkardı ve kaynağı satır numarasıyla gösterdi
(`SPEC.md:120`, `SPEC.md:171-173`, `SPEC.md:58`, `PRD.md:29`).
Neyin dosyada yazılı, neyin kendi çıkarımı olduğunu da ayırdı.

## Karar ölçütleri

- **Boyut:** Bilgi, ajanın isteme `@` ile ekleyip okuyabileceği kadar küçük mü?
- **Değişkenlik:** Bilgi sık değişiyorsa her değişimde elle güncelleme gerekir mi?
- **Erişim:** Ajan her soruda yalnızca ilgili kısmı bulup getirebilmeli mi?