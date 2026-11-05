# legacy/talepRaporu.js kod haritası

Modül, talep listesinden SLA raporu üretir, raporu metin ve CSV'ye çevirir, e-posta, veritabanı ve rapor servisine gönderir. Sürüm notu v1.3 (2021), son düzenleme 2023-03 (satır 2-3). Satır 4'teki nota göre çıktılar muhasebeye gidiyor ve değişiklikten önce dosya sahibine sorulması isteniyor.

Depoda bu modülü içe aktaran tek dosya testidir: `legacy/talepRaporu.test.js` (24 test, komut: `node --test legacy/talepRaporu.test.js`). Satır 6'daki "testleri yaz" notu artık güncel değil. Gerçek çağıranlar bu depodan görülemiyor.

**İşaretler:** "Denendi" sahte veriyle çalıştırılarak görüldü. "Okuma" yalnızca kod okunarak çıkarıldı. Gerçek servislere bağlanılmadı.

## Ana akış

Dosyada akışı baştan sona yöneten bir işlev yok; sırayı çağıran belirler. Giriş noktası `rapor_uret` (satır 158, varsayılan dışa aktarım satır 431).

1. Çağrı sayacı artar (159).
2. Önbellek denetimi: liste uzunluğu aynıysa eski sonuç döner (160-163).
3. Liste tarihe göre sıralanır, girdi dizisi yerinde değişir (168-174).
4. Tarih ve birime göre süzülür (176-184).
5. Her talep için süreler, durum, birim ve kişi sayaçları ile öncelik bazlı SLA ihlalleri hesaplanır (195-238).
6. Sonuç nesnesi kurulur (244-261), genel ihlal yüzdesi ve renk eklenir (263-277).
7. Sonuç global değişkene ve önbelleğe yazılır, döndürülür (279-281).
8. Çağıran sonucu çıktı işlevlerine (`ozetMetni`, `birimOzeti`, `enCokTalepEden`) veya dış işlevlere (`epostaGonder`, `raporuKaydet`, `raporuGonder`) verir.

`csv_yaz` (286) ve `birimRaporunuSil` (401) bu akışın dışındadır; rapor nesnesini kullanmazlar.

## Fonksiyonlar

| Satır | Fonksiyon | Dışa açık | Sorumluluk |
|---|---|---|---|
| 75 | `db.baglan` | Hayır | Bağlanmaz, bağlantı bilgisini loglar |
| 79 | `db.calistir` | Hayır | Çalıştırmaz, SQL'i loglar, hep `true` döner |
| 87 | `sureHesapla` | Hayır | İki tarih arası saat; geçersiz tarihte `null` |
| 96 | `gunFarki` | Hayır | İki tarih arası gün; **kullanılmıyor** |
| 100 | `haftaNo` | Hayır | Yılın başından hafta numarası |
| 107 | `ayAdi` | Hayır | 1-12 ay numarasından ad |
| 112 | `tarihAl` | Hayır | `olusturmaTarihi`, `acilis`, `tarih` alanlarından ilk dolu olan |
| 116 | `oncelikNormal` | Hayır | Öncelik yazımlarını dört değere indirir; bilinmeyen değer "Orta" |
| 124 | `aylikDagilim` | Hayır | Yıl-ay başına talep sayısı |
| 137 | `haftalikDagilim` | Hayır | Hafta numarası başına talep sayısı |
| 149 | `aylikBaslik` | Hayır | `yıl-ay` anahtarını okunur başlığa çevirir |
| 158 | `rapor_uret` | Evet | Ana hesap; yukarıdaki akış |
| 286 | `csv_yaz` | Evet | Talep listesinden CSV metni |
| 295 | `ozetMetni` | Evet | Rapordan düz metin özet |
| 331 | `birimOzeti` | Evet | Birim başına talep ve ihlal metni |
| 346 | `enCokTalepEden` | Evet | En çok talep açan kişi ve sayısı |
| 361 | `epostaGonder` | Evet | Özeti dış e-posta servisine gönderir |
| 385 | `raporuKaydet` | Evet | INSERT cümlesi kurar, `db` üzerinden loglar, cümle uzunluğunu döner |
| 401 | `birimRaporunuSil` | Evet | Birimin raporları için DELETE cümlesi kurar, loglar |
| 405 | `raporuGonder` | Evet | Raporun tamamını rapor servisine gönderir; HTTP durumu veya 0 döner |
| 427 | `tmp2` | Hayır | Sayacı döner; **kullanılmıyor** |

