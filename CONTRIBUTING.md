# Katkı Rehberi

Bu belge insan katkıcılar içindir. Kodlama ajanının kuralları `CLAUDE.md`'dedir; iki belge birbirini tamamlar.

## 1. Dal ve commit

- Dal adları ön ekle başlar: `feature/`, `fix/`, `docs/` (ör. `feature/tekrar-talep-mesaji`).
- Commit mesajları Türkçe, tek satır ve Conventional Commits biçimindedir: `tür(kapsam): açıklama` (ör. `fix(api): TEKRAR penceresi 60 sn olmalı`). Türler: `feat`, `fix`, `docs`, `test`, `chore`.
- `main`'e doğrudan push yapılmaz, PR zorunludur (GitHub ruleset ile zorunlu kılınmıştır). Ruleset ayrıca `main`'in silinmesini ve force push'u engeller.
- Hiçbir dalda force push ve `git reset --hard` kullanılmaz.

## 2. PR kuralları

- Bir PR en fazla **400 değişen satır** içerir (`package-lock.json` hariç). Büyük işler parçalara bölünür.
- PR açıklamasında şu başlıklar bulunur:
  1. **Özet**
  2. **Değişen dosyalar**
  3. **Nasıl test edildi**: yalnızca gerçekten çalıştırılanlar (`npm test`, `npm run build`, elle deneme adımları). Çalıştırılmayan şey yazılmaz.
  4. **Riskler**
  5. **Ajanın yaptığı / insanın doğruladığı**
- CI henüz yok. Testler ve taramalar PR'ı açan kişi tarafından yerelde çalıştırılır, çıktısı PR'a özetlenir.

## 3. AI kullanım anlaşması

1. **Beyan:** AI ile üretilen kod, PR açıklamasının "Ajanın yaptığı / insanın doğruladığı" bölümünde belirtilir.
2. **Okumadan commit yok:** Ajan çıktısı, bir insan `git diff`'i okumadan commit edilmez. Commit'i ve push'u insan yapar; ajan commit atmaz, dal açmaz, push yapmaz.
3. **Merge şartı:** `npm test` ve `gitleaks git` temiz geçmeden merge edilmez.
4. **Güvenlik koduna iki onay:** Kimlik/yetki, Host/Origin denetimi (`server/uygulama.js`), hata yanıtları (`server/hatalar.js`), SQL sorguları, gizli değer kullanan kod ve `.claude/settings.json` değişiklikleri iki kişinin onayıyla merge edilir. Bu bir ekip anlaşmasıdır; GitHub ruleset onay şartı koymaz, uyulması onaylayanların sorumluluğundadır.
5. **Prompt'a hassas veri yok:** Prompt'lara sır (anahtar, parola, `.env` içeriği), müşteri verisi veya gerçek kişisel veri girilmez. Örneklerde sahte veri kullanılır (ör. `gelistirici@ornek.invalid`).
6. **Beyan değil kanıt:** Ajanın "yaptım", "düzelttim", "testler geçti" beyanı, ilgili komut çalıştırılıp çıktısı görülerek doğrulanır.

## 4. Merge conflict

- Ajan çakışma için çözüm ve gerekçesini önerebilir, onayla dosyayı düzeltebilir.
- İnsan sonucu `git diff` ile okur ve `<<<<<<<`, `=======`, `>>>>>>>` işaretlerinin kalmadığını kontrol eder.
- `git add` ve commit'i insan yapar; ardından `npm test` çalıştırılır.
