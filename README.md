# İHA (Hava Aracı) Üretim Uygulaması

Proje Dokuman Linki : https://docs.google.com/document/d/1f2oMgkGYjWt2jSHy-O-IErJ9Bj2C5aspMrAncjgW5Os/edit?usp=sharing

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
###Swagger UI 
![image](https://github.com/user-attachments/assets/3ea1663c-8c39-419c-95cd-24715e48b14e)



### Giriş Ekranı
![image](https://github.com/user-attachments/assets/b46b8dd4-4e74-4e84-87be-d5d52edeb67c)



### Ana Sayfa (Dashboard)

![image](https://github.com/user-attachments/assets/d60a186f-a20d-49b3-a737-ceed378932f0)




### Parça Yönetimi
![image](https://github.com/user-attachments/assets/387ac098-f08e-49c6-9eae-ad6a20be2770)
adminde kontrol
<img width="731" alt="part-add" src="https://github.com/user-attachments/assets/793a35ca-006a-463b-861d-b5a7ceb89f76" />


### Uçak Montaj
![image](https://github.com/user-attachments/assets/a3ac5aac-dbd6-4837-9c55-174313cfe4c2)
![image](https://github.com/user-attachments/assets/264a1398-708b-4193-86a9-be2133d8f06c)
![image](https://github.com/user-attachments/assets/5a17f784-8493-4a81-8667-27a349437ce0)
![image](https://github.com/user-attachments/assets/e01fee7d-4ee5-446a-b7ca-a9bc322ff517)


### Envanter Takibi
![image](https://github.com/user-attachments/assets/376ea3c0-1184-451b-b4af-2182d2eaea29)
![image](https://github.com/user-attachments/assets/fe53c151-c962-4216-b990-3a1e69940030)



Proje detayı ve test sonuçları hepsi dokumana eklenmiştir.

Proje Dokuman Linki : https://docs.google.com/document/d/1f2oMgkGYjWt2jSHy-O-IErJ9Bj2C5aspMrAncjgW5Os/edit?usp=sharing
