# legacy/talepRaporu.js kod haritası

Modül, talep listesinden SLA raporu üretir, raporu metin ve CSV'ye çevirir, e-posta, veritabanı ve rapor servisine gönderir. Sürüm notu v1.3 (2021), son düzenleme 2023-03 (satır 2-3). Satır 4'teki nota göre çıktılar muhasebeye gidiyor ve değişiklikten önce dosya sahibine sorulması isteniyor.

Depoda bu modülü içe aktaran dosya yok ve testi yok (satır 6). Gerçek çağıranlar bu depodan görülemiyor.

**İşaretler:** "Denendi" sahte veriyle çalıştırılarak görüldü. "Okuma" yalnızca kod okunarak çıkarıldı. Gerçek servislere bağlanılmadı.

## Ana akış

Dosyada akışı baştan sona yöneten bir işlev yok; sırayı çağıran belirler. Giriş noktası `rapor_uret` (satır 118, varsayılan dışa aktarım satır 491).

1. Çağrı sayacı artar (119).
2. Önbellek denetimi: liste uzunluğu aynıysa eski sonuç döner (120-123).
3. Liste tarihe göre sıralanır, girdi dizisi yerinde değişir (128-134).
4. Tarih ve birime göre süzülür (136-144).
5. Her talep için süreler, durum, birim ve kişi sayaçları ile öncelik bazlı SLA ihlalleri hesaplanır (181-278).
6. Sonuç nesnesi kurulur (284-325), genel ihlal yüzdesi ve renk eklenir (327-337).
7. Sonuç global değişkene ve önbelleğe yazılır, döndürülür (339-341).
8. Çağıran sonucu çıktı işlevlerine (`ozetMetni`, `birimOzeti`, `enCokTalepEden`) veya dış işlevlere (`epostaGonder`, `raporuKaydet`, `raporuGonder`) verir.

`csv_yaz` (346) ve `birimRaporunuSil` (461) bu akışın dışındadır; rapor nesnesini kullanmazlar.

## Fonksiyonlar

| Satır | Fonksiyon | Dışa açık | Sorumluluk |
|---|---|---|---|
| 35 | `db.baglan` | Hayır | Bağlanmaz, bağlantı bilgisini loglar |
| 39 | `db.calistir` | Hayır | Çalıştırmaz, SQL'i loglar, hep `true` döner |
| 47 | `sureHesapla` | Hayır | İki tarih arası saat; geçersiz tarihte `null` |
| 56 | `gunFarki` | Hayır | İki tarih arası gün; **kullanılmıyor** |
| 60 | `haftaNo` | Hayır | Yılın başından hafta numarası |
| 67 | `ayAdi` | Hayır | 1-12 ay numarasından ad |
| 72 | `tarihAl` | Hayır | `olusturmaTarihi`, `acilis`, `tarih` alanlarından ilk dolu olan |
| 76 | `oncelikNormal` | Hayır | Öncelik yazımlarını dört değere indirir; bilinmeyen değer "Orta" |
| 84 | `aylikDagilim` | Hayır | Yıl-ay başına talep sayısı |
| 97 | `haftalikDagilim` | Hayır | Hafta numarası başına talep sayısı |
| 109 | `aylikBaslik` | Hayır | `yıl-ay` anahtarını okunur başlığa çevirir |
| 118 | `rapor_uret` | Evet | Ana hesap; yukarıdaki akış |
| 346 | `csv_yaz` | Evet | Talep listesinden CSV metni |
| 355 | `ozetMetni` | Evet | Rapordan düz metin özet |
| 391 | `birimOzeti` | Evet | Birim başına talep ve ihlal metni |
| 406 | `enCokTalepEden` | Evet | En çok talep açan kişi ve sayısı |
| 421 | `epostaGonder` | Evet | Özeti dış e-posta servisine gönderir |
| 445 | `raporuKaydet` | Evet | INSERT cümlesi kurar, `db` üzerinden loglar, cümle uzunluğunu döner |
| 461 | `birimRaporunuSil` | Evet | Birimin raporları için DELETE cümlesi kurar, loglar |
| 465 | `raporuGonder` | Evet | Raporun tamamını rapor servisine gönderir; HTTP durumu veya 0 döner |
| 487 | `tmp2` | Hayır | Sayacı döner; **kullanılmıyor** |

