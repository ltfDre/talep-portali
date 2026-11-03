# İç Talep Takip Portalı

BT destek talebi takip uygulaması. Depoda yalnızca **prototip** var: sunucusuz, verisi tarayıcıda duran bir React uygulaması. `docs/SPEC.md`'deki ilk sürüm henüz yazılmadı (API, veritabanı, giriş, yetki, e-posta yok). Bir özelliğin var olduğunu SPEC'e bakarak varsaymayın; koda bakın.

## Komutlar
`npm install`, `npm run dev` (Vite geliştirme sunucusu), `npm run build` (`dist/` üretir), `npm run preview` (build çıktısını sunar).
Test altyapısı ve linter henüz yok; `npm test` çalışmaz. SPEC Bölüm 9, ilk sürüm için Vitest, Supertest ve Playwright öngörüyor.

## Kaynaklar
- `docs/PRD.md`: Kullanıcının soru-cevap biçimindeki gereksinimleri. Kaynak belgedir.
- `docs/SPEC.md`: PRD'den türetilen teknik şartname. **Varsayım** olarak işaretli kararlar ve yanıtsız noktalar, sonundaki "Açık soru" tablosundadır (AS-1…AS-14); bunları kesinleşmiş gereksinim gibi ele almayın.

## Mevcut prototip
- **Yapı:** Bileşenler `src/` altındadır, durum geçiş kuralları `src/durumGecisleri.js` içindedir, talep verisini ve rotaları `src/App.jsx` tutar.
- **Yönlendirme:** `react-router-dom` ile: `/` (liste ve yeni talep formu), `/talepler/:id` (detay), `*` (bulunamadı).
- **Veri:** Talepler `localStorage`'da `talep-portali.talepler` anahtarıyla tutulur; API yoktur.
- **Yetki:** Yoktur. Durum düğmelerini herkes görür; SPEC'te bu işlem yalnızca birim üyesine açıktır (Bölüm 4, "Durum geçişleri").
- **Filtreler:** Durum ve öncelik filtreleri URL sorgu parametreleriyle (`?durum=&oncelik=`) eşitlenir. Geçersiz değerler okunurken yok sayılır.
- **Görsel durum:** Stiller kartlardaki `data-durum` ve `data-oncelik` niteliklerine bağlıdır (örneğin Acil kartların kırmızı görünümü). Bu değerlerin metnini değiştirmek CSS seçicilerini de etkiler.
- **Öncelik sırası:** `ONCELIKLER` (form: Acil en üstte) ve `FILTRE_ONCELIKLERI` (filtre: Acil en sonda) farklı sıradadır; ikisini tek listede birleştirmeyin.

## Prototipten ilk sürüme geçiş
SPEC Bölüm 3 "Prototipten geçiş" tablosu belirler. **Korunur:** Vite + React yapısı, `styles.css`, liste kartları, durum ve öncelik değerleri. **Kaldırılır:** `localStorage` (yerine API), elle yazılan "Talep eden" alanı (oturumdaki kullanıcıdan alınır), varsayılan "Orta" önceliği (kullanıcı bilinçli seçer).

## Çalışma biçimi
- Commit mesajları Türkçe ve özlü.
- Arayüz metinleri ve kod tanımlayıcıları (değişken, işlev, CSS sınıfı) Türkçedir (`talepEkle`, `durumDegistir`, `.kart`); SPEC'teki tablo, alan ve API adları da öyle. Bu dili sürdürün.
- Git'e commit atma, dal açma, push yapma. Değişiklikten sonra dur, neyi değiştirdiğini ve nasıl doğrulayacağımı söyle; commit'i ben atarım.
- Plandaki her adım bitince dur ve ben "devam" diyene kadar bekle.

## Kurallar
- Durum geçişleri yalnızca `src/durumGecisleri.js` üzerinden yapılır, bileşenlerde doğrudan durum değiştirilmez.
- Proje JavaScript kullanır. TypeScript, Next.js ve ORM SPEC Bölüm 2'de gerekçesiyle elenmiştir; bu seçimleri değiştirmeden önce kullanıcıya danışın.
- Öncelik değerleri: Düşük, Orta, Yüksek, Acil (değiştirme).
- Talep durumları: Açık, İşlemde, Çözüldü (docs/SPEC.md'ye uygun).
- `.env` dosyasını asla okuma, yazma veya commit etme.
- Yeni kütüphane eklemeden önce sor.
- Büyük değişiklikten önce plan sun, onay bekle.
