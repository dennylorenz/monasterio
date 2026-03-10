#!/bin/sh
set -e

certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email denny@kolor-berlin.com \
  --agree-tos \
  --non-interactive \
  --keep-until-expiring \
  -d chausseestr.dynv6.net

# Renewal loop — checks every 12h, renews if expiry < 30 days
while true; do
  sleep 12h
  certbot renew --webroot --webroot-path=/var/www/certbot --quiet
done
