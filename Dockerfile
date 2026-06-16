FROM php:8.4-cli

ARG VITE_INSFORGE_URL
ARG VITE_INSFORGE_ANON_KEY
ARG VITE_APP_NAME

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
