// legacy/talepRaporu.js için karakterizasyon testleri.
// Amaç doğru davranışı değil, bugünkü davranışı sabitlemektir.
// "(mevcut davranış, hatalı olabilir)" etiketli testler, şüpheli davranışı bilerek korur;
// R ve G numaraları docs/legacy-harita.md'ye aittir.
//
// Çalıştırma: node --test legacy/talepRaporu.test.js

import { describe, test } from "node:test";
import assert from "node:assert/strict";

const HATALI = "(mevcut davranış, hatalı olabilir)";

// Modülün _onbellek değişkeni liste uzunluğuna göre sonuç döndürür ve dışarıdan sıfırlanamaz.
// ESM önbelleği URL'ye göre çalıştığı için her sorgu parametresi yeni bir modül örneği verir.
let yuklemeNo = 0;
const taze = () => import(`./talepRaporu.js?test=${++yuklemeNo}`);

const DAKIKA = 60000;
const BASLANGIC = "2026-03-10T09:00:00.000Z";

// Saat dilimi bağımsızlığı için tüm tarihler Z eklidir ve ay ile hafta sınırlarından uzaktır.
const sonra = (iso, dakika) => new Date(new Date(iso).getTime() + dakika * DAKIKA).toISOString();

const talep = (alanlar = {}) => ({
  oncelik: "Orta",
  talepEden: "Ayşe",
  olusturmaTarihi: BASLANGIC,
  ...alanlar,
});

// rapor_uret girdiyi yerinde sıraladığı için her çağrı yeni bir kopya üretir.
const altinVeri = () => [
  {
    id: 5,
    baslik: "Yazıcı",
    birim: "Finans",
    talepEden: "Can",
    oncelik: "Düşük",
    durum: "Çözüldü",
    olusturmaTarihi: "2026-03-18T09:00:00.000Z",
    ilkYanitTarihi: sonra("2026-03-18T09:00:00.000Z", 24 * 60),
    cozulmeTarihi: sonra("2026-03-18T09:00:00.000Z", 96 * 60),
  },
  {
    id: 1,
    baslik: "VPN",
    birim: "BT",
    talepEden: "Ayşe",
    oncelik: "Acil",
    durum: "Çözüldü",
    olusturmaTarihi: BASLANGIC,
    ilkYanitTarihi: sonra(BASLANGIC, 30),
    cozulmeTarihi: sonra(BASLANGIC, 3 * 60),
  },
  {
    id: 4,
    baslik: "Monitör",
    birim: "İK",
    talepEden: "Deniz",
    oncelik: "Orta",
    durum: "Açık",
    olusturmaTarihi: "2026-04-15T09:00:00.000Z",
  },
  {
    id: 2,
    baslik: "Sunucu",
    birim: "BT",
    talepEden: "Ayşe",
    oncelik: "Acil",
    durum: "Çözüldü",
    olusturmaTarihi: "2026-01-14T09:00:00.000Z",
    ilkYanitTarihi: sonra("2026-01-14T09:00:00.000Z", 2 * 60),
    cozulmeTarihi: sonra("2026-01-14T09:00:00.000Z", 6 * 60),
  },
  {
    id: 6,
    baslik: "E-posta",
    talepEden: "Ayşe",
    oncelik: "orta",
    durum: "Cozuldu",
    acilis: "2026-04-22T09:00:00.000Z",
    ilkYanitTarihi: sonra("2026-04-22T09:00:00.000Z", 8 * 60),
    cozulmeTarihi: sonra("2026-04-22T09:00:00.000Z", 72 * 60),
  },
  {
    id: 3,
    baslik: "Parola",
    birim: "İK",
    talepEden: "Can",
    oncelik: "Yüksek",
    durum: "İşlemde",
    tarih: "2026-03-11T09:00:00.000Z",
    ilkYanitTarihi: sonra("2026-03-11T09:00:00.000Z", 5 * 60),
  },
];

