# legacy/talepRaporu.js risk raporu

Tarih: 2026-11-05. Kaynaklar: `legacy/talepRaporu.js`, `docs/legacy-harita.md`, `legacy/talepRaporu.test.js`. Gizli değerler bu belgeye yazılmamıştır.

## 1. Yönetici özeti

**Modül ne yapıyor:** Talep listesinden SLA raporu üretir (ihlal sayısı, ortalama süreler, birim ve kişi dağılımı). Raporu metin ve CSV'ye çevirir, e-posta, veritabanı ve rapor servisine göndermeye çalışır. Kod içi nota göre çıktılar muhasebeye gidiyor.

**En büyük 3 risk:**

1. **Muhasebeye yanlış rakam gidebilir.** En çok geciken, hiç yanıtlanmamış talepler ihlal sayılmıyor. Ortalamalar yanlış sayıya bölünüyor, ihlal oranı %100'ü aşabiliyor, ay adları bir ay kayıyor.
2. **Yanlış rapor veya gitmeyen rapor fark edilmiyor.** Önbellek başka birimin raporunu döndürebiliyor. Kayıt işlevi hiçbir şey kaydetmiyor, rapor servisine gönderim hep başarısız oluyor, e-posta servisi 500 dönse de "başarılı" yanıtı alınıyor.
3. **Gizli bilgiler açıkta.** API anahtarı, veritabanı parolası ve servis kimlik bilgisi kaynak kodda ve git geçmişinde; parola ayrıca loglara yazılıyor.

**Hemen yapılması gerekenler:**

- Gizli bilgileri bugün değiştirin. Gerçek olup olmadıkları doğrulanamadı, gerçek kabul edin.
- Dosya sahibiyle görüşün: muhasebe hangi çıktıyı, hangi yoldan alıyor, hangi kararda kullanıyor? Bu kod bugünkü haliyle üç kanaldan da rapor iletemiyor görünüyor, yani gerçek yol **doğrulanamadı**.
- Düzeltmeler bitene kadar muhasebeye giden raporları elle kontrol edin: "NaN", "undefined" veya %100 üstü oran içeren raporu göndermeyin.
- Rakamı değiştiren düzeltmeleri sahibin onayı olmadan yayına almayın.

Eldeki testlerin tümü geçiyor (24/24), ama bunlar hatalı davranışı da bilerek sabitliyor. Geçen test, rakamın doğru olduğunu göstermez.

---

# Teknik ek

## 2. Önceliklendirilmiş bulgu tablosu

Satırlar önerilen sıraya göre dizilidir; aynı sıra numarası aynı adımda yapılır. Numaralar `docs/legacy-harita.md` ile aynıdır. **E1** ve **T1-T4** bu rapora özgüdür.

**Kanıt:** [D] sahte veriyle çalıştırıldı, gerçek servise bağlanılmadı. [O] yalnızca kod okundu.

**Olasılık:** Üretim kullanımı görülemediği için koddan yapılan tahmindir. Yüksek: olağan veriyle çoğu raporda. Orta: belirli veri veya kullanımda. Düşük: nadir, kötü niyet veya henüz olmayan bir ön koşul gerekir.

**Efor (tahmin):** S: tek işlev, yarım güne kadar. M: birkaç işlev veya bir karar, 1-3 gün. L: başka ekip, altyapı veya kurumsal karar gerekir, 1 hafta ve üzeri.

