-- Kaynak: docs/SPEC.md Bölüm 4, "Veri modeli".

CREATE TABLE IF NOT EXISTS kullanicilar (
  id INTEGER PRIMARY KEY,
  entra_oid TEXT NOT NULL UNIQUE,
  eposta TEXT NOT NULL,
  ad_soyad TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'calisan' CHECK (rol IN ('calisan', 'yonetici', 'admin')),
  aktif INTEGER NOT NULL DEFAULT 1 CHECK (aktif IN (0, 1)),
  olusturma TEXT,
  son_giris TEXT
);

CREATE TABLE IF NOT EXISTS birimler (
  id INTEGER PRIMARY KEY,
  ad TEXT NOT NULL UNIQUE,
  aktif INTEGER NOT NULL DEFAULT 1 CHECK (aktif IN (0, 1))
);

CREATE TABLE IF NOT EXISTS birim_uyeleri (
  birim_id INTEGER NOT NULL REFERENCES birimler (id),
  kullanici_id INTEGER NOT NULL REFERENCES kullanicilar (id),
  PRIMARY KEY (birim_id, kullanici_id)
);

CREATE TABLE IF NOT EXISTS kategoriler (
  id INTEGER PRIMARY KEY,
  ad TEXT NOT NULL UNIQUE,
  birim_id INTEGER NOT NULL REFERENCES birimler (id),
  yardim_metni TEXT,
  aktif INTEGER NOT NULL DEFAULT 1 CHECK (aktif IN (0, 1))
);

CREATE TABLE IF NOT EXISTS talepler (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  baslik TEXT NOT NULL CHECK (length(baslik) BETWEEN 1 AND 200),
  aciklama TEXT NOT NULL CHECK (length(aciklama) BETWEEN 1 AND 5000),
  kategori_id INTEGER NOT NULL REFERENCES kategoriler (id),
  birim_id INTEGER NOT NULL REFERENCES birimler (id),
  oncelik TEXT NOT NULL CHECK (oncelik IN ('Acil', 'Düşük', 'Orta', 'Yüksek')),
  durum TEXT NOT NULL DEFAULT 'Açık' CHECK (durum IN ('Açık', 'İşlemde', 'Çözüldü')),
  acan_kullanici_id INTEGER NOT NULL REFERENCES kullanicilar (id),
  olusturma TEXT NOT NULL,
  guncelleme TEXT NOT NULL,
  ilk_yanit_tarihi TEXT,
  cozulme_tarihi TEXT,
  surum INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS ix_talepler_birim ON talepler (birim_id, durum, olusturma);
CREATE INDEX IF NOT EXISTS ix_talepler_acan ON talepler (acan_kullanici_id, olusturma);

CREATE TABLE IF NOT EXISTS talep_yanitlari (
  id INTEGER PRIMARY KEY,
  talep_id INTEGER NOT NULL REFERENCES talepler (id),
  yazar_kullanici_id INTEGER NOT NULL REFERENCES kullanicilar (id),
  metin TEXT NOT NULL CHECK (length(metin) BETWEEN 1 AND 5000),
  olusturma TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS talep_gecmisi (
  id INTEGER PRIMARY KEY,
  talep_id INTEGER NOT NULL REFERENCES talepler (id),
  kullanici_id INTEGER NOT NULL REFERENCES kullanicilar (id),
  olay TEXT NOT NULL CHECK (olay IN ('acildi', 'durum_degisti', 'yanitlandi')),
  eski_deger TEXT,
  yeni_deger TEXT,
  olusturma TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS eposta_kuyrugu (
  id INTEGER PRIMARY KEY,
  talep_id INTEGER NOT NULL REFERENCES talepler (id),
  alici TEXT NOT NULL,
  konu TEXT NOT NULL,
  govde TEXT NOT NULL,
  durum TEXT NOT NULL DEFAULT 'bekliyor' CHECK (durum IN ('bekliyor', 'gonderildi', 'basarisiz')),
  deneme_sayisi INTEGER NOT NULL DEFAULT 0,
  sonraki_deneme TEXT,
  gonderilme TEXT,
  son_hata TEXT,
  olusturma TEXT NOT NULL
);
