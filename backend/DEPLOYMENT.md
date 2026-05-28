# Инструкция по развертыванию в Production

## Требования

- Docker и Docker Compose
- PostgreSQL 15+
- Redis 7+
- Java 17+

## Тестовый администратор

При первом запуске автоматически создается тестовый администратор:
- **Email:** `admin`
- **Пароль:** `admin123`
- **Роль:** ADMIN

⚠️ **ВАЖНО:** Измените пароль администратора в production!

## Переменные окружения

Создайте файл `.env` в директории `backend/`:

```env
# Database
DB_NAME=gamified_pm
DB_USERNAME=postgres
DB_PASSWORD=your_secure_password_here
DB_POOL_MAX=20
DB_POOL_MIN=10

# Redis
REDIS_PASSWORD=your_redis_password_here

# JWT (ОБЯЗАТЕЛЬНО изменить!)
JWT_SECRET=your_very_long_and_secure_secret_key_min_256_bits_here
JWT_EXPIRATION=86400000
JWT_REFRESH_EXPIRATION=604800000

# CORS (укажите ваш frontend URL)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Server
SERVER_PORT=8080

# File upload
FILE_MAX_SIZE=10MB

# Rate limiting
APP_RATE_LIMIT_ENABLED=true
APP_RATE_LIMIT_REQUESTS_PER_MINUTE=60

# Spring Profile
SPRING_PROFILES_ACTIVE=prod
```

## Развертывание

### 1. Сборка и запуск с Docker Compose

```bash
cd backend
docker-compose up -d
```

### 2. Проверка статуса

```bash
docker-compose ps
docker-compose logs -f app
```

### 3. Health check

```bash
curl http://localhost:8080/actuator/health
```

## Миграции БД

Flyway автоматически выполнит миграции при первом запуске.

Для ручного выполнения:

```bash
docker-compose exec app java -jar app.jar --spring.flyway.migrate
```

## Мониторинг

- Health: `http://localhost:8080/actuator/health`
- Metrics: `http://localhost:8080/actuator/metrics`
- Prometheus: `http://localhost:8080/actuator/prometheus`

## Логи

Логи сохраняются в `backend/logs/application.log`

Просмотр логов:
```bash
docker-compose logs -f app
# или
tail -f backend/logs/application.log
```

## Backup БД

```bash
docker-compose exec postgres pg_dump -U postgres gamified_pm > backup.sql
```

## Восстановление БД

```bash
docker-compose exec -T postgres psql -U postgres gamified_pm < backup.sql
```

## Обновление

```bash
# Остановить
docker-compose down

# Обновить код
git pull

# Пересобрать и запустить
docker-compose up -d --build
```

## Безопасность

⚠️ **ВАЖНО:**
1. Обязательно измените `JWT_SECRET` на длинный случайный ключ (минимум 256 бит)
2. Используйте сильные пароли для БД и Redis
3. Настройте firewall для ограничения доступа
4. Используйте HTTPS в production
5. Настройте регулярные backup БД
6. Мониторьте логи на предмет подозрительной активности

## Troubleshooting

### Приложение не запускается

1. Проверьте логи: `docker-compose logs app`
2. Проверьте переменные окружения
3. Убедитесь, что PostgreSQL и Redis доступны

### Ошибки подключения к БД

1. Проверьте, что PostgreSQL запущен: `docker-compose ps postgres`
2. Проверьте credentials в `.env`
3. Проверьте логи PostgreSQL: `docker-compose logs postgres`

### Rate limiting не работает

1. Убедитесь, что Redis доступен
2. Проверьте `APP_RATE_LIMIT_ENABLED=true` в `.env`
3. Проверьте логи приложения