## Global durum

Hepsi modül düzeyindedir; aynı süreçteki tüm çağıranlar ve kullanıcılar paylaşır.

| Satır | Değişken | Yazan | Okuyan | Not |
|---|---|---|---|---|
| 29 | `_onbellek` | 340 | 120, 122 | Süresi yok, temizlenmiyor; bkz. R1 |
| 30 | `sayac` | 119 | 121, 488 | Yalnızca log için |
| 31 | `sonuc_global` | 339 | Yok | Ölü yazma |
| 32 | `son_birim` | 125 | Yok | Ölü yazma |

Ek yan etki: `rapor_uret` çağıranın dizisini yeniden sıralar (128). Aynı nesneyi döndürdüğü için bir çağıranın sonucu değiştirmesi diğerini de etkiler (122, 341).

## Dış bağımlılıklar

| Satır | Bağımlılık | Durum |
|---|---|---|
| 425-436 | E-posta servisi `api.eposta-servisi.example`, POST | Şirket dışı adres; anahtar URL'de |
| 12, 467-470 | Rapor servisi `raporlar.sirket.local`, POST | Şirket içi; hiç gönderemiyor, bkz. R2 |
| 34-43, 446, 457, 462 | Veritabanı `db.sirket.local`, tablo `sla_raporlari` | **Gerçek bağlantı yok**, `db` yalnızca log yazıyor |
| 37, 40, 121, 188, 437 | `console.log` | Kimlik bilgisi ve talep içeriği dahil |
| 425, 467 | Global `fetch` | Zaman aşımı yok |

Dosyada `import` yoktur.

## Riskli yerler

### Rapor sonucunu yanlış çıkaranlar

