# İHA (Hava Aracı) Üretim Uygulaması

Bu proje, İHA (İnsansız Hava Aracı) üretimi yapan bir şirket için geliştirilen kapsamlı bir üretim ve envanter yönetim sistemidir. Sistem; takımların parça üretimi, montaj işlemleri, envanter takibi ve kullanıcı/personel yönetimini içermektedir.

## 🚀 Proje Özellikleri

### Kullanıcı Yönetimi
- 👤 Personel giriş/çıkış sistemi
- 🔑 Takıma özel yetkilendirme sistemi

### Takım Yönetimi
- 🛠️ Kanat, Gövde, Kuyruk, Aviyonik ve Montaj takımları
- 👥 Takıma personel ekleme/çıkarma
- 📊 Takım bazlı istatistikler

### Parça Yönetimi
- 🔒 Takıma özel parça üretimi kısıtlaması
- 📋 Parça listeleme, ekleme, düzenleme, silme (geri dönüşüm)
- 🏷️ Parça tipi (Kanat, Gövde, Kuyruk, Aviyonik) ve uçak tipi bazlı gruplandırma

### Uçak Montajı
- ✈️ Montaj takımı tarafından uçak üretimi
- ✅ Parça uyumluluk kontrolü (TB2 kanadı sadece TB2'de kullanılabilir)
- ⚠️ Eksik parça uyarı sistemi
- 🔍 Montajlanan uçak takip sistemi

### Envanter Takibi
- 📦 Stok durumu görüntüleme
- 📉 Düşük stok uyarıları
- 📈 Envanter raporları

## 🛠️ Kullanılan Teknolojiler

### Backend
- 🐍 Python ve Django: Temel uygulama çatısı
- 🔄 Django Rest Framework: API oluşturma
- 🐘 PostgreSQL: Veritabanı
- 🐳 Docker: Konteynerizasyon

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
- Docker (opsiyonel)

## ⚙️ Kurulum

### Docker ile Kurulum

```bash
# Repoyu klonlayın
git clone https://github.com/Sarizeybekk/iha-uretim-sistemi

# Proje dizinine girin
cd aircraft-production-app

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
cd aircraft-production-app

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

- **users**: Kullanıcı ve yetkilendirme işlemleri
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

Projenin model ve API katmanları için kapsamlı birim testleri bulunmaktadır.

```bash
# Tüm testleri çalıştır
python manage.py test

# Belirli bir uygulama testlerini çalıştır
python manage.py test production
```

## 📸 Ekran Görüntüleri
###Swagger UI 
![image](https://github.com/user-attachments/assets/1e20dbf8-9a69-43c1-8577-e282604e3a6e)


### Giriş Ekranı
<img width="1506" alt="giris" src="https://github.com/user-attachments/assets/860423dd-eda0-44b7-978b-d728d258baf3" />


### Ana Sayfa (Dashboard)

<img width="1169" alt="dashboard" src="https://github.com/user-attachments/assets/46ae0e11-9748-473c-9339-abc7ab220cfd" />



### Parça Yönetimi
<img width="731" alt="part-add" src="https://github.com/user-attachments/assets/793a35ca-006a-463b-861d-b5a7ceb89f76" />


### Uçak Montaj
<img width="1298" alt="stok-durumu" src="https://github.com/user-attachments/assets/e9dcc0b7-571c-4675-b72f-bc7dc5b6bc7b" />


### Envanter Takibi
<img width="1398" alt="envanter-sayfasi" src="https://github.com/user-attachments/assets/61a12612-7bbd-4227-a020-ef92d6f5d567" />

### Takım Sayfası 

<img width="1507" alt="takim-sayfasi" src="https://github.com/user-attachments/assets/ee33e62e-c5af-4d97-b62c-95f7f3a2653d" />
<img width="666" alt="takim-edit" src="https://github.com/user-attachments/assets/0ab7aa9d-52db-4b29-aa2c-17355ecbdcf3" />



Proje Dokuman Linki : https://docs.google.com/document/d/1f2oMgkGYjWt2jSHy-O-IErJ9Bj2C5aspMrAncjgW5Os/edit?usp=sharing
