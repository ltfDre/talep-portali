# BT Destek Talebi Takip Uygulaması: PRD Soruları

BT ekibine gelen destek taleplerini takip eden küçük bir web uygulaması için PRD hazırlığı. Sorular önem sırasına göre dizilmiştir. Cevaplar tamamlandığında bu dosya şu başlıklarla PRD'ye dönüştürülecektir: problem, kullanıcılar, kapsam dışı, kullanıcı hikayeleri, kabul kriterleri, açık sorular.

## Sorular

### 1. Mevcut durum ve temel sorun

BT ekibine gelen talepleri bugün nasıl takip ediyorsunuz (e-posta, telefon, Excel, Teams vb.) ve bu yöntemde sizi en çok zorlayan sorun ne? Mümkünse yakın zamanda yaşanmış somut bir örnek verin.

**Mail üzerinden atılan excel dosyası üzerinden takip ediorum. Bu yöntemde beni en çok zorlayan nokta mailleri kaçırdığımda gelen talepleri de kaçırma riskim var.:**

### 2. Kullanıcılar

Uygulamayı kimler kullanacak (talep açan çalışanlar, BT uzmanları, yöneticiler)? Her gruptan yaklaşık kaç kişi var?

**Uygulamayı talep açan çalışanların hepsi kullanacak. Yöneticiler açılan talepler ile ilgili içgörüye sahip olmalı. Bunun için gerekli olan raporlama verileri de takip edilmeli.:**

### 3. Başarı ölçütü

Uygulama devreye girdikten 3 ay sonra neye bakarak "işe yaradı" diyeceksiniz (örneğin gözden kaçan talep kalmaması, daha kısa çözüm süresi)?

**Açılan taleplerde gözden kaçan herhangi bir açık talep olmaması ve açılan taleplere ne kadar kısa sürede geri dönüş yapıldığı bu sürecin başarılı bir şekilde tamamlanıp tamamlanmadığını gösterecek.:**

### 4. Talep yaşam döngüsü

Bir talep açıldıktan kapanana kadar hangi adımlardan geçiyor? Talepleri kim kime atıyor ve talebi kim kapatabiliyor?

**Kullanıcı talebi açar, talep ilgili kategoriye göre kullanıcı tarafından açılarak ilgili birime atılır. Sonrasında talepde belirtilen ihtiyaç giderildikten sonra talep kapanır.**

### 5. Talep bilgileri

Bir talep açılırken hangi bilgiler zorunlu olmalı (başlık, açıklama, kategori, öncelik, ekran görüntüsü vb.)? Önceliği kim belirlemeli: talebi açan mı, BT ekibi mi?

**Bir talep açılırken talebin doğru şekilde açılması, kullanıcının talep formu üzerinde doğru şekilde yönlendirmesiyle gerçekleşir. Başlık, açıklama,kategori,öncelik zorunlu alanlardır:**

### 6. Giriş ve yetkiler

Kullanıcılar uygulamaya nasıl giriş yapmalı (şirket hesabı/Microsoft 365 ile tek oturum, ayrı kullanıcı adı veya giriş yok)? Çalışanlar yalnızca kendi taleplerini mi görmeli?

**Kullanıcılar uygulamaya şirket hesabı ile giriş yapmalılar. Microsoft365 hesabını kullanarak talep portalında talep açabilmeliler. Çalışanlar yalnızca kendi taleplerini görmelilier. İlgili birimlere açılan talepler sadece kendi birimleri tarafından görülebilir olmalı.:**

### 7. Bildirimler

Kim, hangi durumda, hangi kanaldan haberdar edilmeli (e-posta, Teams veya yalnızca uygulama içi)? Örneğin yeni talep açıldığında ya da durum değiştiğinde.

**Kullanıcının talebi ile ilgili bir gelişme olduğunda mail üzerinden kullanıcıya mail atılmalı. Ayrıca talep açıldıktan sonra talebin açılış numarası ve başlığı ile birlikte otomatik olarak talebi açan kullanıcıya bir mail gönderilmeli:**

### 8. Veri ve entegrasyonlar

Veriler nerede saklanmalı ve kurum içinde uyulması gereken bir kural var mı (KVKK, şirket içi sunucu, onaylı bulut)? Bağlanması gereken başka bir sistem var mı (Active Directory, envanter, mevcut talep sistemi)?

**Veriler şirtket içerisindeki onprem sunucularda saklanmalı.:**

### 9. Kapsam dışı

İlk sürümde özellikle olmasını istemediğiniz neler var (örneğin SLA takibi, raporlama panosu, mobil uygulama, bilgi bankası)?

**Mobil uygulama versiyonu olmasına gerek yok.:**

### 10. Zaman ve mevcut prototip

İlk sürüm ne zamana kadar hazır olmalı? Bu klasördeki mevcut talep portalı prototipi başlangıç noktası olarak kullanılmalı mı, yoksa sıfırdan mı başlanmalı?

**Buradaki talep portalı prototipi başlangıç noktası olarak kullanılmalı:**
