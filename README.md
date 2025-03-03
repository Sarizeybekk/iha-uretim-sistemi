# Hava Aracı Üretim Uygulaması

Proje Doküman Linki : https://docs.google.com/document/d/1f2oMgkGYjWt2jSHy-O-IErJ9Bj2C5aspMrAncjgW5Os/edit?usp=sharing

Bu proje, İHA (İnsansız Hava Aracı) üretimi yapan bir şirket için geliştirilen kapsamlı bir üretim ve envanter yönetim sistemidir. Sistem; takımların parça üretimi, montaj işlemleri, envanter takibi ve kullanıcı/personel yönetimini içermektedir.

## 🚀 Proje Özellikleri

### Kullanıcı Yönetimi
- 👤 Personel giriş/çıkış sistemi
- 🔑 Takıma özel yetkilendirme sistemi

### Takım Yönetimi
- 🛠️ Kanat, Gövde, Kuyruk, Aviyonik ve Montaj takımları
- 👥 Takıma personel ekleme/çıkarma

### Parça Yönetimi
- 🔒 Takıma özel parça üretimi kısıtlaması
- 📋 Parça listeleme, ekleme, düzenleme, silme (geri dönüşüm)
- 🏷️ Parça tipi (Kanat, Gövde, Kuyruk, Aviyonik) ve uçak tipi bazlı gruplandırma

