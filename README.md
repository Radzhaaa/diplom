# Геймифицированная платформа для управления проектами

Дипломная работа по направлению "Программная инженерия"

## Описание проекта

Веб-платформа для управления проектами с элементами геймификации, предназначенная для повышения мотивации участников команды через игровые механики (уровни, очки опыта, достижения, рейтинги).

## Структура проекта

```
XProject/
├── assets/                           # Логотипы проекта (SVG)
├── backend/                          # Java Spring Boot Backend
│   ├── src/main/java/com/gamifiedpm/
│   │   ├── config/                  # Конфигурация
│   │   ├── controller/              # REST контроллеры
│   │   ├── dto/                     # Data Transfer Objects
│   │   ├── model/entity/           # JPA сущности
│   │   ├── repository/              # JPA репозитории
│   │   ├── security/                # Security конфигурация
│   │   └── service/                 # Бизнес-логика
│   └── pom.xml                      # Maven зависимости
│
├── frontend/                         # React Frontend
│   ├── src/
│   │   ├── components/             # React компоненты (ui/, auth/)
│   │   ├── contexts/               # React контексты
│   │   ├── hooks/                  # useTasks, useProjects и др.
│   │   ├── services/               # API клиент (api.ts)
│   │   ├── utils/                  # Утилиты
│   │   └── styles/                  # Стили
│   └── package.json
│
├── docker-compose.yml                # Запуск для разработки
├── docker-compose.prod.yml           # Запуск для продакшна
└── Makefile                          # Команды деплоя
```

## Технологический стек

### Backend
- Java 17
- Spring Boot 3.2.0
- PostgreSQL
- Redis
- JWT для аутентификации

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Radix UI

## Быстрый старт

### Требования
- Java 17+
- Node.js 18+
- PostgreSQL 12+
- Maven 3.6+
- Redis (опционально)

### Backend

1. Перейдите в директорию backend:
```bash
cd backend
```

2. Настройте базу данных PostgreSQL:
```sql
CREATE DATABASE gamified_pm;
```

3. Настройте переменные окружения в `src/main/resources/application.yml` или через переменные окружения:
```bash
export DB_USERNAME=postgres
export DB_PASSWORD=your_password
export JWT_SECRET=your-secret-key-min-256-bits
```

4. Запустите приложение:
```bash
./mvnw spring-boot:run
```

Backend будет доступен на `http://localhost:8080`

**Запуск без Docker:** в корне проекта выполните `./run-platform-no-docker.sh`. Будет использован профиль `local`: встроенная БД H2 (файл в `backend/data/`), кеш в памяти, без PostgreSQL и Redis. Требуются только Java 17+ и Node.js 18+.

**Запуск через Docker:** `docker compose up --build -d` или `make up`.

### Frontend

1. Перейдите в директорию frontend:
```bash
cd frontend
```

2. Установите зависимости:
```bash
npm install
```

3. Создайте файл `.env`:
```bash
cp .env.example .env
```

4. Запустите dev сервер:
```bash
npm run dev
```

Frontend будет доступен на `http://localhost:3000`

## Основные функции

### Управление проектами
- Создание и редактирование проектов
- Просмотр списка проектов
- Отслеживание прогресса выполнения

### Управление задачами
- Создание и назначение задач
- Изменение статуса задач
- Комментирование задач
- Прикрепление файлов

### Геймификация
- **Система уровней** - автоматическое повышение уровня на основе накопленных XP
- **Очки опыта (XP)** - начисление за выполнение задач
- **Достижения** - автоматическое присвоение достижений при выполнении условий
- **Рейтинги** - лидерборд пользователей
- **Серии активности** - отслеживание ежедневной активности

### Уведомления
- Уведомления о назначении задач
- Уведомления о выполнении задач
- Уведомления о достижениях
- Уведомления о повышении уровня

## API Документация

После запуска backend, Swagger UI доступен по адресу:
- `http://localhost:8080/swagger-ui.html`

## Документация

- [Backend README](./backend/README.md) - документация backend
- [Frontend README](./frontend/README.md) - документация frontend

## Разработка

### Backend разработка
```bash
cd backend
mvn spring-boot:run
```

### Frontend разработка
```bash
cd frontend
npm run dev
```

## Лицензия

Дипломная работа по направлению "Программная инженерия"




