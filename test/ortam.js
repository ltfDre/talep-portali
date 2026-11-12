// Test ortamı. Sunucu modülleri (ayarlar.js, veritabani.js) içe aktarıldıkları anda
// ortamı okur; bu dosya onlardan önce yüklenmelidir (test/yardimci.js ilk import olarak yükler).
//
// - Veritabanı bellekte tutulur; node --test her dosyayı ayrı süreçte çalıştırdığı için
//   her test dosyasının kendi veritabanı olur, veri/talep.db'ye dokunulmaz.
// - Kabukta tanımlı olabilecek gerçek değerler silinir: bildirim adresi ve anahtarı
//   testlere sızmaz, hiçbir bildirim servisi çağrılmaz.
// - .env yüklenmez (test betikleri --env-file kullanmaz).

process.env.NODE_ENV = 'test'
process.env.VERITABANI_YOLU = ':memory:'

for (const ad of ['PORT', 'UYGULAMA_URL', 'BILDIRIM_ADRESI', 'BILDIRIM_ANAHTARI', 'BILDIRIM_ARALIGI_SN']) {
  delete process.env[ad]
}