### Uçak Montajı
- ✈️ Montaj takımı tarafından uçak üretimi
- ✅ Parça uyumluluk kontrolü (TB2 kanadı sadece TB2'de kullanılabilir)
- ⚠️ Eksik parça uyarı sistemi
- 🔍 Montajlanan uçakların takibi

### Envanter Takibi
- 📦 Stok durumu görüntüleme
- 📉 Düşük stok uyarıları
- 📈 Envanter raporları

## 🛠️ Kullanılan Teknolojiler

### Backend
- 🐍 Python ve Django: Temel uygulama çatısı
- 🔄 Django Rest Framework: API oluşturma
- 🐘 PostgreSQL: Veritabanı
- 🐳 Docker

### Frontend
- ⚛️ React: Kullanıcı arayüzü kütüphanesi
- 🎨 React Bootstrap: UI bileşenleri
- 🌐 Axios: HTTP istekleri
- 🧭 React Router: Sayfa yönlendirme
- 📊 DataTables: Veri listeleme ve filtreleme
- 📝 Formik & Yup: Form yönetimi ve validasyon
- 🔔 SweetAlert2: Kullanıcı bildirim ve onay diyalogları
- 🍞 React Toastify: Bildirimler
- 🔣 Bootstrap Icons: İkonlar

## 📋 Gereksinimler

- Python 3.8+
- Node.js 14+
- PostgreSQL
- Docker 

## ⚙️ Kurulum

### Docker ile Kurulum

```bash
# Repoyu klonlayın
git clone https://github.com/Sarizeybekk/iha-uretim-sistemi

# Proje dizinine girin
cd iha-uretim-sistemi

# Docker container'larını başlatın
docker-compose up -d

# Migrationları uygulayın
docker-compose exec web python manage.py migrate
```

### Manuel Kurulum

```bash
# Repoyu klonlayın
git clone https://github.com/Sarizeybekk/iha-uretim-sistemi

# Proje dizinine girin
cd iha-uretim-sistemi

# Virtual environment oluşturun
python -m venv venv

# Virtual environment'ı aktif edin (Linux/Mac)
source venv/bin/activate
# VEYA (Windows)
venv\Scripts\activate

# Bağımlılıkları yükleyin
pip install -r requirements.txt

# .env dosyasını düzenleyin
cp .env.example .env
# .env dosyasında veritabanı bağlantı bilgilerini güncelleyin

# Migrationları uygulayın
python manage.py migrate

# Sunucuyu başlatın
python manage.py runserver
```

## 📚 Proje Yapısı

Projede modülerlik sağlanmıştır. Her bir sorumluluk için ayrı app yapısı oluşturulmuştur:

- **accounts**: Kullanıcı ve yetkilendirme işlemleri
- **teams**: Takım yönetimi
- **parts**: Parça üretimi ve yönetimi 
- **aircraft**: Uçak montaj ve takibi
- **inventory**: Envanter yönetimi

## 🔄 API Endpointleri

API rotaları Swagger aracılığıyla dokümante edilmiştir ve `/api/swagger/` adresinden erişilebilir.

- **/api/auth/**: Kimlik doğrulama endpointleri
- **/api/users/**: Kullanıcı yönetimi
- **/api/teams/**: Takım işlemleri
- **/api/parts/**: Parça yönetimi
- **/api/aircraft/**: Uçak montaj ve yönetimi
- **/api/inventory/**: Envanter takibi

## 🧪 Birim Testleri

Projenin  bazı model API katmanları ve signals için kapsamlı birim testleri bulunmaktadır.

```bash
# Tüm testleri çalıştır
python manage.py test

# Belirli bir uygulama testlerini çalıştır
python manage.py test aircrafts
```

## 📸 Ekran Görüntüleri
### Swagger UI : 

![image](https://github.com/user-attachments/assets/3ea1663c-8c39-419c-95cd-24715e48b14e)



### Giriş Ekranı :
Personeller, kendilerine verilen kullanıcı adı ve şifre ile sisteme giriş yapabileceklerdir. Başarılı giriş sonrası, kullanıcının bağlı olduğu takıma göre özelleştirilmiş bir dashboard görüntülenecektir.

![image](https://github.com/user-attachments/assets/b46b8dd4-4e74-4e84-87be-d5d52edeb67c)

Oturum yönetimi : Giriş yapan kullanıcı bilgisi tutulmalıdır.


### Ana Sayfa (Dashboard): 
Bu ekran,İHA üretimini takip etmek ve yönetmek için kullanılan ana kontrol merkezidir. Ekrandaki bilgiler sürekli güncellenir ve gerçek üretim durumunu gösterir.


![image](https://github.com/user-attachments/assets/d60a186f-a20d-49b3-a737-ceed378932f0)




### Parça Yönetimi : 
Parça Yönetim Sayfası, İHA üretiminde kullanılan tüm parçaların oluşturulması, düzenlenmesi ve takip edilmesi için tasarlanmış kapsamlı bir arayüzdür. Bu sayfa, her takımın kendi sorumluluğundaki parçalar üzerinde çalışmasını sağlayan yetkilendirme sistemi ile entegre çalışır.

![image](https://github.com/user-attachments/assets/cc33a8dc-db78-45cc-a4dd-ab4b0e8c2c38)
                                            Parçalar Sayfası (Kanat takımı sadece kanat parçalarıyla işlem yapabilemektedir.)
                                            
Takımlar kendi sorumluluğundan başka parça üretemez. (Örn: Aviyonik takımı kuyruk üretemez.).Burda da bu senaryoda  kullanıcı kanat takımında oldugu için gövde ,kuyruk aviyonik parçası listeleyemez,üretemez,silemez.Sadece ilgili takım yapabilir.

![image](https://github.com/user-attachments/assets/334ba9dd-f8f4-48f2-98af-a45c4e80c156)


Kullanılan parça durumu degiştirilmeden silinemez.

![image](https://github.com/user-attachments/assets/c62ec022-84e3-46cd-8c08-e90c601eb885)



### Uçak Montaj Sayfası :
Bu sayfa, Montaj Takımı üyelerinin uçak montajı gerçekleştirmesini sağlayan özel bir arayüz sunar. Montaj Takımı, farklı takımlar tarafından üretilen parçaları bir araya getirerek tam bir uçak oluşturma sorumluluğuna sahiptir .

Montaj Takımında olmayan kullanıcının montaj sayfasına girişinin kontrolü
![image](https://github.com/user-attachments/assets/f1d188d0-5fd3-4cdd-bad4-e1fe1cadcd56)

Montaj Takımı Kontrol Paneli: Bu panelde, uçaklar için eksik olan parçaların listesi sunulmaktadır. Eksik parçalar tamamlandığında, montaja hazır olan kartların rengi yeşile dönecektir. Bu görsel geri bildirim sayesinde kullanım kolaylığı ve operasyonel verimlilik artırılmıştır.

![image](https://github.com/user-attachments/assets/a3ac5aac-dbd6-4837-9c55-174313cfe4c2)

![image](https://github.com/user-attachments/assets/264a1398-708b-4193-86a9-be2133d8f06c)

Bu sayfada montaj yapıldıktan sonra kullanılan parçalardan stok düşme gerçekleştirilmiştir.Testi de yazılmıştır.
![image](https://github.com/user-attachments/assets/7a98a806-3c52-4dd8-a302-ffc64fed570f)


Montaj başarıyla gerçekleştiginde başarılı mesajı vermektedir.

![image](https://github.com/user-attachments/assets/fc477b63-2738-4a1a-ab93-9a4e537926f7)


 
Montajı Tamamlanan Uçaklar Sayfası:  Bu sayfada, montaj süreci tamamlanmış uçaklara ait detaylı bilgiler yer almaktadır. Bu bilgiler, operasyonel takibi kolaylaştırarak süreç yönetiminde verimlilik sağlamaktadır.

![image](https://github.com/user-attachments/assets/5a17f784-8493-4a81-8667-27a349437ce0)

Montajı tamamlanan uçakların detay sayfası bu sayfada montaj bilgileri ve kullanılan parça bilgisine yer verilmiştir.

![image](https://github.com/user-attachments/assets/e01fee7d-4ee5-446a-b7ca-a9bc322ff517)


### Envanter Takibi :
 Bu sayfa, üretim sistemindeki tüm parçaların stok durumlarını takip etmek ve yönetmek için kullanılır. Envanter sayfası, parçaların üretim miktarları, kullanım durumları ve stok seviyeleri hakkında kapsamlı bir görünüm sağlar.
 
![image](https://github.com/user-attachments/assets/376ea3c0-1184-451b-b4af-2182d2eaea29)

![image](https://github.com/user-attachments/assets/fe53c151-c962-4216-b990-3a1e69940030)


Projede birim testleri yazılmış olup,test case ve çıktılar doküman sayfasında detaylıca verilmiştir.

![image](https://github.com/user-attachments/assets/7b6ad9c7-8e66-4dc5-a6cc-2c1850d054f7)


Proje detayı ve test sonuçları hepsi dokumana eklenmiştir.

Proje Dokuman Linki : https://docs.google.com/document/d/1f2oMgkGYjWt2jSHy-O-IErJ9Bj2C5aspMrAncjgW5Os/edit?usp=sharing