| No | Bulgu | Etki | Olasılık | Efor | Sıra |
|---|---|---|---|---|---|
| G1 | Anahtar, DB kullanıcısı, parola ve kimlik bilgili URL kaynakta ve `d188b0c` geçmişinde (9-12) [D] | Güvenlik | Yüksek | M | 1 |
| G2 | Parola düz metin loglanıyor (77, 386) [D] | Güvenlik | Yüksek; `raporuKaydet` çağrısına bağlı | S | 2 |
| V3 | `debug` açıkken talebin tamamı loglanıyor (201-203) [D] | Güvenlik (KVKK) | Orta | S | 2 |
| V4 | Özet içeren SQL loglanıyor (80, 393) [D] | Güvenlik (KVKK) | Orta | S | 2 |
| G3 | API anahtarı URL'de (366) [D] | Güvenlik | Yüksek | S; servisin başlık desteği doğrulanamadı | 3 |
| G4 | INSERT metin birleştirmeyle kuruluyor; `birim` parametresi ve `o.kullanici` ham giriyor (388-396) [D] | Güvenlik | Bugün Düşük (`db` yalnızca logluyor); sürücü bağlanınca Yüksek | M | 4 |
| G5 | DELETE birleştirmeyle kuruluyor, yetki yok (401-403) [D] | Güvenlik, muhasebe | Bugün Düşük; sürücü bağlanınca Yüksek | M | 4 |
| G8 | Prototype pollution: `birim: "__proto__"` veya `"constructor"` global nesnelere `NaN` yazıyor (210-213, 227, 235) [D] | Güvenlik, veri doğruluğu | Düşük; `birim` kaynağı doğrulanamadı | S | 5 |
| R17 | "constructor" gibi kişi adı sayacı bozuyor (216) [D] | Veri doğruluğu | Düşük | S | 5 |
| G6 | CSV kaçışı yok: virgül sütun kaydırıyor, `=` formül olabilir (290) [D] | Muhasebe, güvenlik | Yüksek (başlıkta virgül olağan) | S; muhasebe içe aktarımı doğrulanmalı | 6 |
| V1 | Kişi başına talep sayısı raporda ve servise giden gövdede (215-217, 257, 409) [D] | Güvenlik (KVKK) | Yüksek; gönderim düzelince | M | 7 |
| V2 | `enCokTalepEden` tek çalışanı öne çıkarıyor (346-357) [O] | Güvenlik (KVKK) | Orta | S | 7 |
| V5 | Birim ve SLA özeti şirket dışı adrese gidiyor (366, 373) [O] | Güvenlik (KVKK) | Doğrulanamadı; `.example` yer tutucu olabilir | L | 7 |
| V6 | CSV kişi adlarını süzmeden içeriyor (290) [O] | Güvenlik (KVKK) | Orta | M | 7 |
| V7 | Saklama ve silme kuralı yok; SPEC AS-9 açık [O] | Güvenlik (KVKK) | Orta | L | 7 |
| G7 | Yetki denetimi yok (tüm dosya) [O] | Güvenlik | Doğrulanamadı; çağıran tarafında olabilir | L | 7 |
| R1 | Önbellek anahtarı yalnızca liste uzunluğu; başka birim veya dönemin raporu dönüyor (160-163, 280) [D] | Muhasebe, veri doğruluğu, güvenlik | Uzun çalışan süreçte Yüksek; süreç modeli doğrulanamadı | S | 8 |
| R5 | `null` tarih 1970 sayılıyor, ortalama büyük negatif oluyor (88-93) [D] | Muhasebe, veri doğruluğu | Orta; bu portal yeniden açmada `null` yazıyor | S | 9 |
| E1 | Çözüm tarihi açılıştan önceyse negatif süre ihlal sayılmıyor, ortalamayı düşürüyor (93, 230-236) [D] | Veri doğruluğu | Düşük | S | 9 |
| R6 | Ortalamalar tarihi dolu talep sayısına değil tüm talep sayısına bölünüyor (62-63) [D] | Muhasebe, veri doğruluğu | Yüksek | S | 10 |
| R4 | Yanıtlanmamış veya çözülmemiş talep ihlal sayılmıyor (222, 230) [D] | Muhasebe, veri doğruluğu | Yüksek | M | 11 |
| R3 | Düşük öncelik çözüm eşiği 120 yerine 72 saat (50, 25) [D] | Muhasebe, veri doğruluğu | Orta | S | 12 |
| R13 | Orta ilk yanıtta `>=`, diğerlerinde `>` (43) [D] | Muhasebe, veri doğruluğu | Düşük; yalnızca tam 8 saatte | S | 13 |
| R7 | Bir talep iki ihlal sayılıyor, oran %100'ü aşıyor (225-234, 64, 269) [D] | Muhasebe, veri doğruluğu | Orta | M | 14 |
| R8 | Boş listede oran `NaN`, renk "yesil" (269-277) [D] | Muhasebe, veri doğruluğu | Orta | S | 15 |
| R9 | Talebi olmayan öncelikte özet metnine "NaN" yazılıyor; tek öncelikli raporda 9 alan [D] | Muhasebe, veri doğruluğu | Yüksek | S | 15 |
| R10 | Ay adı bir ay kayıyor: Ocak "undefined", Aralık "Kasim" (128, 152-153, 109) [D] | Muhasebe, veri doğruluğu | Yüksek (ay listeli her özet) | S | 16 |
| R11 | Yalnızca tarih verilen bitiş gününün talepleri düşüyor (181) [D] | Muhasebe, veri doğruluğu | Yüksek; çağıranın tarih biçimine bağlı | M | 17 |
| R14 | Bilinmeyen öncelik sessizce "Orta" oluyor (121) [D] | Veri doğruluğu | Düşük | S | 18 |
| R15 | Tanınmayan durum hiçbir sayaca girmiyor (205-207) [D] | Veri doğruluğu | Düşük | S | 18 |
| R16 | Hafta anahtarında yıl yok; farklı yıllar birleşiyor (100-105, 140-144) [D] | Veri doğruluğu | Orta; yılları aşan raporda | S | 18 |
| R18 | E-posta servisi hata dönse de `true` (377-378) [D] | Muhasebe | Orta | S | 19 |
| R19 | Ağ hatası izsiz yutuluyor (379-381) [D] | Muhasebe | Orta | S | 19 |
| R21 | Boş alıcı dizisi varsayılana düşmüyor (362) [D] | Muhasebe | Düşük | S | 19 |
| R2 | Kimlik bilgili URL reddediliyor, işlev sessizce 0 dönüyor (12, 407, 412) [D] | Muhasebe | Yüksek | M | 20 |
| R20 | `raporuKaydet` ve `birimRaporunuSil` gerçekte çalışmıyor, başarılı gibi dönüyor (74-83, 385-403) [D] | Muhasebe | Yüksek | L | 20 |
| R12 | Portalın `olusturma` alanı okunmuyor (113) [D] | Veri doğruluğu | Bugün Düşük (depoda bağlantı yok); bağlanırsa Yüksek | M | 21 |
| T1 | Ölü kod: `gunFarki`, `tmp2`, `sonuc_global`, `son_birim`, kullanılmayan sayaçlar, yorumdaki eski hesap [O] | Yok (bakım) | - | S | 22 |
| T2 | Girdi dizisi yerinde sıralanıyor, önbellekten aynı nesne paylaşılıyor (168, 162, 281) [D] | Veri doğruluğu | Orta | S | 23 |
| T3 | `ozetMetni` dört kopya blok içeriyor (301-320) [O] | Yok (bakım) | - | S | 24 |
| T4 | `fetch` çağrılarında zaman aşımı yok (365, 407) [O] | Muhasebe | Düşük | S | 25 |