## Global durum

Hepsi modül düzeyindedir; aynı süreçteki tüm çağıranlar ve kullanıcılar paylaşır.

| Satır | Değişken | Yazan | Okuyan | Not |
|---|---|---|---|---|
| 69 | `_onbellek` | 280 | 160, 162 | Süresi yok, temizlenmiyor; bkz. R1 |
| 70 | `sayac` | 159 | 161, 428 | Yalnızca log için |
| 71 | `sonuc_global` | 279 | Yok | Ölü yazma |
| 72 | `son_birim` | 165 | Yok | Ölü yazma |

Ek yan etki: `rapor_uret` çağıranın dizisini yeniden sıralar (168). Aynı nesneyi döndürdüğü için bir çağıranın sonucu değiştirmesi diğerini de etkiler (162, 281).

## Dış bağımlılıklar

| Satır | Bağımlılık | Durum |
|---|---|---|
| 365-376 | E-posta servisi `api.eposta-servisi.example`, POST | Şirket dışı adres; anahtar URL'de |
| 12, 407-410 | Rapor servisi `raporlar.sirket.local`, POST | Şirket içi; hiç gönderemiyor, bkz. R2 |
| 74-83, 386, 397, 402 | Veritabanı `db.sirket.local`, tablo `sla_raporlari` | **Gerçek bağlantı yok**, `db` yalnızca log yazıyor |
| 77, 80, 161, 202, 377 | `console.log` | Kimlik bilgisi ve talep içeriği dahil |
| 365, 407 | Global `fetch` | Zaman aşımı yok |

Dosyada `import` yoktur.

## Riskli yerler

### Rapor sonucunu yanlış çıkaranlar

| No | Satır | Önem | Bulgu | Kanıt |
|---|---|---|---|---|
| R1 | 160-163, 280 | Yüksek | Önbellek anahtarı yalnızca liste uzunluğu. Tarih, birim ve veri değişse de eski sonuç döner; başka birimin raporu da dönebilir | Denendi: IK istendi, BT raporu döndü |
| R3 | 50 (25) | Yüksek | Düşük öncelik çözüm eşiği yanlışlıkla `SLA_SAAT.orta.coz` (72 saat); `SLA_SAAT.dusuk.coz` (120) hiç kullanılmıyor | Denendi: 96 saatlik çözüm ihlal sayıldı |
| R4 | 222, 230 | Yüksek | Yanıtlanmamış veya çözülmemiş talep ihlal sayılmaz, çünkü yalnızca tarihi dolu olanlar denetlenir. En çok geciken talepler rapora ihlal olarak girmez | Denendi: yanıtsız Acil talepte ihlal 0 |
| R5 | 88-93 | Yüksek | `new Date(null)` geçerli tarih (1970) sayılır. `null` tarih `null` süre yerine çok büyük negatif süre verir, ortalamayı bozar. Bu portal yeniden açmada `cozulmeTarihi: null` yazıyor (`src/durumGecisleri.js`) | Denendi: `ortCoz` = -492537 saat |
| R6 | 62-63 | Yüksek | Ortalamalar tarihi dolu talep sayısına değil tüm talep sayısına bölünür. `oncelikSayaclari.<oncelik>.ilkSay`, `.cozSay` sayılır ama hiç okunmaz (224, 232) | Denendi: tek yanıtlı 4 saat, ortalama 2 saat |
| R7 | 225-234, 64, 269 | Orta | Bir talep iki ihlal sayılabilir, yüzde talep sayısına bölünür; 100'ü aşar. Satır 338 bunu fark edip yalnızca uyarı yazar | Denendi: %200 |
| R8 | 269-277 | Orta | Boş listede yüzde `NaN` olur, renk "yesil" kalır. Veri yokken rapor sağlıklı görünür | Denendi |
| R9 | 62-64, 304-320 | Orta | Öncelikte talep yoksa 0/0 oluşur; özet metnine "NaN" yazılır | Denendi: yüzde `NaN`; metin okuma |
| R10 | 128, 152-153, 109 | Orta | `getMonth` 0 tabanlı, `ayAdi` 1 tabanlı. Ay adı bir önceki aya kayar, Ocak "undefined" olur | Denendi: Ocak "undefined 2026", Mart "Subat 2026" |
| R11 | 181 | Orta | Yalnızca tarih verilen bitiş günü gece yarısı sayılır, o günün talepleri rapordan düşer | Denendi: 31 Mart 09:00 talebi dışarıda |
| R12 | 113 | Orta | Alan adları bu portalla uyuşmuyor: portalda `olusturma` var. Tarih boş kalır, süzgeç hepsini geçirir, süre hesaplanmaz, dağılım anahtarları `NaN` olur | Denendi: `{"NaN-NaN":1}`, ihlal 0 |
| R13 | 43 | Düşük | Orta ilk yanıtta `>=`, diğer tüm eşiklerde `>`. Tam 8 saat ihlal sayılır | Denendi |
| R14 | 121 | Düşük | Bilinmeyen veya boş öncelik sessizce "Orta" olur | Okuma |
| R15 | 205-207 | Düşük | Tanınmayan durum hiçbir sayaca girmez; `acik + islemde + cozuldu` toplamı tutmayabilir | Okuma |
| R16 | 100-105, 140-144 | Düşük | Hafta anahtarında yıl yok, farklı yılların aynı haftası birleşir; ISO hafta değildir | Okuma |
| R17 | 210, 216 | Düşük | `{}` üzerinde `== undefined` denetimi: "constructor" gibi adlar sayacı bozar | Denendi: kişi sayısı `NaN`, sonuç " (0)" |

