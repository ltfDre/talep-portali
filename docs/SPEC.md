# BT Destek Talebi Takip Uygulaması: Teknik Şartname

**Kaynak:** `PRD.md` (soru-cevap hâli). PRD'nin yanıtlamadığı noktalarda bu belge bir varsayımla ilerler; bu varsayımlar **Varsayım** olarak işaretlidir ve kararı gerekenler [Açık soru](#açık-soru) bölümünde toplanmıştır.

## 1. Özet

Çalışanlar Microsoft 365 hesabıyla giriş yapıp talep açar. Seçilen kategori talebi otomatik olarak ilgili birime yönlendirir. Birim talebi yanıtlar ve kapatır; talebi açan kişi her gelişmede e-posta alır. Yöneticiler toplu raporları görür.

Tasarımı yönlendiren iki başarı ölçütü (PRD soru 3):

1. **Gözden kaçan açık talep kalmaması:** Birim kuyruğu ve yanıtsız talep sayıları bu ölçüte hizmet eder.
2. **Taleplere hızlı geri dönüş:** İlk yanıt süresi her talep için kaydedilir ve raporlanır.

### Kapsam dışı (ilk sürüm)

- Mobil uygulama (PRD soru 9). Web arayüzü dar ekranlarda da kullanılabilir kalır.
- **Varsayım:** Dosya/ekran görüntüsü eki, SLA takibi ve bilgi bankası. PRD bunları istemiyor; ekler için bkz. AS-8.

## 2. Teknoloji seçimleri