## 3. Önerilen düzeltme sırası

Her sıra numarası ayrı commit olmalı. Böylece rakamdaki her değişiklik tek bir nedene bağlanır.

### Hazırlık (kod değişikliği yok)

Dosya sahibine satır 4'teki not gereği sorulmalı. Şu yanıtlar olmadan aşama 2 başlamamalı: gerçek çağıranlar, muhasebeye giden kanal, resmi SLA eşikleri, geçmiş raporlara ne olacağı (bkz. Bölüm 5).

### Aşama 1: Güvenlik (sıra 1-7)

| Sıra | İş | Dikkat |
|---|---|---|
| 1 | G1: Önce tüm kimlik bilgilerini değiştir, sonra koddan ortam değişkenine taşı | Asıl koruma değiştirmedir; geçmişi temizlemek yetmez. Bu depoda uzak sunucu yok, ama modülün geldiği kaynak ve diğer kopyalar doğrulanamadı. Geçmiş yeniden yazılacaksa ayrı karar gerekir. |
| 1 | R2'nin kimlik bilgisi kısmı | **Tuzak:** URL'den kimlik bilgisi çıkınca gönderim çalışmaya başlayabilir; yanlış rakamlar ve kişi adları (V1) servise akar. Sıra 20'ye kadar `RAPOR_URL` tanımsız bırakılmalı; `fetch` hata verir, işlev bugünkü gibi 0 döner. |
| 2 | G2, V3, V4: Parola, talep içeriği ve SQL'i loglardan çıkar | Mevcut log depolarında parola kalmış olabilir; log erişimi ve temizliği doğrulanamadı. |
| 3 | G3: Anahtarı `Authorization` başlığına taşı | Servis desteği doğrulanamadı. |
| 4 | G4, G5: Parametreli sorgu arayüzü | Gerçek sürücü bu adımda bağlanmaz (R20). `raporuKaydet` dönüşü olan `sorgu.length` korunmalı veya değişimi sahiple konuşulmalı; çağıranlar görülemiyor. Sürücü kütüphanesi için ayrıca onay gerekir. |
| 5 | G8, R17: Sayaçları `Map` ile tut, sonucu `Object.fromEntries` ile kur | `Object.create(null)` önerilmez: altın testteki katı karşılaştırmayı ve prototip yöntemi kullanan çağıranları bozar. |
| 6 | G6: CSV kaçışı ve formül koruması | **Çıktı biçimi değişir.** Muhasebe özel bir içe aktarım kullanıyorsa bozulabilir; sahibin onayı ve örnek dosyayla deneme gerekir. |
| 7 | V1, V2, V5, V6, V7, G7: Kişisel veri ve yetki kararları | Kod işi değil önce karar işi. SPEC Bölüm 5 raporda toplu sayı ister, Bölüm 3 veriyi şirket içinde tutar, AS-9 açıktır. `kisiler` alanı kalkarsa `enCokTalepEden` de etkilenir. |

