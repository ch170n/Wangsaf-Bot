FROM node:20-alpine

# Set folder kerja di dalam container
WORKDIR /app

RUN apk update && apk add --no-cache ffmpeg

# Salin file konfigurasi npm
COPY package*.json ./

# Install library
RUN npm install

# Salin seluruh kode (kecuali yang ada di .dockerignore)
COPY . .

# Perintah utama untuk menjalankan bot
CMD ["node", "src/index.js"]
