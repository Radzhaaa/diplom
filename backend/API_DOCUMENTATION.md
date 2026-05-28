# API Документация

## Базовый URL
```
http://localhost:8080/api
```

## Аутентификация
Все запросы (кроме `/auth/*`) требуют JWT токен в заголовке:
```
Authorization: Bearer <token>
```

## Endpoints

### Аутентификация

#### POST `/auth/register`
Регистрация нового пользователя

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "Иван",
  "lastName": "Иванов"
}
```

**Response:**
```json
{
  "token": "jwt_token",
  "refreshToken": "refresh_token",
  "user": { ... }
}
```

#### POST `/auth/login`
Вход в систему

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Проекты

#### GET `/projects`
Получить все проекты пользователя

#### GET `/projects/{id}`
Получить проект по ID

#### POST `/projects`
Создать новый проект

**Request Body:**
```json
{
  "name": "Название проекта",
  "description": "Описание",
  "startDate": "2024-01-01T00:00:00",
  "endDate": "2024-12-31T23:59:59"
}
```

#### PUT `/projects/{id}`
Обновить проект

#### DELETE `/projects/{id}`
Удалить проект

### Задачи

#### GET `/tasks?projectId={id}`
Получить задачи (опционально фильтр по проекту)

#### GET `/tasks/{id}`
Получить задачу по ID

#### POST `/tasks`
Создать новую задачу

**Request Body:**
```json
{
  "projectId": 1,
  "title": "Название задачи",
  "description": "Описание",
  "priority": "HIGH",
  "deadline": "2024-01-15T23:59:59",
  "assignedToId": 2,
  "xpReward": 50
}
```

#### PUT `/tasks/{id}`
Обновить задачу

#### PUT `/tasks/{id}/complete`
Завершить задачу (начисляет XP)

#### DELETE `/tasks/{id}`
Удалить задачу

### Пользователи

#### GET `/users/me`
Получить текущего пользователя

#### PUT `/users/me`
Обновить профиль пользователя

### Рейтинг

#### GET `/leaderboard?limit=50`
Получить таблицу лидеров

#### GET `/leaderboard/my-rank`
Получить свой ранг

### Достижения

#### GET `/achievements`
Получить все достижения (с информацией о разблокировке)

#### GET `/achievements/users/{userId}`
Получить достижения пользователя

### Уведомления

#### GET `/notifications`
Получить все уведомления

#### GET `/notifications/unread`
Получить непрочитанные уведомления

#### PUT `/notifications/{id}/read`
Отметить уведомление как прочитанное

#### PUT `/notifications/read-all`
Отметить все уведомления как прочитанные

## Статусы и приоритеты

### Статусы проекта:
- `ACTIVE`
- `COMPLETED`
- `PAUSED`
- `CANCELLED`

### Статусы задачи:
- `NEW`
- `IN_PROGRESS`
- `IN_REVIEW`
- `COMPLETED`
- `CANCELLED`

### Приоритеты задачи:
- `LOW`
- `MEDIUM`
- `HIGH`
- `CRITICAL`

### Редкость достижений:
- `COMMON`
- `UNCOMMON`
- `RARE`
- `EPIC`
- `LEGENDARY`
