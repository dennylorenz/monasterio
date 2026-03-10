FROM node:20-slim

# openssl needed to generate self-signed TLS certificate
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN mkdir -p /app/data /app/ssl

# Generate self-signed certificate valid for 10 years
RUN openssl req -x509 -newkey rsa:2048 \
    -keyout /app/ssl/key.pem \
    -out /app/ssl/cert.pem \
    -days 3650 -nodes \
    -subj "/C=ES/ST=Islas Baleares/L=Palma de Mallorca/O=Monasterio/CN=localhost"

EXPOSE 3001

CMD ["node", "server.js"]
