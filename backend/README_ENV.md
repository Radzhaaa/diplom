# Настройка переменных окружения

## Быстрый старт

1. Скопируйте пример файла:
```bash
cp .env.example .env
```

2. Отредактируйте `.env` файл и настройте переменные (особенно JWT_SECRET и пароли)

3. Запустите приложение:
```bash
docker-compose up -d
```

## Тестовый администратор

При первом запуске автоматически создается тестовый администратор:
- **Email:** `admin`
- **Пароль:** `admin123`
- **Роль:** ADMIN

⚠️ **ВАЖНО:** Измените пароль администратора в production!

## Переменные окружения

### Обязательные для production:

- `JWT_SECRET` - длинный случайный ключ (минимум 256 бит)
- `DB_PASSWORD` - пароль для PostgreSQL
- `CORS_ORIGINS` - URL вашего frontend (через запятую, если несколько)

### Опциональные:

- `REDIS_PASSWORD` - пароль для Redis (можно оставить пустым для dev)
- `APP_RATE_LIMIT_ENABLED` - включить/выключить rate limiting (по умолчанию: true)
- `APP_RATE_LIMIT_REQUESTS_PER_MINUTE` - лимит запросов (по умолчанию: 60)

## Пример .env файла

```env
# Database
DB_NAME=gamified_pm
DB_USERNAME=postgres
DB_PASSWORD=your_secure_password
DB_POOL_MAX=20
DB_POOL_MIN=10

# Redis
REDIS_PASSWORD=

# JWT (ОБЯЗАТЕЛЬНО изменить!)
JWT_SECRET=your_very_long_and_secure_secret_key_min_256_bits
JWT_EXPIRATION=86400000
JWT_REFRESH_EXPIRATION=604800000

# CORS
CORS_ORIGINS=http://localhost:3000

# Server
SERVER_PORT=8080

# File Upload
FILE_MAX_SIZE=10MB

# Rate Limiting
APP_RATE_LIMIT_ENABLED=true
APP_RATE_LIMIT_REQUESTS_PER_MINUTE=60

# Spring Profile
SPRING_PROFILES_ACTIVE=prod

# Logging
LOG_FILE=/app/logs/application.log
```