| No | Satır | Önem | Bulgu | Kanıt |
|---|---|---|---|---|
| R1 | 120-123, 340 | Yüksek | Önbellek anahtarı yalnızca liste uzunluğu. Tarih, birim ve veri değişse de eski sonuç döner; başka birimin raporu da dönebilir | Denendi: IK istendi, BT raporu döndü |
| R3 | 272 (25) | Yüksek | Düşük öncelik çözüm eşiği yanlışlıkla `SLA_SAAT.orta.coz` (72 saat); `SLA_SAAT.dusuk.coz` (120) hiç kullanılmıyor | Denendi: 96 saatlik çözüm ihlal sayıldı |
| R4 | 207, 215 (ve diğer dallar) | Yüksek | Yanıtlanmamış veya çözülmemiş talep ihlal sayılmaz, çünkü yalnızca tarihi dolu olanlar denetlenir. En çok geciken talepler rapora ihlal olarak girmez | Denendi: yanıtsız Acil talepte ihlal 0 |
| R5 | 48-53 | Yüksek | `new Date(null)` geçerli tarih (1970) sayılır. `null` tarih `null` süre yerine çok büyük negatif süre verir, ortalamayı bozar. Bu portal yeniden açmada `cozulmeTarihi: null` yazıyor (`src/durumGecisleri.js`) | Denendi: `ortCoz` = -492536 saat |
| R6 | 295-296 (302-303, 309-310, 316-317) | Yüksek | Ortalamalar tarihi dolu talep sayısına değil tüm talep sayısına bölünür. `*_ilk_say`, `*_coz_say` sayılır ama hiç okunmaz (151-152 vb.) | Denendi: tek yanıtlı 4 saat, ortalama 2 saat |
| R7 | 210-219, 297, 329 | Orta | Bir talep iki ihlal sayılabilir, yüzde talep sayısına bölünür; 100'ü aşar. Satır 398 bunu fark edip yalnızca uyarı yazar | Denendi: %200 |
| R8 | 329-337 | Orta | Boş listede yüzde `NaN` olur, renk "yesil" kalır. Veri yokken rapor sağlıklı görünür | Denendi |
| R9 | 295-297 ve benzerleri, 364-380 | Orta | Öncelikte talep yoksa 0/0 oluşur; özet metnine "NaN" yazılır | Denendi: yüzde `NaN`; metin okuma |
| R10 | 88, 112-113, 69 | Orta | `getMonth` 0 tabanlı, `ayAdi` 1 tabanlı. Ay adı bir önceki aya kayar, Ocak "undefined" olur | Denendi: Ocak "undefined 2026", Mart "Subat 2026" |
| R11 | 141 | Orta | Yalnızca tarih verilen bitiş günü gece yarısı sayılır, o günün talepleri rapordan düşer | Denendi: 31 Mart 09:00 talebi dışarıda |
| R12 | 73 | Orta | Alan adları bu portalla uyuşmuyor: portalda `olusturma` var. Tarih boş kalır, süzgeç hepsini geçirir, süre hesaplanmaz, dağılım anahtarları `NaN` olur | Denendi: `{"NaN-NaN":1}`, ihlal 0 |
| R13 | 246 | Düşük | Orta ilk yanıtta `>=`, diğer tüm eşiklerde `>`. Tam 8 saat ihlal sayılır | Denendi |
| R14 | 81 | Düşük | Bilinmeyen veya boş öncelik sessizce "Orta" olur | Okuma |
| R15 | 191-193 | Düşük | Tanınmayan durum hiçbir sayaca girmez; `acik + islemde + cozuldu` toplamı tutmayabilir | Okuma |
| R16 | 60-65, 100-104 | Düşük | Hafta anahtarında yıl yok, farklı yılların aynı haftası birleşir; ISO hafta değildir | Okuma |
| R17 | 196, 202 | Düşük | `{}` üzerinde `== undefined` denetimi: "constructor" gibi adlar sayacı bozar | Denendi: kişi sayısı `NaN`, sonuç " (0)" |

### Sessiz hatalar

| No | Satır | Önem | Bulgu | Kanıt |
|---|---|---|---|---|
| R2 | 12, 467, 472 | Yüksek | Kimlik bilgili URL `fetch` tarafından reddedilir, hata boş `catch` içinde kaybolur, işlev 0 döner. Rapor servisine büyük olasılıkla hiç veri gitmiyor | Denendi: `Request` TypeError verdi; gerçek servis denenmedi |
| R18 | 437-438 | Yüksek | E-posta servisi hata dönse de işlev `true` döner | Denendi: 500 yanıtında `true` |
| R19 | 439-441 | Orta | Ağ hatası sessizce yutulur, log yoktur | Okuma |
| R20 | 34-43, 445-459 | Yüksek | `raporuKaydet` hiçbir şey kaydetmez ama başarılı gibi sayı döner. `birimRaporunuSil` de silmez | Denendi: dönüş sayı, yalnızca log |
| R21 | 422 | Düşük | Boş alıcı dizisi varsayılana düşmez, alıcısız gönderim denenir | Okuma |

### Güvenlik