G8 için not: yazılan değer her zaman `NaN`, anahtarlar yalnızca `toplam` ve `ihlal`. Yani saldırgan keyfi değer yazamaz. Yine de etki süreç yeniden başlayana kadar sürer: bu anahtarlar `for...in` döngülerinde her nesnede görünür ve ilgili birim rapordan kaybolur.

### Aşama 2: Veri doğruluğu (sıra 8-21)

**Bu aşamadaki düzeltmeler muhasebe çıktısını değiştirir. Her biri için sahibin onayı gerekir.** Önerilen yöntem: düzeltme öncesi ve sonrası raporu aynı veriyle yan yana çıkarıp sahibe göstermek, ilk dönem iki hesabı paralel çalıştırmak.

Sıranın mantığı: R1 ilk gelir, yoksa önce-sonra karşılaştırması güvenilmez olur. R5 ve R6 ortalamaların temelidir. R4 hangi taleplerin sayılacağını belirler. Eşikler (R3, R13) ayrı commit'lerde gelir ki etkileri ayrı görülsün. Gönderim (R2, R20) en sona kalır: rakamlar doğrulanmadan kanal açılmaz.

Sahibin karar vermesi gerekenler:

| Sıra | Bulgu | Sorulacak | Altın veride etkisi |
|---|---|---|---|
| 8 | R1 | Rapor üretimi uzun çalışan bir süreçte mi? Önbellek gerekli mi? | Formül değişmez, dönen rapor değişir |
| 9 | R5, E1 | Negatif süre veri hatası olarak mı raporlansın? | `null` senaryosunda `ortIlk` -492537 yerine yok sayılır |
| 10 | R6 | Payda yanıtlı talep sayısı mı olsun? Hiç yanıtlı talep yoksa ne yazılsın? | `orta.ortIlk` 4→8, `ortCoz` 36→72 (elle hesap, çalıştırılmadı) |
| 11 | R4 | Açık talep raporun hangi anına göre geciken sayılır? | Rapor tarihine bağlı; artış beklenir, ölçülmedi |
| 12 | R3 | Geçerli eşik 120 mi, 72 mi? 120 tanımlı ama okunmuyor; geçerli değer doğrulanamadı | İhlal 5→4, oran %83→%67, Finans 1→0 |
| 13 | R13 | Tam 8 saat ihlal mi? | İhlal 5→4, oran %83→%67, Belirsiz 1→0 |
| 14 | R7 | Oran talep başına mı, ihlal olayı başına mı? | Ölçülmedi |
| 16 | R10 | Düzeltme yalnızca başlıkta mı? `aylik` anahtarlarını (`2026-0`) okuyan var mı? | Metinde "undefined 2026" → "Ocak 2026", "Subat" → "Mart", "Mart" → "Nisan" |
| 17 | R11 | Dönem sınırı hangi saat dilimine göre? | Süzgeç UTC, ay dağılımı sunucu yerel saati kullanıyor (okuma); sunucu saat dilimi doğrulanamadı |