describe("altın senaryo", () => {
  test(`rapor_uret tam sonucu ${HATALI}`, async () => {
    const { rapor_uret } = await taze();

    assert.deepEqual(rapor_uret(altinVeri()), {
      birim: "Hepsi",
      bas: undefined,
      bit: undefined,
      toplam: 6,
      acik: 1,
      islemde: 1,
      cozuldu: 4,
      acil: { toplam: 2, ihlal: 2, ortIlk: 1.25, ortCoz: 4.5, yuzde: "100.0" },
      yuksek: { toplam: 1, ihlal: 1, ortIlk: 5, ortCoz: 0, yuzde: "100.0" },
      orta: { toplam: 2, ihlal: 1, ortIlk: 4, ortCoz: 36, yuzde: "50.0" },
      dusuk: { toplam: 1, ihlal: 1, ortIlk: 24, ortCoz: 96, yuzde: "100.0" },
      birimler: {
        BT: { toplam: 2, ihlal: 2 },
        İK: { toplam: 2, ihlal: 1 },
        Finans: { toplam: 1, ihlal: 1 },
        Belirsiz: { toplam: 1, ihlal: 1 },
      },
      kisiler: { Ayşe: 3, Can: 2, Deniz: 1 },
      aylik: { "2026-0": 1, "2026-2": 3, "2026-3": 2 },
      haftalik: { 2: 1, 10: 2, 11: 1, 15: 1, 16: 1 },
      olusturan: undefined,
      ihlalToplam: 5,
      ihlalYuzde: 83,
      durumRenk: "kirmizi",
    });
  });

  test(`ozetMetni tam metni, ay adları kaymış ${HATALI}`, async () => {
    const { rapor_uret, ozetMetni } = await taze();

    assert.equal(
      ozetMetni(rapor_uret(altinVeri())),
      [
        "SLA RAPORU - Hepsi",
        "Toplam talep: 6",
        "Acik: 1, Islemde: 1, Cozuldu: 4",
        "",
        "ACIL",
        "  toplam: 2",
        "  ihlal: 2 (%100.0)",
        "  ort. ilk yanit: 1.3 saat",
        "  ort. cozum: 4.5 saat",
        "YUKSEK",
        "  toplam: 1",
        "  ihlal: 1 (%100.0)",
        "  ort. ilk yanit: 5.0 saat",
        "  ort. cozum: 0.0 saat",
        "ORTA",
        "  toplam: 2",
        "  ihlal: 1 (%50.0)",
        "  ort. ilk yanit: 4.0 saat",
        "  ort. cozum: 36.0 saat",
        "DUSUK",
        "  toplam: 1",
        "  ihlal: 1 (%100.0)",
        "  ort. ilk yanit: 24.0 saat",
        "  ort. cozum: 96.0 saat",
        "",
        "Genel ihlal orani: %83 (kirmizi)",
        "undefined 2026: 1 talep",
        "Subat 2026: 3 talep",
        "Mart 2026: 2 talep",
        "",
      ].join("\n")
    );
  });

  test(`birimOzeti metni, Finans ve Belirsiz ihlalleri R3 ve R13'ten gelir ${HATALI}`, async () => {
    const { rapor_uret, birimOzeti } = await taze();

    assert.equal(
      birimOzeti(rapor_uret(altinVeri())),
      "BT: 2 talep, 2 ihlal\nİK: 2 talep, 1 ihlal\nFinans: 1 talep, 1 ihlal\nBelirsiz: 1 talep, 1 ihlal\n"
    );
  });

  test("enCokTalepEden en çok talep açan kişiyi ve sayısını döndürür", async () => {
    const { rapor_uret, enCokTalepEden } = await taze();

    assert.equal(enCokTalepEden(rapor_uret(altinVeri())), "Ayşe (3)");
  });
});

describe("önbellek ve yan etkiler", () => {
  test(`R1: aynı uzunlukta farklı birim, tarih ve veriyle ilk sonuç nesnesi döner ${HATALI}`, async (t) => {
    t.mock.method(console, "log", () => {}); // önbellekten dönüş logunu sustur
    const { rapor_uret } = await taze();

    const ilk = rapor_uret([talep({ birim: "BT", oncelik: "Acil" })], null, null, "BT");
    const baskaBirim = rapor_uret([talep({ birim: "IK" })], null, null, "IK");
    const baskaTarih = rapor_uret([talep({ birim: "BT" })], "2030-01-01", "2030-12-31", "BT");

    assert.equal(baskaBirim, ilk);
    assert.equal(baskaTarih, ilk);
    assert.equal(baskaBirim.birim, "BT");
    assert.equal(baskaTarih.bas, null);
  });

  test(`girdi dizisi yerinde sıralanır, süzgeç dışında kalanlar da sıralanır ${HATALI}`, async () => {
    const hepsi = altinVeri();
    (await taze()).rapor_uret(hepsi);
    assert.deepEqual(hepsi.map((x) => x.id), [2, 1, 3, 5, 4, 6]);

    const yalnizBt = altinVeri();
    (await taze()).rapor_uret(yalnizBt, null, null, "BT");
    assert.deepEqual(yalnizBt.map((x) => x.id), [2, 1, 3, 5, 4, 6]);
  });

  test("yeni modül örneği önceki örneğin önbelleğini paylaşmaz", async () => {
    const ilk = (await taze()).rapor_uret([talep({ birim: "BT" })], null, null, "BT");
    const ikinci = (await taze()).rapor_uret([talep({ birim: "IK" })], null, null, "IK");

    assert.notEqual(ikinci, ilk);
    assert.equal(ilk.birim, "BT");
    assert.equal(ikinci.birim, "IK");
  });
});