| No | Satır | Önem | Bulgu | Kanıt |
|---|---|---|---|---|
| G1 | 9-12 | Kritik | API anahtarı, veritabanı kullanıcısı, parola ve URL içindeki kimlik bilgisi kaynak kodda ve `d188b0c` commit'iyle git geçmişinde. Bir ön yüz dosyası bu modülü içe aktarırsa tarayıcı paketine de girer | Okuma, `git log` |
| G2 | 37 | Yüksek | `db.baglan` parolayı düz metin loglar; her `raporuKaydet` çağrısında çalışır (446) | Denendi: log satırı oluşuyor (içeriği yazdırılmadı) |
| G3 | 426 | Yüksek | API anahtarı URL sorgu parametresinde; vekil ve erişim loglarına düşer | Okuma |
| G4 | 448-456 | Yüksek | INSERT metin birleştirmeyle kurulur; `birim`, `olusturan`, özet kaçışsız. Bugün `db` yalnızca logladığı için etkisiz, gerçek sürücü bağlanırsa SQL enjeksiyonu olur | Denendi: tırnak SQL'e ham giriyor |
| G5 | 461-463 | Yüksek | DELETE aynı biçimde kurulur, yetki denetimi yoktur | Okuma |
| G6 | 350 | Orta | CSV kaçışı yok: virgül ve satır sonu sütunları kaydırır, `=` ile başlayan başlık Excel'de formül olarak çalışabilir. Çıktının muhasebeye gitmesi (satır 4) riski artırır | Denendi |
| G7 | 1-491 | Orta | Yetki denetimi yok. Sunucuda kullanılırsa R1 nedeniyle bir kullanıcı başka birimin raporunu alabilir | Okuma |
| G8 | 196-199, ihlal sayaçları (212, 220, 230, 238, 248, 256, 266, 274) | Yüksek | Prototype pollution: `birim: "constructor"` ve `"__proto__"` değerleri `birimler` nesnesi üzerinden global `Object`'e ve `Object.prototype`'a yazar | `constructor` denendi: `Object.toplam` `NaN` oldu; `__proto__` okuma, denenmedi |

### Veri koruma (KVKK)

| No | Satır | Önem | Bulgu | Kanıt |
|---|---|---|---|---|
| V1 | 201-203, 321, 469 | Yüksek | Rapor, kişi adı başına talep sayısını taşır ve tamamı rapor servisine gönderilmek istenir. SPEC Bölüm 5 raporların yalnızca toplu sayı göstermesini ister | Okuma |
| V2 | 406-417 | Orta | `enCokTalepEden` tek bir çalışanı öne çıkarır; kişi bazlı izleme olarak yorumlanabilir | Okuma |
| V3 | 187-189 | Orta | `o.debug` açıkken talebin tamamı (ad, açıklama) loga yazılır | Okuma |
| V4 | 40, 453 | Orta | Özet içeren SQL cümleleri loglanır | Okuma |
| V5 | 426, 433 | Orta | Birim ve SLA özeti şirket dışı adrese gider. SPEC Bölüm 3 verilerin şirket içinde tutulmasını ve SMTP rölesini öngörür | Okuma; `.example` adresi yer tutucu olabilir |
| V6 | 350 | Orta | CSV kişi adlarını içerir, süzme veya maskeleme yoktur | Okuma |
| V7 | Tüm dosya | Bilgi | Saklama ve silme kuralı yok; SPEC AS-9 da açık | Okuma |

## Ölü kod

- `gunFarki` (56-58), `tmp2` (487-489), `SLA_SAAT.dusuk.coz` (25)
- `sonuc_global` (31, 339), `son_birim` (32, 125)
- `*_ilk_say`, `*_coz_say` (151-152, 158-159, 165-166, 172-173)
- Yorumdaki eski hesap (280-282), `rapor_v1` (476-485; "silmeyin" notu var)

## Yinelenen yapı

Dört öncelik için aynı sayaçlar (147-173), aynı dal (205-277), aynı sonuç bloğu (292-319) ve aynı metin (361-380) elle kopyalanmış. R3 ve R13 bu kopyalamadan kaynaklanıyor gibi görünüyor.

## Bu portalla ilişkisi

- SPEC Bölüm 1 SLA takibini ilk sürüm kapsamı dışında sayar; modüldeki eşikler (19-26) SPEC'te geçmez.
- Süreler takvim zamanıyla hesaplanır (53); SPEC AS-6 bu konuda henüz açık.
- Modül bu portalın kayıtlarıyla doğrudan çalışmaz (R5, R12).