| Alan | Seçim | Karşı seçenek | Neden seçilmedi |
|---|---|---|---|
| Arayüz | React + Vite | Next.js | Sunucu tarafı işleme gerektirmeyen, giriş arkasındaki bir iç uygulamaya gereksiz karmaşıklık ekler ve mevcut prototipin taşınmasını gerektirir. |
| Sayfa yönlendirme | React Router | Koşullu görünüm (router'sız) | Talep detayına e-postadaki bağlantıyla doğrudan gidilmesi gerektiğinden URL tabanlı yönlendirme şarttır. |
| Sunucu verisi | `fetch` + küçük özel hook'lar | TanStack Query | Birkaç basit liste ve detay ekranı için ek önbellek katmanı gerekmez. |
| Dil | JavaScript | TypeScript | Prototip JavaScript ile yazıldığı için küçük bir uygulamada derleme katmanı ve dönüşüm maliyeti eklenmez. |
| API | Express | Fastify | Fastify'ın performans avantajı bu kullanım hacminde hissedilmezken Express'in ara katman ekosistemi kimlik doğrulama ve oturum için daha yaygındır. |
| Veritabanı | SQLite (WAL modu) | PostgreSQL | Şirket içi tek sunucuda çalışan küçük bir uygulama için ayrı veritabanı sunucusu kurup işletmek gereksizdir (kullanıcı sayısına bağlı risk: AS-2). |
| SQLite sürücüsü | `better-sqlite3` | `node:sqlite` | Yerleşik modül henüz daha yeni ve daha az denenmiş olduğundan olgun, eşzamanlı işlem desteği olan sürücü tercih edilir. |
| Veri erişimi | Elle yazılmış SQL | Prisma | Az sayıda tablo için ORM'in şema ve üretim adımları, sağladığı kolaylıktan fazla yük getirir. |
| Giriş | Microsoft Entra ID, OIDC, sunucuda `@azure/msal-node` | Tarayıcıda `@azure/msal-browser` | Belirteçleri tarayıcıda tutmak, sunucu tarafı oturuma göre belirteç çalınma riskini artırır. |
| Oturum | `express-session`, SQLite deposu, `httpOnly` çerez | JWT | JWT'yi süresi dolmadan iptal etmek zordur; devre dışı bırakılan kullanıcıya hemen erişim kapatılmalıdır. |
| E-posta | Nodemailer + şirket SMTP rölesi, veritabanı kuyruğu | Microsoft Graph `sendMail` | Graph ek uygulama izni ister; SMTP şirket içi sunucuya daha uygundur (erişim doğrulanacak: AS-7). |
| Girdi doğrulama | Zod | express-validator | Zod şemaları Express'ten bağımsız olduğu için ayrıca birim testi yazmak daha kolaydır. |
| Birim/API testi | Vitest + Supertest | Jest | Jest, Vite ile aynı dönüştürme hattını paylaşmadığı için ek yapılandırma ister. |
| Uçtan uca test | Playwright | Cypress | Playwright birden çok kullanıcı oturumunu aynı testte daha kolay yönetir; bu da birim görünürlüğünü sınamak için gereklidir. |
| Dağıtım | Tek Node süreci; Express API'yi ve Vite çıktısını sunar | API ve arayüzü ayrı sunmak | Ayrı sunum, küçük bir uygulamaya CORS ve ikinci dağıtım adımı ekler. |

## 3. Mimari

```text
Tarayıcı (React) ── HTTPS ──> Ters vekil ──> Express ──> SQLite dosyası
                                               │  └──> E-posta kuyruğu işleyicisi ──> SMTP rölesi
                                               └──> Entra ID (yalnızca giriş)
```

- Veriler yalnızca şirket içi sunucudaki SQLite dosyasında tutulur (PRD soru 8). Entra ID'ye yalnızca giriş için gidilir; talep içeriği gönderilmez.
- SQLite ayarları: `journal_mode=WAL`, `foreign_keys=ON`, `busy_timeout=5000`.
- Yedekleme: SQLite yedekleme API'siyle gecelik yedek alınır. Saklama süresi için bkz. AS-9.
- Tarihler UTC olarak ISO 8601 metni şeklinde saklanır, arayüzde `tr-TR` biçiminde gösterilir.
- E-posta işleyicisi, Express ile aynı süreçte belirli aralıklarla çalışır.

### Prototipten geçiş (PRD soru 10)

| Prototipte | İlk sürümde |
|---|---|
| Vite + React yapısı, `styles.css`, liste kartları | Korunur |
| Durumlar: Açık, İşlemde, Çözüldü | Korunur; "Çözüldü" kapalı durumdur |
| Öncelikler: Acil (en üstte), Düşük, Orta, Yüksek; Acil kartlar kırmızı | Korunur |
| `localStorage` | Kaldırılır, API kullanılır. **Varsayım:** Tarayıcıdaki deneme kayıtları taşınmaz |
| Elle yazılan "Talep eden" alanı | Kaldırılır, oturumdaki kullanıcıdan alınır |
| Varsayılan öncelik "Orta" | Kaldırılır; öncelik zorunlu olduğundan kullanıcı bilinçli seçim yapar |
| Tek ekran | Bölüm 5'teki ekranlara ayrılır |

## 4. Veri modeli

Tüm tablolarda `id INTEGER PRIMARY KEY` kullanılır (aksi belirtilmedikçe). Tarih alanları `TEXT` tipindedir.

### `kullanicilar`

İlk girişte Entra bilgileriyle otomatik oluşturulur.

| Alan | Tip | Kural |
|---|---|---|
| `entra_oid` | TEXT | Zorunlu, benzersiz; kimlik eşleştirmesi e-posta ile değil bununla yapılır |
| `eposta` | TEXT | Zorunlu; her girişte güncellenir |
| `ad_soyad` | TEXT | Zorunlu; her girişte güncellenir |
| `rol` | TEXT | `calisan`, `yonetici` veya `admin`; varsayılan `calisan` |
| `aktif` | INTEGER | 0/1; varsayılan 1 |
| `olusturma`, `son_giris` | TEXT | |

İlk `admin` kullanıcıları `ADMIN_EPOSTALARI` ortam değişkeniyle belirlenir.

### `birimler`

| Alan | Tip | Kural |
|---|---|---|
| `ad` | TEXT | Zorunlu, benzersiz |
| `aktif` | INTEGER | 0/1 |

### `birim_uyeleri`

| Alan | Tip | Kural |
|---|---|---|
| `birim_id` | INTEGER | FK `birimler` |
| `kullanici_id` | INTEGER | FK `kullanicilar` |

Birincil anahtar: (`birim_id`, `kullanici_id`). Birim üyeliği `rol` alanından bağımsızdır.

### `kategoriler`

| Alan | Tip | Kural |
|---|---|---|
| `ad` | TEXT | Zorunlu, benzersiz |
| `birim_id` | INTEGER | Zorunlu, FK `birimler`; yönlendirmeyi belirler |
| `yardim_metni` | TEXT | Formda kullanıcıyı doğru seçime yönlendirir (PRD soru 5) |
| `aktif` | INTEGER | 0/1 |

### `talepler`

`id`, kullanıcıya gösterilen talep numarasıdır (`AUTOINCREMENT`; silinen numara yeniden kullanılmaz).

| Alan | Tip | Kural |
|---|---|---|
| `baslik` | TEXT | Zorunlu, 1-200 karakter, tek satır |
| `aciklama` | TEXT | Zorunlu, 1-5000 karakter |
| `kategori_id` | INTEGER | Zorunlu, FK `kategoriler` |
| `birim_id` | INTEGER | Zorunlu, FK `birimler`; açılışta kategoriden kopyalanır, kategori sonradan değişse de talep birimini korur |
| `oncelik` | TEXT | Zorunlu: `Acil`, `Düşük`, `Orta`, `Yüksek` |
| `durum` | TEXT | Zorunlu: `Açık`, `İşlemde`, `Çözüldü`; varsayılan `Açık` |
| `acan_kullanici_id` | INTEGER | Zorunlu, FK `kullanicilar` |
| `olusturma`, `guncelleme` | TEXT | Zorunlu |
| `ilk_yanit_tarihi` | TEXT | Boş olabilir; bir kez yazılır |
| `cozulme_tarihi` | TEXT | Boş olabilir; talep yeniden açılınca temizlenir |
| `surum` | INTEGER | Eşzamanlı güncelleme denetimi; varsayılan 1 |

Dizinler: (`birim_id`, `durum`, `olusturma`), (`acan_kullanici_id`, `olusturma`).

**İlk yanıt:** Talebi açan kişi dışındaki bir birim üyesinin yazdığı ilk yanıt veya yaptığı ilk durum değişikliği. **Varsayım:** Süre, mesai saatleri ayrılmadan takvim zamanıyla ölçülür (AS-6).

### `talep_yanitlari`

| Alan | Tip | Kural |
|---|---|---|
| `talep_id` | INTEGER | Zorunlu, FK `talepler` |
| `yazar_kullanici_id` | INTEGER | Zorunlu, FK `kullanicilar` |
| `metin` | TEXT | Zorunlu, 1-5000 karakter |
| `olusturma` | TEXT | Zorunlu |

**Varsayım:** PRD yanıt özelliğini açıkça istemiyor, ancak "geri dönüş" ve "gelişme" kavramlarının karşılığı olarak gereklidir.

### `talep_gecmisi`

Değiştirilmez denetim kaydı.

| Alan | Tip | Kural |
|---|---|---|
| `talep_id` | INTEGER | Zorunlu, FK `talepler` |
| `kullanici_id` | INTEGER | Zorunlu, FK `kullanicilar` |
| `olay` | TEXT | `acildi`, `durum_degisti` veya `yanitlandi` |
| `eski_deger`, `yeni_deger` | TEXT | Boş olabilir |
| `olusturma` | TEXT | Zorunlu |

### `eposta_kuyrugu`

Kayıt, talep değişikliğiyle aynı veritabanı işleminde oluşturulur; böylece SMTP kesintisinde bildirim kaybolmaz.

| Alan | Tip | Kural |
|---|---|---|
| `talep_id` | INTEGER | Zorunlu, FK `talepler` |
| `alici`, `konu`, `govde` | TEXT | Zorunlu; gövde düz metindir |
| `durum` | TEXT | `bekliyor`, `gonderildi` veya `basarisiz` |
| `deneme_sayisi` | INTEGER | Varsayılan 0 |
| `sonraki_deneme`, `gonderilme`, `son_hata` | TEXT | Boş olabilir |
| `olusturma` | TEXT | Zorunlu |

### Durum geçişleri

| Geçiş | İzin | Yan etki |
|---|---|---|
| Açık → İşlemde | Birim üyesi | `ilk_yanit_tarihi` boşsa doldurulur |
| Açık veya İşlemde → Çözüldü | Birim üyesi | `cozulme_tarihi` yazılır; `ilk_yanit_tarihi` boşsa doldurulur |
| Çözüldü → İşlemde (yeniden açma) | Birim üyesi | `cozulme_tarihi` temizlenir |

Aynı duruma geçiş ve burada listelenmeyen geçişler reddedilir. Her geçiş `surum` değerini artırır, geçmişe yazılır ve talebi açan kişiye e-posta kuyruğa alınır. Yeniden açma bir **Varsayım**dır (AS-5).

## 5. Ekranlar

| Yol | Ekran | Erişim | İçerik |
|---|---|---|---|
| `/giris` | Giriş | Herkes | "Microsoft ile giriş yap" düğmesi, hata mesajı |
| `/` | Taleplerim | Giriş yapan herkes | Kullanıcının kendi talepleri, durum süzgeci; yoksa boş durum mesajı |
| `/talepler/yeni` | Yeni talep | Giriş yapan herkes | Başlık, açıklama, kategori, öncelik; kategori yardım metni ve öncelik açıklamaları |
| `/talepler/:id` | Talep detayı | Talebi açan veya birim üyesi | Bilgiler, yanıtlar, geçmiş, yanıt formu; birim üyesine durum değiştirme |
| `/birim` | Birim kuyruğu | Birim üyesi | Birimin talepleri; varsayılan olarak çözülmemişler, önce Acil, sonra en eski; yanıtsız talepler işaretli |
| `/raporlar` | Raporlar | `yonetici`, `admin` | Tarih ve birim süzgeciyle toplu göstergeler |
| `/yonetim` | Yönetim | `admin` | Birim, kategori, üye ve rol yönetimi; başarısız e-postalar |
| `*` | Bulunamadı | Herkes | Talebe erişim yetkisi olmadığında da bu ekran gösterilir |

Rapor göstergeleri:

- Açılan, açık kalan ve çözülen talep sayısı
- İlk yanıt süresinin ortancası ve ortalaması
- Çözüm süresinin ortancası
- Yukarıdakilerin birim, kategori ve önceliğe göre kırılımları
- Yanıtsız talep sayısı: `ilk_yanit_tarihi` boş, durumu Çözüldü olmayan ve `YANITSIZ_ESIK_SAAT` süresini aşan talepler (**Varsayım:** 24 saat, AS-6)

Raporlar yalnızca toplu sayı gösterir; talep başlığı veya içeriği göstermez.

## 6. API uç noktaları

İstek ve yanıtlar JSON'dur. `/auth/*` ve `/api/saglik` dışındaki uç noktalar oturum gerektirir. Liste uç noktaları sayfalıdır (`sayfa`, en fazla 50 kayıt).

### Oturum

| Yöntem ve yol | İşlev | Erişim |
|---|---|---|
| `GET /auth/giris` | Entra ID'ye yönlendirir (`state`, `nonce`, PKCE) | Herkes |
| `GET /auth/geri-donus` | Girişi doğrular, kullanıcıyı oluşturur veya günceller, oturum açar | Herkes |
| `POST /auth/cikis` | Yerel oturumu kapatır | Giriş yapan |
| `GET /api/ben` | Kullanıcı, rol ve birim üyelikleri | Giriş yapan |
| `GET /api/saglik` | Veritabanı erişim durumu; içerik sızdırmaz | Herkes |

### Talepler

| Yöntem ve yol | İşlev | Erişim |
|---|---|---|
| `GET /api/kategoriler` | Aktif kategoriler ve yardım metinleri | Giriş yapan |
| `GET /api/talepler?kapsam=benim` | Kendi talepleri; `durum`, `oncelik` süzgeçleri | Giriş yapan |
| `GET /api/talepler?kapsam=birim` | Üye olunan birimlerin talepleri; ek olarak `birim_id`, `yanitsiz` süzgeçleri | Birim üyesi |
| `POST /api/talepler` | `{baslik, aciklama, kategori_id, oncelik}`; `201` döner, e-posta kuyruğa alınır | Giriş yapan |
| `GET /api/talepler/:id` | Detay, yanıtlar, geçmiş | Talebi açan veya birim üyesi |
| `PATCH /api/talepler/:id/durum` | `{durum, surum}` | Talebin birim üyesi |
| `POST /api/talepler/:id/yanitlar` | `{metin}` | Talebi açan veya birim üyesi |

### Raporlar ve yönetim

| Yöntem ve yol | İşlev | Erişim |
|---|---|---|
| `GET /api/raporlar/ozet?baslangic&bitis&birim_id` | Bölüm 5'teki göstergeler | `yonetici`, `admin` |
| `GET`, `POST /api/yonetim/birimler`; `PATCH /api/yonetim/birimler/:id` | Birim yönetimi | `admin` |
| `PUT /api/yonetim/birimler/:id/uyeler` | Üye listesini günceller | `admin` |
| `GET`, `POST /api/yonetim/kategoriler`; `PATCH /api/yonetim/kategoriler/:id` | Kategori yönetimi | `admin` |
| `GET /api/yonetim/kullanicilar`; `PATCH /api/yonetim/kullanicilar/:id` | Rol atama, devre dışı bırakma | `admin` |
| `GET /api/yonetim/eposta-hatalari` | Başarısız e-postalar (talep no, alıcı, hata) | `admin` |
| `POST /api/yonetim/eposta-hatalari/:id/yeniden-dene` | Yeniden kuyruğa alır | `admin` |

### E-posta olayları (PRD soru 7)

| Olay | Alıcı | İçerik |
|---|---|---|
| Talep açıldı | Talebi açan | Talep numarası, başlık, bağlantı |
| Durum değişti | Talebi açan | Yeni durum, bağlantı |
| Yanıt eklendi | Talebi açan (yazan kendisi değilse) | Yanıt özeti, bağlantı |

Birime bildirim gönderilmesi PRD'de istenmemiştir; bkz. AS-3.

## 7. Yetki kuralları

Kurallar yalnızca arayüzde değil, her zaman sunucuda uygulanır.

| İşlem | Çalışan (talebi açan) | Birim üyesi | `yonetici` | `admin` |
|---|---|---|---|---|
| Talep açma | Evet | Evet | Evet | Evet |
| Kendi talebini görme ve yanıtlama | Evet | Evet | Evet | Evet |
| Birim talebini görme ve yanıtlama | Hayır | Yalnızca kendi birimi | Yalnızca üyeyse | Yalnızca üyeyse |
| Durum değiştirme | Hayır | Yalnızca kendi birimi | Yalnızca üyeyse | Yalnızca üyeyse |
| Toplu raporlar | Hayır | Hayır | Evet | Evet |
| Birim, kategori ve kullanıcı yönetimi | Hayır | Hayır | Hayır | Evet |

Ek kurallar:

- Roller toplanır: Birim üyesi olan bir yönetici her iki yetkiye de sahiptir.
- Talep içeriği yetkisi yalnızca talebi açan olmaya veya birim üyeliğine bağlıdır (PRD soru 6). **Varsayım:** `yonetici` ve `admin` rolleri tek başına talep içeriği göstermez (AS-1).
- Yetkisiz talep erişimi `403` değil `404` döner; böylece sıralı talep numaraları üzerinden başka talebin varlığı anlaşılamaz.
- `aktif=0` kullanıcının oturumu sonraki istekte sonlandırılır.
- Yalnızca beklenen Entra kiracısından gelen girişler kabul edilir.
- Çerez ayarları: `httpOnly`, `secure`, `SameSite=Lax`; oturum girişte yenilenir, en fazla 8 saat geçerlidir. Değişiklik yapan isteklerde `Origin` denetlenir.

## 8. Hata durumları

Hata biçimi: `{ "hata": { "kod": "DOGRULAMA", "mesaj": "...", "alanlar": { "baslik": "..." } } }`. Mesajlar Türkçedir; yığın izi veya SQL hatası istemciye gönderilmez.

| Durum | HTTP / kod | Davranış |
|---|---|---|
| Eksik veya geçersiz alan; başlıkta satır sonu | `400 DOGRULAMA` | Hata ilgili alanın altında gösterilir, girilen veriler korunur |
| Oturum yok veya süresi dolmuş | `401 OTURUM_YOK` | Girişe yönlendirilir, ardından istenen sayfaya dönülür |
| Rol yetkisi yok | `403 YETKI_YOK` | "Bu sayfaya erişim yetkiniz yok" gösterilir |
| `Host` veya `Origin` başlığının alan adı izin listesinde değil (DNS rebinding koruması) | `403 YASAK_ISTEK` | Tüm `/api` isteklerinde, rotalardan önce denetlenir; mesaj "Bu istek kabul edilmedi." `Host` her istekte, `Origin` yalnızca gönderilmişse denetlenir. Port karşılaştırılmaz. İzinli adlar: `localhost`, `127.0.0.1`, `[::1]` ve `UYGULAMA_URL`'deki alan adı |
| Talep yok veya görme yetkisi yok | `404 BULUNAMADI` | Bulunamadı ekranı gösterilir |
| `surum` eski (iki kişi aynı anda güncelledi) | `409 CAKISMA` | Güncel talep yeniden yüklenir, kullanıcıya bildirilir |
| Aynı kullanıcı birebir aynı başlıkla son 60 sn içinde yeniden talep açar (çift gönderim) | `409 TEKRAR` | Hiçbir şey yazılmaz; mesaj "Bu başlıkla az önce bir talep açtınız. Talep listenizi kontrol edin." Denetim kategori denetiminden sonra, talep açma işlemiyle aynı transaction'da yapılır |
| İzinsiz durum geçişi | `409 GECERSIZ_GECIS` | Durum değişmez, mesaj gösterilir |
| Pasif veya bulunmayan kategoriyle talep açma | `400 DOGRULAMA` | Kategori listesi yenilenir |
| Son üyeyi çıkarma veya üyesiz birime aktif kategori bağlama | `409 BIRIM_UYESIZ` | Reddedilir; bir talebin kimsenin görmediği birime düşmesi engellenir |
| Entra girişi başarısız veya yanlış kiracı | `/giris?hata=...` | Anlaşılır mesaj ve yeniden deneme seçeneği |
| Devre dışı kullanıcı girişi | `403 HESAP_PASIF` | "Yöneticinize başvurun" mesajı |
| Veritabanı meşgul (zaman aşımı) | `503 GECICI_HATA` | Girilen veriler korunur, yeniden deneme önerilir |
| Beklenmeyen sunucu hatası | `500 SUNUCU_HATASI` | İstek kimliğiyle günlüğe yazılır, kullanıcıya kimlik gösterilir |
| SMTP gönderimi başarısız | API'ye yansımaz | Talep işlemi başarılı kalır. 5 denemeye kadar artan aralıkla yeniden denenir; sonra `basarisiz` olur ve Yönetim ekranında görünür |
| Sunucu yeniden başladı | API'ye yansımaz | `bekliyor` durumundaki e-postalar kaldığı yerden gönderilir |

## 9. Test stratejisi

| Katman | Araç | Kapsam |
|---|---|---|
| Birim | `node:test` + `node:assert` | Durum geçişleri, ilk yanıt ve çözüm süresi hesapları, doğrulama şemaları, e-posta metinleri ve yeniden deneme aralığı |
| API entegrasyon (ana katman) | `node:test`; sunucu `uygulama.listen(0, '127.0.0.1')` ile rastgele portta açılır, istekler yerleşik `fetch` ile atılır; veritabanı `VERITABANI_YOLU=:memory:` | Tüm uç noktalar, hata kodları, işlem bütünlüğü ve e-posta kuyruğu |
| Arayüz bileşeni (henüz yok) | Vitest + React Testing Library | Yalnızca form doğrulaması, kategori yardım metni, Acil kart görünümü, yetkiye göre gösterilen düğmeler |
| Uçtan uca (henüz yok) | Playwright | Az sayıda kritik akış (aşağıda) |
| Elle (pilot) | Gerçek ortam | Gerçek Entra girişi, gerçek SMTP rölesi, yedekten geri dönüş |

### Öncelikli senaryolar

1. **Yetki matrisi:** Bölüm 7'deki her satır, her rol için tablo tabanlı testle sınanır. Özellikle başka çalışanın talebi ve başka birimin talebi için `404` doğrulanır.
2. **Yönlendirme:** Kategoriye göre doğru birim atanır; kategori sonradan taşınsa da eski talebin birimi değişmez.
3. **İlk yanıt ölçümü:** İlk yanıt veya durum değişikliği süreyi bir kez başlatır, sonrakiler değiştirmez; talebi açanın kendi yanıtı süreyi doldurmaz.
4. **Bildirim güvencesi:** Sahte SMTP hata verdiğinde talep kaydedilir, e-posta `bekliyor` kalır ve yeniden denenir. Veritabanı işlemi geri alınırsa e-posta da oluşmaz.
5. **Eşzamanlılık:** Eski `surum` ile yapılan güncelleme `409` döner.

### Uçtan uca akışlar

1. Çalışan talep açar; birim üyesi talebi kuyruğunda görür, yanıtlar ve çözer; çalışan güncel durumu görür; üç e-posta da kuyruktadır.
2. Başka birimin üyesi ve başka çalışan aynı talebi açamaz.
3. Yönetici raporda talep sayısını ve ilk yanıt süresini görür, talep içeriğini açamaz.

### Test ortamı

- **Giriş (hedef, henüz yok):** Testlerde Entra yerine yalnızca `NODE_ENV=test` iken yüklenen sahte giriş ara katmanı kullanılır; üretimde bu kodun yüklenmediği de ayrı bir testle doğrulanır.
- **E-posta (hedef, henüz yok):** Nodemailer yerine belleğe yazan bir taşıyıcı kullanılır.
- **Veri:** `node --test` her test dosyasını ayrı süreçte çalıştırır; `test/ortam.js` `VERITABANI_YOLU=:memory:` ayarladığı için her dosyanın kendi bellek içi veritabanı olur, `veri/talep.db`'ye dokunulmaz.
- **Ortam:** `test/ortam.js` sunucu modüllerinden önce yüklenir, `NODE_ENV=test` ayarlar ve `PORT`, `UYGULAMA_URL`, `BILDIRIM_*` değişkenlerini siler; `.env` yüklenmez. Bildirim işleyicisi başlatılmaz (yalnızca `server/index.js` başlatır).
- **Hedef:** Yüzde hedefi yerine, yetki matrisi ve durum geçişlerindeki her satırın test edilmesi şart koşulur.
- **Komut:** `npm test`, `test/**/*.test.js` ve `legacy/**/*.test.js` dosyalarını çalıştırır. `npm run test:kapsam`, `test/**/*.test.js` için `--experimental-test-coverage` ile kapsam raporu üretir (dahil: `server/**`, `src/durumGecisleri.js`; hariç: `server/index.js`).

## Açık soru

PRD'de karşılığı olmayan veya çelişen noktalar. Önem sırasına göredir; yanıt gelene kadar "Şimdilik" sütunundaki varsayım geçerlidir.

| No | Soru | Neden önemli | Şimdilik |
|---|---|---|---|
| AS-1 | Yöneticiler talep içeriğini görebilmeli mi? Tüm birimleri mi, yalnızca kendi birimini mi görmeli? | Soru 2 içgörü isterken soru 6 talepleri birimle sınırlıyor | Yönetici tüm birimlerin toplu sayılarını görür, içerik göremez |
| AS-2 | Kaç çalışan ve eşzamanlı kullanıcı, günde kaç talep bekleniyor? Sunucu tek mi? | Soru 2'de sayı yok; birden çok sunucu gerekirse SQLite uygun olmaz | Tek sunucu ve düşük yazma hacmi |
| AS-3 | Yeni talep açıldığında birim e-posta almalı mı? | Temel sorun talebin kaçırılması; soru 7 yalnızca talebi açana e-posta istiyor | Birim e-posta almaz, kuyruğu takip eder. **Öneri:** Birime de e-posta gönderilsin |
| AS-4 | Yanlış kategori seçilirse talep başka birime aktarılabilmeli mi? | Kategori kullanıcı seçimine bağlı; yanlış birime düşen talep gözden kaçabilir | Aktarma yok. **Öneri:** Birim üyesine aktarma yetkisi verilsin |
| AS-5 | Talebi kim kapatır? Çalışan kapatabilir veya itiraz edebilir mi? Çözülen talep yeniden açılabilir mi? | Soru 4 kapatan kişiyi belirtmiyor | Yalnızca birim üyesi kapatır ve yeniden açar |
| AS-6 | "Kısa sürede geri dönüş" hedefi kaç saat? Mesai saatleri dikkate alınmalı mı? Yanıtsız eşiği nedir? | Soru 3 ölçüt veriyor ama sayısal hedef vermiyor | Takvim zamanı, eşik 24 saat |
| AS-7 | Sunucu Entra ID'ye ve SMTP rölesine erişebiliyor mu? Uygulama kaydını kim yapacak? Ters vekil (IIS/nginx) ne olacak? | Giriş ve e-posta bunlara bağlı; soru 8 entegrasyonları yanıtlamıyor | HTTPS ters vekil, SMTP rölesi ve kurumsal Entra kiracısı mevcut |
| AS-8 | Ekran görüntüsü veya dosya eki gerekli mi? | Soru 5'in zorunlu alanlarında yok, ama BT taleplerinde sık kullanılır; depolama ve güvenlik gerektirir | İlk sürümde yok |
| AS-9 | KVKK ve saklama kuralları neler? Talep ve yedekler ne kadar saklanacak? | Soru 8 yalnızca şirket içi saklamayı belirtiyor; talepler kişisel veri içerebilir | Silme yok; yedek saklama süresi belirlenmedi |
| AS-10 | Önceliği birim sonradan değiştirebilmeli mi? "Acil" nasıl tanımlanacak? | Soru 5 talebi açanın önceliği seçtiğini ima ediyor; herkes Acil seçerse kuyruk sırası anlamını yitirir | Yalnızca talebi açan, yalnızca açılışta seçer; açıklama metni formda gösterilir |
| AS-11 | Birimler ve kategoriler neler? BT dışında birim var mı? | Başlangıç verisi ve kapsam için gerekli; başlangıç isteği BT ekibinden söz ederken soru 6 birden çok birim diyor | Birden çok birim desteklenir, liste `admin` tarafından girilir |
| AS-12 | Talep birim içinde tek bir kişiye atanmalı mı? | Birim ortak kuyruğunda herkes başkasının baktığını varsayabilir | Atama birim düzeyinde; kişi ataması yok |
| AS-13 | İlk sürüm ne zaman hazır olmalı? | Soru 10'da tarih yok | Tarih varsayılmadı |
| AS-14 | Mevcut Excel'deki açık talepler taşınacak mı? | Geçiş sırasında açık talepler kaybolabilir | Taşınmaz; açık talepler geçişte elle yeniden açılır |