describe("süzme ve tarih alanı", () => {
  test(`R11: yalnızca tarih verilen bitiş gününün sonraki saatleri dışarıda kalır ${HATALI}`, async () => {
    const { rapor_uret } = await taze();

    const r = rapor_uret(
      [
        talep({ talepEden: "ay-basi", olusturmaTarihi: "2026-03-01T00:00:00.000Z" }),
        talep({ talepEden: "son-gun-gece-yarisi", olusturmaTarihi: "2026-03-31T00:00:00.000Z" }),
        talep({ talepEden: "son-gun-sabah", olusturmaTarihi: "2026-03-31T09:00:00.000Z" }),
      ],
      "2026-03-01",
      "2026-03-31"
    );

    assert.equal(r.toplam, 2);
    assert.deepEqual(r.kisiler, { "ay-basi": 1, "son-gun-gece-yarisi": 1 });
  });

  test(`R12: portalın olusturma alanı okunmaz, süre ve dağılım bozulur ${HATALI}`, async () => {
    const { rapor_uret } = await taze();

    const r = rapor_uret([
      {
        oncelik: "Acil",
        talepEden: "Ayşe",
        olusturma: BASLANGIC,
        cozulmeTarihi: sonra(BASLANGIC, 11 * 60),
      },
    ]);

    assert.equal(r.toplam, 1);
    assert.deepEqual(r.aylik, { "NaN-NaN": 1 });
    assert.deepEqual(r.haftalik, { NaN: 1 });
    assert.equal(r.acil.ihlal, 0);
    assert.equal(r.acil.ortCoz, 0);
  });
});

describe("SLA eşikleri", () => {
  // Süreler dakika cinsindendir; "ihlalYok" ve "ihlalVar" sınırın iki yanını sabitler.
  const esikler = [
    { ad: "Acil ilk yanıt: 1 s ihlal değil, 1 s 1 dk ihlal", oncelik: "Acil", grup: "acil", alan: "ilkYanitTarihi", ihlalYok: [60], ihlalVar: [61] },
    { ad: "Acil çözüm: 4 s ihlal değil, 4 s 1 dk ihlal", oncelik: "Acil", grup: "acil", alan: "cozulmeTarihi", ihlalYok: [240], ihlalVar: [241] },
    { ad: "Yüksek ilk yanıt: 4 s ihlal değil, 4 s 1 dk ihlal", oncelik: "Yüksek", grup: "yuksek", alan: "ilkYanitTarihi", ihlalYok: [240], ihlalVar: [241] },
    { ad: "Yüksek çözüm: 24 s ihlal değil, 24 s 1 dk ihlal", oncelik: "Yüksek", grup: "yuksek", alan: "cozulmeTarihi", ihlalYok: [1440], ihlalVar: [1441] },
    { ad: `R13: Orta ilk yanıt: 7 s 59 dk ihlal değil, tam 8 s ihlal ${HATALI}`, oncelik: "Orta", grup: "orta", alan: "ilkYanitTarihi", ihlalYok: [479], ihlalVar: [480] },
    { ad: "Orta çözüm: 72 s ihlal değil, 72 s 1 dk ihlal", oncelik: "Orta", grup: "orta", alan: "cozulmeTarihi", ihlalYok: [4320], ihlalVar: [4321] },
    { ad: "Düşük ilk yanıt: 24 s ihlal değil, 24 s 1 dk ihlal", oncelik: "Düşük", grup: "dusuk", alan: "ilkYanitTarihi", ihlalYok: [1440], ihlalVar: [1441] },
    { ad: `R3: Düşük çözüm eşiği 120 s değil 72 s: 72 s 1 dk, 96 s ve 120 s ihlal ${HATALI}`, oncelik: "Düşük", grup: "dusuk", alan: "cozulmeTarihi", ihlalYok: [4320], ihlalVar: [4321, 5760, 7200] },
  ];

  for (const { ad, oncelik, grup, alan, ihlalYok, ihlalVar } of esikler) {
    test(ad, async () => {
      const ihlalSayisi = async (dakika) => {
        const { rapor_uret } = await taze();
        const r = rapor_uret([talep({ oncelik, [alan]: sonra(BASLANGIC, dakika) })]);
        return r[grup].ihlal;
      };

      for (const dakika of ihlalYok) assert.equal(await ihlalSayisi(dakika), 0, `${dakika} dk`);
      for (const dakika of ihlalVar) assert.equal(await ihlalSayisi(dakika), 1, `${dakika} dk`);
    });
  }
});