### Sessiz hatalar

| No | Satır | Önem | Bulgu | Kanıt |
|---|---|---|---|---|
| R2 | 12, 407, 412 | Yüksek | Kimlik bilgili URL `fetch` tarafından reddedilir, hata boş `catch` içinde kaybolur, işlev 0 döner. Rapor servisine büyük olasılıkla hiç veri gitmiyor | Denendi: `Request` TypeError verdi; gerçek servis denenmedi |
| R18 | 377-378 | Yüksek | E-posta servisi hata dönse de işlev `true` döner | Denendi: 500 yanıtında `true` |
| R19 | 379-381 | Orta | Ağ hatası sessizce yutulur, log yoktur | Okuma |
| R20 | 74-83, 385-399 | Yüksek | `raporuKaydet` hiçbir şey kaydetmez ama başarılı gibi sayı döner. `birimRaporunuSil` de silmez | Denendi: dönüş sayı, yalnızca log |
| R21 | 362 | Düşük | Boş alıcı dizisi varsayılana düşmez, alıcısız gönderim denenir | Okuma |

### Güvenlik

| No | Satır | Önem | Bulgu | Kanıt |
|---|---|---|---|---|
| G1 | 9-12 | Kritik | API anahtarı, veritabanı kullanıcısı, parola ve URL içindeki kimlik bilgisi kaynak kodda ve `d188b0c` commit'iyle git geçmişinde. Bir ön yüz dosyası bu modülü içe aktarırsa tarayıcı paketine de girer | Okuma, `git log` |
| G2 | 77 | Yüksek | `db.baglan` parolayı düz metin loglar; her `raporuKaydet` çağrısında çalışır (386) | Denendi: log satırı oluşuyor (içeriği yazdırılmadı) |
| G3 | 366 | Yüksek | API anahtarı URL sorgu parametresinde; vekil ve erişim loglarına düşer | Okuma |
| G4 | 388-396 | Yüksek | INSERT metin birleştirmeyle kurulur; `birim`, `olusturan`, özet kaçışsız. Bugün `db` yalnızca logladığı için etkisiz, gerçek sürücü bağlanırsa SQL enjeksiyonu olur | Denendi: tırnak SQL'e ham giriyor |
| G5 | 401-403 | Yüksek | DELETE aynı biçimde kurulur, yetki denetimi yoktur | Okuma |
| G6 | 290 | Orta | CSV kaçışı yok: virgül ve satır sonu sütunları kaydırır, `=` ile başlayan başlık Excel'de formül olarak çalışabilir. Çıktının muhasebeye gitmesi (satır 4) riski artırır | Denendi |
| G7 | 1-431 | Orta | Yetki denetimi yok. Sunucuda kullanılırsa R1 nedeniyle bir kullanıcı başka birimin raporunu alabilir | Okuma |
| G8 | 210-213, ihlal sayaçları (227, 235) | Yüksek | Prototype pollution: `birim: "constructor"` ve `"__proto__"` değerleri `birimler` nesnesi üzerinden global `Object`'e ve `Object.prototype`'a yazar | `constructor` denendi: `Object.toplam` `NaN` oldu; `__proto__` denendi: `Object.prototype.toplam` ve `.ihlal` `NaN` oluyor, birim `birimler` içinde görünmüyor. Kişi adı olarak `__proto__` kirletmiyor ama kişi sayımdan düşüyor |

