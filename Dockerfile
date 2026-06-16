FROM php:8.4-cli

ARG VITE_INSFORGE_URL=https://w66d8gas.us-east.insforge.app
ARG VITE_INSFORGE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NzkzMTR9.Cors_ettZF-ufE9Ky1MhKWaYTdD4OP4IzLGx_iMRiiQ
ARG VITE_APP_NAME="LINKEDIN POST"

RUN apt-get update && apt-get install -y \
    libpq-dev \
    libzip-dev \
    unzip \
    curl \
    nodejs \
    npm \
    && docker-php-ext-install pdo_pgsql zip bcmath \
    && apt-get clean

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY . .

RUN composer install --no-dev --optimize-autoloader && \
    VITE_INSFORGE_URL=${VITE_INSFORGE_URL} \
    VITE_INSFORGE_ANON_KEY=${VITE_INSFORGE_ANON_KEY} \
    VITE_APP_NAME="${VITE_APP_NAME}" \
    npm ci && npm run build

EXPOSE 10000

CMD php artisan config:cache && \
    php artisan route:cache && \
    php artisan migrate --force && \
    php artisan serve --host=0.0.0.0 --port=${PORT:-10000}