describe("hesaplar", () => {
  test(`R4: yanıtlanmamış ve çözülmemiş Acil talep ihlal sayılmaz ${HATALI}`, async () => {
    const { rapor_uret } = await taze();

    const r = rapor_uret([talep({ oncelik: "Acil" })]);

    assert.equal(r.acil.ihlal, 0);
    assert.equal(r.acil.yuzde, "0.0");
    assert.equal(r.ihlalYuzde, 0);
    assert.equal(r.durumRenk, "yesil");
  });

  test(`R5: null tarih 1970 sayılır, ortalama büyük negatif olur ${HATALI}`, async () => {
    const nullTarihli = (await taze()).rapor_uret([
      talep({ oncelik: "Acil", ilkYanitTarihi: null, cozulmeTarihi: null }),
    ]);
    assert.deepEqual(nullTarihli.acil, {
      toplam: 1,
      ihlal: 0,
      ortIlk: -492537,
      ortCoz: -492537,
      yuzde: "0.0",
    });

    const alanYok = (await taze()).rapor_uret([talep({ oncelik: "Acil" })]);
    assert.equal(alanYok.acil.ortIlk, 0);
    assert.equal(alanYok.acil.ortCoz, 0);
  });

  test(`R6: ortalama yanıtlı talep sayısına değil tüm talep sayısına bölünür ${HATALI}`, async () => {
    const { rapor_uret } = await taze();

    const r = rapor_uret([
      talep({ ilkYanitTarihi: sonra(BASLANGIC, 4 * 60) }),
      talep({ olusturmaTarihi: "2026-03-11T09:00:00.000Z" }),
    ]);

    assert.equal(r.orta.toplam, 2);
    assert.equal(r.orta.ortIlk, 2);
  });

  test(`R7: bir talep iki ihlal sayılır, yüzde 100'ü aşar ${HATALI}`, async () => {
    const { rapor_uret, birimOzeti } = await taze();

    const r = rapor_uret([
      talep({
        birim: "BT",
        oncelik: "Acil",
        ilkYanitTarihi: sonra(BASLANGIC, 2 * 60),
        cozulmeTarihi: sonra(BASLANGIC, 6 * 60),
      }),
    ]);

    assert.equal(r.acil.toplam, 1);
    assert.equal(r.acil.ihlal, 2);
    assert.equal(r.acil.yuzde, "200.0");
    assert.equal(r.ihlalYuzde, 200);
    assert.equal(r.durumRenk, "kirmizi");
    assert.equal(
      birimOzeti(r),
      "BT: 1 talep, 2 ihlal (DIKKAT: ihlal sayisi talep sayisindan fazla)\n"
    );
  });

  test(`R8, R9: boş listede yüzdeler NaN olur, renk yeşil kalır ${HATALI}`, async () => {
    const { rapor_uret } = await taze();

    const r = rapor_uret([]);

    assert.equal(r.toplam, 0);
    assert.equal(r.ihlalToplam, 0);
    assert.ok(Number.isNaN(r.ihlalYuzde));
    assert.equal(r.durumRenk, "yesil");
    assert.deepEqual(r.acil, { toplam: 0, ihlal: 0, ortIlk: NaN, ortCoz: NaN, yuzde: "NaN" });
    assert.deepEqual(r.aylik, {});
    assert.deepEqual(r.haftalik, {});
  });
});

describe("csv_yaz", () => {
  const BASLIK = "id,baslik,talepEden,oncelik,durum\n";

  test(`G6: başlıktaki virgül kaçırılmaz, sütunlar kayar ${HATALI}`, async () => {
    const { csv_yaz } = await taze();

    const csv = csv_yaz([
      { id: 2, baslik: "Yazıcı, 3. kat", talepEden: "Can", oncelik: "Orta", durum: "Açık" },
    ]);

    assert.equal(csv, `${BASLIK}2,Yazıcı, 3. kat,Can,Orta,Açık\n`);
  });

  test(`G6: formül ile başlayan başlık olduğu gibi yazılır ${HATALI}`, async () => {
    const { csv_yaz } = await taze();

    const csv = csv_yaz([
      { id: 3, baslik: "=1+1", talepEden: "Can", oncelik: "Orta", durum: "Açık" },
    ]);

    assert.equal(csv, `${BASLIK}3,=1+1,Can,Orta,Açık\n`);
  });
});