### Veri koruma (KVKK)

| No | Satır | Önem | Bulgu | Kanıt |
|---|---|---|---|---|
| V1 | 215-217, 257, 409 | Yüksek | Rapor, kişi adı başına talep sayısını taşır ve tamamı rapor servisine gönderilmek istenir. SPEC Bölüm 5 raporların yalnızca toplu sayı göstermesini ister | Okuma |
| V2 | 346-357 | Orta | `enCokTalepEden` tek bir çalışanı öne çıkarır; kişi bazlı izleme olarak yorumlanabilir | Okuma |
| V3 | 201-203 | Orta | `o.debug` açıkken talebin tamamı (ad, açıklama) loga yazılır | Okuma |
| V4 | 80, 393 | Orta | Özet içeren SQL cümleleri loglanır | Okuma |
| V5 | 366, 373 | Orta | Birim ve SLA özeti şirket dışı adrese gider. SPEC Bölüm 3 verilerin şirket içinde tutulmasını ve SMTP rölesini öngörür | Okuma; `.example` adresi yer tutucu olabilir |
| V6 | 290 | Orta | CSV kişi adlarını içerir, süzme veya maskeleme yoktur | Okuma |
| V7 | Tüm dosya | Bilgi | Saklama ve silme kuralı yok; SPEC AS-9 da açık | Okuma |

## Ölü kod

- `gunFarki` (96-98), `tmp2` (427-429), `SLA_SAAT.dusuk.coz` (25)
- `sonuc_global` (71, 279), `son_birim` (72, 165)
- `oncelikSayaclari.<oncelik>.ilkSay`, `.cozSay` (224, 232)
- Yorumdaki eski hesap (240-242), `rapor_v1` (416-425; "silmeyin" notu var)

## Yinelenen yapı

Dört öncelik için sayaçlar (`yeniSayac` 54-56, `oncelikSayaclari` 187), hesap (`ONCELIK_KURALLARI` 29-52, tek akış 219-237) ve sonuç bloğu (`oncelikOzeti` 58-66, çağrılar 252-255) artık tek yapıda. `ozetMetni` içindeki metin (301-320) hâlâ dört kopya blok olarak duruyor. R3 ve R13 eski kopyalamadan kaynaklanıyor gibi görünüyor; `ONCELIK_KURALLARI` içinde "bilinen tutarsızlık" yorumuyla korunuyorlar (R13: 42-43, R3: 49-50).

## Bu portalla ilişkisi

- SPEC Bölüm 1 SLA takibini ilk sürüm kapsamı dışında sayar; modüldeki eşikler (19-26) SPEC'te geçmez.
- Süreler takvim zamanıyla hesaplanır (93); SPEC AS-6 bu konuda henüz açık.
- Modül bu portalın kayıtlarıyla doğrudan çalışmaz (R5, R12).
