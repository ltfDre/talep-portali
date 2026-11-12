# İç Talep Takip Portalı

BT destek talebi takip uygulaması. `docs/SPEC.md`'nin bir kısmı yazıldı: talep listesi, detay, açma, durum değiştirme, bildirim kuyruğu. **Henüz yok:** giriş/oturum, yetkiye göre arayüz, yanıtlar, birim kuyruğu, raporlar, yönetim. Sunucu tohumdaki geliştirme kullanıcısıyla çalışır ve üretimde başlamayı reddeder. Bir özelliğin var olduğunu SPEC'e bakarak varsaymayın; koda bakın.

## Yığın
Node ≥24, JavaScript (ESM). Arayüz: React 19.3, React Router 7.18, Vite 8.3. API: Express 5.3, better-sqlite3 13.0 (SQLite, WAL), zod 4.6. TypeScript, Next.js ve ORM SPEC Bölüm 2'de elendi; değiştirmeden önce sorun.

## Komutlar
- `cp .env.example .env`: yerel ayarlar. `.env` asla commit edilmez; ajan `.env`'i okumaz, yazmaz.
- `npm run dev`: arayüz + API birlikte (Vite :5173, `/api` vekili → Express 127.0.0.1:3001).
- `npm run dev:web` / `npm run dev:api`: ayrı ayrı (ör. API'yi durdurup hata denemek için).
- `npm run bildirim:sahte`: sahte bildirim servisi (127.0.0.1:4000); `.env`'de `BILDIRIM_*` açık olmalı.
- `npm run build`: `dist/` üretir.
- Test: node:test ile `npm test`; kapsam için `npm run test:kapsam`

## Klasörler
- `src/`: arayüz. **fetch ve alan adı dönüşümü yalnızca `src/api.js`'de.** Rotalar: `/`, `/talepler/:id`, `*` (`App.jsx`).
- `server/`: API. `rotalar/`, `dogrulama/` (zod), `hatalar.js`, `sema.sql`, `bildirimler.js` (kuyruğa yazma), `bildirimIsleyici.js` (gönderim).
- `egitmen/`: eğitmen araçları; uygulamanın parçası değil.
- `legacy/`: eski rapor modülü; dokunmadan önce sorun (`docs/legacy-harita.md`).
- `veri/`: SQLite dosyası, git dışı.

## Kurallar
- SQL her zaman `?` ile hazırlanmış ifade; değer metne eklenmez.
- İstek gövdesi `z.strictObject` ile doğrulanır.
- Hata biçimi `{hata:{kod, mesaj, alanlar?, istek_kimligi?}}` (`server/hatalar.js`, SPEC Bölüm 8).
- Durum geçişleri yalnızca `src/durumGecisleri.js` üzerinden. Sunucu da bu dosyayı içe aktarır; saf JS kalır (DOM, JSX, `import.meta.env` yok).
- Bildirim, talep işlemiyle **aynı transaction'da** kuyruğa (`eposta_kuyrugu`) yazılır; HTTP isteği transaction içinde yapılmaz, yalnızca işleyici gönderir.
- `localStorage` kullanılmaz; veri API'den gelir.
- Gizli değerler (anahtar, parola) günlüğe, hata mesajına veya belgeye yazılmaz.
- Öncelikler: Düşük, Orta, Yüksek, Acil. Durumlar: Açık, İşlemde, Çözüldü. Bu değerler sabittir; metni değiştirmek CSS'i ve sunucu geçiş kuralını bozar. `ONCELIKLER` (form, Acil üstte) ile `FILTRE_ONCELIKLERI` (filtre, Acil sonda) ayrı kalır.
- Stiller `data-durum` ve `data-oncelik` niteliklerine bağlıdır; değer metnini değiştirmek CSS'i etkiler.
- Durum düğmeleri herkese görünür; yetkiyi sunucu denetler (403).
- Arayüz metinleri ve kod tanımlayıcıları Türkçedir (`talepEkle`, `.kart`).
- Yeni paket eklemeden önce sorun. Onaylılar: `react`, `react-dom`, `react-router-dom`, `express`, `better-sqlite3`, `zod`; geliştirme `vite`, `@vitejs/plugin-react`, `concurrently`. SPEC'te adı geçmesi onay sayılmaz.

## Çalışma biçimi
- Büyük değişiklikten önce plan sun, onay bekle. Her adım bitince dur, "devam" denene kadar bekle.
- Commit'i kullanıcı atar; ajan commit atmaz, dal açmaz, push yapmaz. Değişiklikten sonra neyin değiştiğini ve nasıl doğrulanacağını söyle.
- Commit mesajları Türkçe ve özlü.
- `docs/PRD.md` kaynak belgedir. SPEC'teki **Varsayım**lar ve "Açık soru" tablosu (AS-1…AS-14) kesinleşmiş gereksinim değildir.
