# Gamified Project Management Platform - Backend

Backend приложение для геймифицированной платформы управления проектами, разработанное на Java Spring Boot.

## Технологический стек

- **Java 17**
- **Spring Boot 3.2.0**
- **Spring Security** - аутентификация и авторизация
- **Spring Data JPA** - работа с базой данных
- **PostgreSQL** - основная база данных
- **Redis** - кеширование и сессии
- **JWT** - токены для аутентификации
- **Lombok** - уменьшение boilerplate кода
- **MapStruct** - маппинг DTO
- **Swagger/OpenAPI** - документация API

## Структура проекта

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/gamifiedpm/
│   │   │   ├── config/          # Конфигурационные классы
│   │   │   ├── controller/      # REST контроллеры
│   │   │   ├── dto/             # Data Transfer Objects
│   │   │   ├── model/entity/    # JPA сущности
│   │   │   ├── repository/      # JPA репозитории
│   │   │   ├── security/        # Security конфигурация
│   │   │   └── service/         # Бизнес-логика
│   │   └── resources/
│   │       └── application.yml  # Конфигурация приложения
│   └── test/                     # Тесты
└── pom.xml                       # Maven зависимости
```

## Требования

- Java 17 или выше
- Maven 3.6+
- PostgreSQL 12+
- Redis 6+ (опционально)

## Установка и запуск

### 1. Клонирование и настройка

```bash
cd backend
```

### 2. Настройка базы данных

Создайте базу данных PostgreSQL:

```sql
CREATE DATABASE gamified_pm;
```

### 3. Настройка переменных окружения

Создайте файл `.env` или установите переменные окружения:

```bash
export DB_USERNAME=postgres
export DB_PASSWORD=your_password
export JWT_SECRET=your-secret-key-min-256-bits
export REDIS_HOST=localhost
export REDIS_PORT=6379
```

Или отредактируйте `src/main/resources/application.yml`

### 4. Запуск приложения

```bash
# Сборка проекта
mvn clean install

# Запуск
mvn spring-boot:run
```

Приложение будет доступно по адресу: `http://localhost:8080`

## API Документация

После запуска приложения, Swagger UI доступен по адресу:
- `http://localhost:8080/swagger-ui.html`

## Основные эндпоинты

### Аутентификация
- `POST /api/auth/register` - Регистрация пользователя
- `POST /api/auth/login` - Вход в систему

### Пользователи
- `GET /api/users/me` - Получить текущего пользователя
- `PUT /api/users/me` - Обновить профиль

### Проекты
- `GET /api/projects` - Список проектов
- `POST /api/projects` - Создать проект
- `GET /api/projects/{id}` - Детали проекта
- `PUT /api/projects/{id}` - Обновить проект
- `DELETE /api/projects/{id}` - Удалить проект

### Задачи
- `GET /api/tasks` - Список задач
- `POST /api/tasks` - Создать задачу
- `GET /api/tasks/{id}` - Детали задачи
- `PUT /api/tasks/{id}` - Обновить задачу
- `PUT /api/tasks/{id}/complete` - Выполнить задачу
- `DELETE /api/tasks/{id}` - Удалить задачу

### Геймификация
- `GET /api/leaderboard` - Рейтинг пользователей
- `GET /api/achievements` - Список достижений
- `GET /api/users/{id}/achievements` - Достижения пользователя

### Уведомления
- `GET /api/notifications` - Список уведомлений
- `GET /api/notifications/unread` - Непрочитанные уведомления
- `PUT /api/notifications/{id}/read` - Отметить как прочитанное

## Система геймификации

### Начисление XP
- Задача с низким приоритетом: 10 XP
- Задача со средним приоритетом: 25 XP
- Задача с высоким приоритетом: 50 XP
- Бонус за выполнение в срок: +10 XP
- Комментарий к задаче: 5 XP
- Завершение проекта: 100 XP

### Система уровней
Уровень рассчитывается по формуле:
```
level = floor(sqrt(totalXp / (baseXp * multiplier))) + 1
```
где `baseXp = 100`, `multiplier = 1.5`

### Достижения
Система автоматически проверяет и присваивает достижения:
- Первая выполненная задача
- 10/50/100 выполненных задач
- Достижение уровня 10/20
- Серия активности 30 дней

## Безопасность

- JWT токены для аутентификации
- BCrypt для хеширования паролей
- CORS настройки
- Валидация входных данных
- Защита от SQL-инъекций через JPA

## Разработка

### Запуск в режиме разработки

```bash
mvn spring-boot:run
```

### Тестирование

```bash
mvn test
```

### Сборка для production

```bash
mvn clean package -DskipTests
java -jar target/gamified-project-management-1.0.0.jar
```

## Конфигурация

Основные настройки в `application.yml`:

- `spring.datasource` - настройки БД
- `app.jwt` - настройки JWT
- `app.cors` - настройки CORS
- `app.gamification` - настройки геймификации

## Лицензия

Дипломная работа по направлению "Программная инженерия"




