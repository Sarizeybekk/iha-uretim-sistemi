# Base image
FROM node:18-alpine

# Çalışma dizini
WORKDIR /app

# Bağımlılıkları yükle
COPY package.json package-lock.json ./
RUN npm install

# Dosyaları kopyalama
COPY . .

# Port tanımla
EXPOSE 3000

# Hot-reloading desteği ile başlat
CMD ["npm", "start"]