**R3 ve R13 birlikte:** ihlal 5→3, oran %83→%50, renk **kirmizi→sari** (kodun geçici, maskeli kopyasında çalıştırıldı). Altın veri bu sınırlara bilerek oturtulmuştur; gerçek verideki büyüklüğü göstermez. Yine de eşik düzeltmesinin yönetim rengini değiştirebildiğini gösterir.

Geçmiş raporlar: bu hataların önceki dönemlerdeki etkisi gerçek veri olmadan ölçülemez. Geçmişe dönük düzeltme gerekip gerekmediği muhasebe ve sahiple kararlaştırılmalı.

### Aşama 3: Temizlik (sıra 22-25)

Çıktıyı değiştirmemeli; altın testler aynen geçmeli. `rapor_v1` (416-425) "silmeyin" notu taşıdığı için sahibe sormadan silinmemeli. T4 başarısız gönderim davranışını etkilediğinden sıra 19 ile birlikte de yapılabilir.

## 4. Her düzeltme için önce yazılacak test

Mevcut testler yalnızca `rapor_uret`, `ozetMetni`, `birimOzeti`, `enCokTalepEden` ve `csv_yaz` işlevlerini çağırır. **`epostaGonder`, `raporuKaydet`, `birimRaporunuSil`, `raporuGonder` için hiç test yok**; güvenlik adımlarının çoğu bu yüzden sıfırdan test ister.

Yöntem: düzeltmeden önce bugünkü davranışı sabitleyen veya bugün kırmızı olan test yazılır, düzeltmeyle yeşile döner. `fetch` ve `console.log` sahte olmalı, ağa çıkılmamalı. Testlere gerçek gizli değer yazılmamalı; sahte ortam değerleri kullanılmalı. Modül her `taze()` çağrısında yeniden yüklendiği için ortam değişkenleri içe aktarmadan önce ayarlanabilir.

| Sıra | Düzeltme | Önce yazılacak test | Mevcut testlere etkisi (`talepRaporu.test.js`) |
|---|---|---|---|
| 1 | G1 | Kaynakta sabit kimlik bilgisi kalıbı (`const ...PASSWORD = "`, `://kullanıcı:parola@`) bulunmamalı; ayarlar ortamdan okunmalı | Yok |
| 1 | R2 (kısmi) | `RAPOR_URL` tanımsızken `raporuGonder` 0 döner, gönderim yapılmaz | Yok |
| 2 | G2, V3, V4 | `raporuKaydet` sonrası hiçbir log satırı sahte parolayı içermemeli; `debug: true` ile talep adı loga düşmemeli | Yok |
| 3 | G3 | `epostaGonder` sahte `fetch`'e giden URL'de anahtar yok, başlıkta var; gövde aynı | Yok |
| 4 | G4 | Tırnaklı `birim` ve `o.kullanici` SQL metnine girmemeli, parametre listesinde olmalı. Önce `raporuKaydet` dönüş tipi sabitlenmeli | Yok |
| 4 | G5 | Tırnaklı birim adı DELETE metnine girmemeli | Yok |
| 5 | G8, R17 | `__proto__` ve `constructor` birim ve kişi adlarıyla çalıştır: `Object.prototype` ve `Object` temiz kalmalı, kayıt raporda doğru sayılmalı. Test sonunda kirlenen alanlar silinmeli | Altın test geçmeye devam etmeli |
| 6 | G6 | Virgül, tırnak, satır sonu, `=`, `+`, `-`, `@` ile başlayan değerler; ayrıca Excel'de ve muhasebe içe aktarımında elle deneme | 367-375, 377-385 değişir |
| 7 | V1, V2, V6 | Karar sonrası: servise giden gövdede ve CSV'de kişi adı olmamalı (sahte `fetch` ile) | Altın test 119 (`kisiler`), 178-182 değişebilir |
| 8 | R1 | Aynı uzunlukta farklı birim, tarih ve veriyle doğru rapor; aynı girdide aynı sonuç | 186-198 tersine döner |
| 9 | R5, E1 | `null` tarih ve negatif süre ortalamaya girmemeli; alan yokken davranış aynı kalmalı | 297-312 değişir |
| 10 | R6 | Bir yanıtlı, bir yanıtsız talepte ortalama yanıtlı olana eşit; hiç yanıtlı yokken üzerinde anlaşılan değer | 314-324 ve altın test 110-111 değişir; ayrıca R12 ve R5 testleri gözden geçirilmeli |
| 11 | R4 | Sabit "şimdi" verilerek süresi dolmuş yanıtsız ve çözülmemiş talep ihlal sayılmalı, süresi dolmamış sayılmamalı. Önce fonksiyona zaman girdisi eklenmeli, yoksa test tarihe bağlı olur | 286-295, altın test, R5 ve R7 testleri değişir |
| 12 | R3 | Düşük çözüm: 120 s ihlal değil, 120 s 1 dk ihlal, 96 s ihlal değil | 268 ve altın testler (`dusuk`, `Finans`, toplamlar, 156 ve 160. satır metinleri) |
| 13 | R13 | Orta ilk yanıt: 8 s ihlal değil, 8 s 1 dk ihlal | 265 ve altın testler (`orta`, `Belirsiz`, toplamlar, metin) |
| 14 | R7 | İki eşiği de aşan tek talep için onaylanan tanım; oran %100'ü geçmemeli | 326-347 ve altın test değişir; satır 338 uyarısı gereksiz kalabilir |
| 15 | R8, R9 | Boş liste ve tek öncelikli raporda metinde "NaN" yok, renk "yesil" değil, üzerinde anlaşılan "veri yok" değeri | 349-361 değişir |
| 16 | R10 | Ocak ve Aralık dahil 12 ay için başlık, saat diliminden bağımsız tarihlerle | 161-163 değişir |
| 17 | R11 | Bitiş günü 23:59 dahil, ertesi gün 00:00 hariç; onaylanan saat diliminde ay sınırı talepleri | 221-236 değişir |
| 18 | R14, R15, R16 | Bilinmeyen öncelik ve durum için onaylanan davranış; 2025 ve 2026'nın aynı haftası ayrı | Altın test 121 anahtar biçimine göre değişebilir |
| 19 | R18, R19, R21 | Sahte `fetch` 500 → `false`; ağ hatası → `false` ve parola içermeyen log; boş alıcı → onaylanan davranış | Yok |
| 20 | R2 | Başarılı istek ve hata durumu ayrı dönüş verir; gövde sıra 7 kararına uyar. Ayrıca şirket içi test servisinde elle deneme | Yok |
| 20 | R20 | Geçici test veritabanına gerçek kayıt ve okuma; sürücü hatasında başarı dönmemeli | Yok |
| 21 | R12 | Portal biçimindeki kayıt (`olusturma`) doğru tarih ve dağılım verir | 238-255 değişir |
| 22, 24 | T1, T3 | Yeni test gerekmez; altın testler güvencedir. T3 için tüm öncelikleri dolu ek bir metin testi yeterli | Değişmemeli |
| 23 | T2 | Girdi dizisi çağrı sonrası aynı sırada; dönen sonucu değiştirmek sonraki çağrıyı etkilememeli | 200-208 değişir |
| 25 | T4 | Sahte, hiç yanıt vermeyen `fetch` ile zaman aşımında `false` veya 0 döner | Yok |

## 5. Doğrulanamayanlar

Bu maddeler koddan veya depodan doğrulanamadı.

| Konu | Neden önemli | Kim yanıtlayabilir |
|---|---|---|
| Muhasebe çıktıyı nasıl alıyor ve ne için kullanıyor; para etkisi var mı | Risk 1'in gerçek büyüklüğü buna bağlı. "Muhasebeye gidiyor" bilgisinin tek kaynağı satır 4'teki yorum | Dosya sahibi, muhasebe |
| Gerçek çağıranlar | Depoda modülü yalnızca testi içe aktarıyor; dönüş değerlerine kimin bağlı olduğu bilinmiyor | Dosya sahibi |
| Rapor gerçekte nasıl iletiliyor | Rapor servisi hata veriyor (R2), `db` yalnızca logluyor (R20), e-posta adresi `.example` alan adında ve bu alan adı gerçek kullanıma kapalıdır. Bu depodaki kopya üretimdekinden farklı olabilir | Dosya sahibi, BT |
| Gizli değerler gerçek ve geçerli mi, başka nerelerde kopyası var | Yer tutucu sözcük içermiyorlar, ama geçerlilikleri denenmedi. HEAD'de yalnızca bu dosyada geçiyorlar | BT, güvenlik |
| Üretim logları nereye gidiyor, kim okuyor | G2, V3, V4'ün etkisi | BT |
| Üretim süreci uzun mu çalışıyor | R1 ve G8 etkisi buna bağlı | Dosya sahibi, BT |
| Resmi SLA eşikleri | R3 ve R13'ün doğru değeri. Eşikler SPEC'te yok | Sözleşme sahibi, BT yönetimi |
| `sla_raporlari` tablosu ve eski kayıtlar var mı | R20, G5 | Veritabanı yöneticisi |
| Geçmiş raporlarda hatanın etkisi | Gerçek veri yok; yalnızca sahte veri denendi | Muhasebe, dosya sahibi |
| Sahibe danışıldı mı | Satır 4'ün notuna rağmen `022426c` ve `6222fb0` dosyayı düzenledi; depoda danışma kaydı yok. Bu iki commit sonrası testler geçiyor. Satır 3'teki kişinin hâlâ sahip olup olmadığı da bilinmiyor | Depo sahibi |
| Olasılık ve efor değerleri | Üretim verisi ve ekip kapasitesi olmadan yapılmış tahminlerdir | Ekip |

## 6. Denemeler ve haritaya göre farklar

2026-11-05 tarihinde `node --test legacy/talepRaporu.test.js` çalıştırıldı: 24 test, 24 geçti. Ek denemeler kodun geçici, gizli değerleri maskelenmiş kopyasıyla ve sahte `fetch` ile yapıldı. R2 için gerçek URL yalnızca `new Request` ile denendi, ağa çıkılmadı (TypeError). Gerçek servislere bağlanılmadı.

`docs/legacy-harita.md` değiştirilmedi. Haritaya işlenmesi önerilen farklar:

- **G8:** `__proto__` artık denendi: `Object.prototype.toplam` ve `.ihlal` `NaN` oluyor, birim `birimler` içinde görünmüyor. Kişi adı olarak `__proto__` kirletmiyor ama kişi sayımdan düşüyor.
- **G4:** Yalnızca `birim` parametresi ve `o.kullanici` ham giriyor. Talep alanları (başlık, talep eden) SQL'e girmiyor.
- **R9:** Boş liste gerekmiyor; talebi olmayan her öncelikte oluşuyor.
- **R10:** Aralık "Kasim" olarak yazılıyor.
- **E1:** Yeni bulgu (negatif süre).
- **R11:** Süzgecin UTC, ay dağılımının yerel saat kullanması ek bir uyumsuzluk (okuma).
- **Okumadan denemeye geçenler:** R14, R15, R16, R19, R21, G3, G5, V1, V3, V4.
