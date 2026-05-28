#!/usr/bin/env python3
"""
XProject Demo Data Seeder
Создаёт реалистичные данные команды, проекта, задач и чата для скринкаста.

Запуск:
    pip install requests
    python3 seed_demo_data.py

Требования:
    - Backend запущен на http://localhost:8080
    - База данных доступна и чистая (или уже с данными — скрипт идемпотентен)
"""

import requests
import sys
import time
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8080"
PASSWORD = "Demo1234!"
NOW = datetime.now()

# ── Helpers ──────────────────────────────────────────────────────────────────

def api(method, path, token=None, **kwargs):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        r = getattr(requests, method)(f"{BASE_URL}{path}", headers=headers, timeout=10, **kwargs)
        return r
    except requests.exceptions.ConnectionError:
        print(f"\n✗ Cannot connect to {BASE_URL}. Is the backend running?")
        sys.exit(1)

def login(email, password):
    r = api("post", "/api/auth/login", json={"email": email, "password": password})
    if r.status_code == 200:
        return r.json().get("token")
    return None

def register_or_login(email, password, first_name, last_name):
    token = login(email, password)
    if token:
        print(f"  ✓ Вход:         {first_name} {last_name} ({email})")
        return token
    r = api("post", "/api/auth/register", json={
        "email": email,
        "password": password,
        "firstName": first_name,
        "lastName": last_name
    })
    if r.status_code in [200, 201]:
        time.sleep(0.3)
        token = login(email, password)
        if token:
            print(f"  ✓ Зарегистрирован: {first_name} {last_name} ({email})")
            return token
    print(f"  ✗ Ошибка регистрации {email}: {r.status_code} {r.text[:100]}")
    return None

def get_me(token):
    r = api("get", "/api/users/me", token)
    return r.json() if r.status_code == 200 else None

def update_profile(token, **kwargs):
    api("put", "/api/users/me", token, json=kwargs)

def fmt_dt(dt):
    return dt.strftime("%Y-%m-%dT%H:%M:%S")

def get_projects(token):
    r = api("get", "/api/projects", token)
    if r.status_code == 200:
        data = r.json()
        return data if isinstance(data, list) else data.get("content", [])
    return []

def create_project(token, name, description, start_date, end_date):
    r = api("post", "/api/projects", token, json={
        "name": name,
        "description": description,
        "startDate": fmt_dt(start_date),
        "endDate": fmt_dt(end_date)
    })
    if r.status_code in [200, 201]:
        return r.json()
    print(f"  ✗ Ошибка создания проекта: {r.status_code} {r.text[:200]}")
    return None

def add_member(token, project_id, user_id, role):
    r = api("post", f"/api/projects/{project_id}/members", token, json={
        "userId": user_id,
        "role": role
    })
    return r.status_code in [200, 201]

def create_task(token, project_id, title, description, priority, category,
                assigned_to_id=None, deadline=None, xp_reward=25,
                estimated_hours=None, tags=None):
    payload = {
        "projectId": project_id,
        "title": title,
        "description": description,
        "priority": priority,
        "category": category,
        "xpReward": xp_reward,
    }
    if assigned_to_id:
        payload["assignedToId"] = assigned_to_id
    if deadline:
        payload["deadline"] = fmt_dt(deadline)
    if estimated_hours:
        payload["estimatedHours"] = estimated_hours
    if tags:
        payload["tags"] = tags

    r = api("post", "/api/tasks", token, json=payload)
    if r.status_code in [200, 201]:
        return r.json()
    print(f"  ✗ Ошибка создания задачи '{title[:40]}': {r.status_code} {r.text[:150]}")
    return None

def set_task_status(token, task_id, status):
    if status == "COMPLETED":
        r = api("put", f"/api/tasks/{task_id}/complete", token)
    else:
        r = api("put", f"/api/tasks/{task_id}", token, json={"status": status})
    return r.status_code in [200, 201]

def send_message(token, project_id, content):
    r = api("post", f"/api/chat/{project_id}/messages", token, json={"content": content})
    return r.status_code in [200, 201]


# ── Data ──────────────────────────────────────────────────────────────────────

TEAM = [
    # (email, password, firstName, lastName)
    ("admin@example.com",             "admin123",  "Алина",    "Раджапбаева"),
    ("dmitry.volkov@xproject.dev",    PASSWORD,    "Дмитрий",  "Волков"),
    ("anna.sorokina@xproject.dev",    PASSWORD,    "Анна",     "Сорокина"),
    ("mikhail.petrov@xproject.dev",   PASSWORD,    "Михаил",   "Петров"),
    ("elena.kuznetsova@xproject.dev", PASSWORD,    "Елена",    "Кузнецова"),
    ("andrey.smirnov@xproject.dev",   PASSWORD,    "Андрей",   "Смирнов"),
    ("sofia.morozova@xproject.dev",   PASSWORD,    "София",    "Морозова"),
]

# (title, description, priority, category, member_key, status, deadline_offset_days, xp, estimated_h, tags)
TASKS = [
    # ── Backend (Dmitry) ──────────────────────────────────────────────────────
    ("Разработка REST API аутентификации",
     "Реализовать эндпоинты регистрации, входа, выхода и обновления токенов. JWT + Refresh token стратегия.",
     "HIGH", "DEVELOPMENT", "dmitry", "COMPLETED", -20, 50, 8,
     ["backend", "auth", "api"]),

    ("Реализация JWT авторизации и refresh токенов",
     "Spring Security + JWT. AccessToken 24ч, RefreshToken 7 дней. Redis blacklist для отозванных токенов.",
     "HIGH", "DEVELOPMENT", "dmitry", "COMPLETED", -18, 50, 12,
     ["backend", "jwt", "security"]),

    ("API управления задачами и проектами",
     "CRUD эндпоинты для задач и проектов: создание, обновление, мягкое удаление, пагинация, фильтры по статусу/приоритету.",
     "HIGH", "DEVELOPMENT", "dmitry", "COMPLETED", -14, 50, 16,
     ["backend", "api", "crud"]),

    ("Интеграция WebSocket (STOMP + SockJS)",
     "Real-time подписки: /topic/tasks/{id}, /topic/chat/{id}, /topic/notifications/{email}. Тихая синхронизация без перезагрузки.",
     "HIGH", "DEVELOPMENT", "dmitry", "COMPLETED", -10, 50, 10,
     ["backend", "websocket", "realtime"]),

    ("Оптимизация SQL запросов и индексов",
     "Профилировать медленные запросы через pg_stat_statements, добавить составные индексы, устранить N+1 проблемы.",
     "MEDIUM", "DEVELOPMENT", "dmitry", "IN_PROGRESS", 3, 25, 6,
     ["backend", "performance", "database"]),

    ("Интеграция Redis кеша",
     "Кешировать /api/projects, /api/users/me, /api/tasks. TTL 1ч. Инвалидация при изменениях через @CacheEvict.",
     "HIGH", "DEVELOPMENT", "dmitry", "IN_PROGRESS", 2, 50, 8,
     ["backend", "redis", "cache"]),

    ("API системы геймификации (XP, уровни, ачивки)",
     "Эндпоинты для начисления XP, расчёта уровней, разблокировки достижений и лидерборда команды.",
     "MEDIUM", "DEVELOPMENT", "dmitry", "IN_REVIEW", 5, 25, 10,
     ["backend", "gamification", "api"]),

    ("Интеграция LLM для AI-ассистента",
     "Подключить OpenAI-compatible API (Ollama/OpenRouter). Чат с ассистентом, анализ рисков проекта, предложение дедлайнов.",
     "HIGH", "DEVELOPMENT", "dmitry", "NEW", 14, 50, 20,
     ["backend", "ai", "llm"]),

    # ── Frontend (Anna) ───────────────────────────────────────────────────────
    ("Компонент системы авторизации (React)",
     "Страницы Login, Register, ForgotPassword, ResetPassword. Валидация форм (react-hook-form), обработка ошибок API.",
     "HIGH", "DEVELOPMENT", "anna", "COMPLETED", -22, 50, 8,
     ["frontend", "auth", "react"]),

    ("Dashboard главной страницы",
     "Виджеты: мои задачи, активность команды, быстрые действия, счётчик XP. Skeleton loading для медленных запросов.",
     "HIGH", "DEVELOPMENT", "anna", "COMPLETED", -15, 50, 12,
     ["frontend", "dashboard", "react"]),

    ("Kanban-доска для задач",
     "Drag-and-drop между колонками статусов. Real-time обновления через WebSocket подписку. Фильтры по исполнителю и приоритету.",
     "HIGH", "DEVELOPMENT", "anna", "IN_REVIEW", 1, 50, 16,
     ["frontend", "kanban", "dnd", "realtime"]),

    ("Компонент Gantt-диаграммы",
     "Кастомная Gantt на чистом HTML/CSS без сторонних библиотек. Временная шкала, зависимости задач, drag resize.",
     "HIGH", "DEVELOPMENT", "anna", "IN_PROGRESS", 7, 50, 20,
     ["frontend", "gantt", "visualization"]),

    ("Real-time чат команды",
     "Компонент чата с WebSocket. История сообщений (пагинация), отправка, форматирование, отображение онлайн-статуса.",
     "MEDIUM", "DEVELOPMENT", "anna", "IN_PROGRESS", 5, 25, 8,
     ["frontend", "chat", "websocket"]),

    ("Страница профиля пользователя",
     "Редактирование профиля (имя, аватар, bio), статистика XP/уровень, прогресс по достижениям, история активности.",
     "MEDIUM", "DEVELOPMENT", "anna", "NEW", 10, 25, 6,
     ["frontend", "profile", "gamification"]),

    ("Мобильная адаптивная верстка",
     "Гамбургер-меню для навигации, боковая панель как overlay, media queries для экранов < 768px и 480px.",
     "MEDIUM", "DEVELOPMENT", "anna", "IN_PROGRESS", 4, 25, 8,
     ["frontend", "mobile", "responsive", "css"]),

    # ── Design (Elena) ────────────────────────────────────────────────────────
    ("Дизайн-система и UI-кит",
     "Glassmorphism компоненты: кнопки, карточки, инпуты, модальные окна, тосты. Tailwind CSS темы и переменные.",
     "HIGH", "DESIGN", "elena", "COMPLETED", -25, 50, 12,
     ["design", "ui-kit", "tailwind"]),

    ("Прототипы всех экранов в Figma",
     "Wireframes и high-fidelity прототипы: Dashboard, Tasks (Kanban/Gantt/Table), Chat, Profile, Settings, Leaderboard.",
     "HIGH", "DESIGN", "elena", "COMPLETED", -20, 50, 16,
     ["design", "figma", "prototype", "ux"]),

    ("Glassmorphism стиль и цветовая схема",
     "Глобальные CSS-переменные, тёмная тема с blur-эффектами, rgba прозрачности, gradient borders.",
     "MEDIUM", "DESIGN", "elena", "COMPLETED", -16, 25, 6,
     ["design", "css", "glassmorphism", "theme"]),

    ("Иконки и иллюстрации для геймификации",
     "Набор SVG-иконок для 7 достижений (COMMON/RARE/EPIC/LEGENDARY варианты). Иллюстрации пустых состояний.",
     "LOW", "DESIGN", "elena", "IN_REVIEW", 3, 10, 8,
     ["design", "icons", "gamification", "svg"]),

    ("UX-исследование целевой аудитории",
     "5 глубинных интервью с PM и разработчиками. Jobs-to-be-done карта, pain points, рекомендации по UX.",
     "MEDIUM", "DESIGN", "elena", "COMPLETED", -12, 25, 6,
     ["design", "ux", "research", "interviews"]),

    # ── QA (Mikhail) ──────────────────────────────────────────────────────────
    ("Тестирование API аутентификации",
     "Тест-кейсы для /api/auth/*: happy path, edge cases, граничные значения, XSS-защита, SQL injection попытки.",
     "HIGH", "TESTING", "mikhail", "COMPLETED", -16, 50, 8,
     ["qa", "api", "security", "auth"]),

    ("E2E тесты: авторизация и Dashboard",
     "Playwright тесты: Login (валидный/невалидный), Register, ForgotPassword, Dashboard рендер и виджеты.",
     "HIGH", "TESTING", "mikhail", "IN_PROGRESS", 4, 50, 10,
     ["qa", "e2e", "playwright", "automation"]),

    ("Тестирование Kanban-доски",
     "Ручное и автоматизированное тестирование drag-and-drop, WebSocket обновлений, фильтров, edge cases.",
     "HIGH", "TESTING", "mikhail", "NEW", 7, 50, 8,
     ["qa", "kanban", "manual", "automation"]),

    ("Нагрузочное тестирование API",
     "k6 сценарии: 100 RPS на ключевые эндпоинты 10 минут. Профилировать P95/P99 latency, найти узкие места.",
     "MEDIUM", "TESTING", "mikhail", "NEW", 12, 25, 8,
     ["qa", "performance", "k6", "load-testing"]),

    # ── DevOps (Andrey) ───────────────────────────────────────────────────────
    ("Настройка Docker Compose для разработки",
     "Сервисы: backend (Spring Boot), frontend (Vite), PostgreSQL, Redis. Hot reload, volume mounts, health checks.",
     "HIGH", "DEVELOPMENT", "andrey", "COMPLETED", -28, 50, 8,
     ["devops", "docker", "infrastructure"]),

    ("CI/CD пайплайн (GitHub Actions)",
     "Workflow: lint → test → build → push Docker image → deploy to staging. Trigger: push to main и feature/*.",
     "HIGH", "DEVELOPMENT", "andrey", "COMPLETED", -20, 50, 10,
     ["devops", "ci-cd", "github-actions", "automation"]),

    ("Мониторинг: Prometheus + Grafana",
     "Сбор метрик JVM, HTTP response time, error rate, DB connections. Grafana дашборд. Алерты в Telegram.",
     "MEDIUM", "DEVELOPMENT", "andrey", "IN_PROGRESS", 5, 25, 12,
     ["devops", "monitoring", "prometheus", "grafana"]),

    ("Production деплой и SSL-сертификаты",
     "Деплой на VPS: Nginx reverse proxy, Let's Encrypt SSL, env-secrets через Docker secrets, backup БД.",
     "HIGH", "DEVELOPMENT", "andrey", "NEW", 14, 50, 8,
     ["devops", "production", "nginx", "ssl"]),

    # ── Management (Sofia) ────────────────────────────────────────────────────
    ("Роадмап продукта Q2 2026",
     "Детальный роадмап по эпикам и спринтам на 3 месяца. OKR, метрики успеха, риски и митигации.",
     "HIGH", "MANAGEMENT", "sofia", "COMPLETED", -18, 50, 6,
     ["management", "roadmap", "planning"]),

    ("Приоритизация бэклога Sprint 2",
     "Grooming сессия: оценка задач по RICE (Reach/Impact/Confidence/Effort), расстановка приоритетов.",
     "MEDIUM", "MANAGEMENT", "sofia", "IN_PROGRESS", 2, 25, 4,
     ["management", "backlog", "scrum", "grooming"]),

    ("Анализ конкурентов: Jira, Linear, Asana",
     "Сравнительный анализ UX, функциональности и позиционирования ТОП-3 конкурентов. Матрица отличий.",
     "LOW", "MANAGEMENT", "sofia", "COMPLETED", -10, 10, 6,
     ["management", "research", "competitive-analysis"]),

    # ── Admin / Cross-team (Alina) ─────────────────────────────────────────────
    ("Код-ревью модулей аутентификации",
     "Ревью PR #45–#51: безопасность, читаемость кода, покрытие тестами, соответствие соглашениям проекта.",
     "MEDIUM", "DEVELOPMENT", "alina", "IN_REVIEW", 1, 25, 4,
     ["review", "security", "backend"]),

    ("Планирование архитектуры микросервисов",
     "Оценить переход на микросервисы: API Gateway, Service Discovery, распределённые транзакции (SAGA).",
     "HIGH", "MANAGEMENT", "alina", "NEW", 21, 25, 8,
     ["architecture", "microservices", "planning"]),
]

# Chat messages: (member_key, content)
CHAT = [
    ("sofia",   "Всем привет! 👋 Стартуем Sprint 2. Бэклог готов, 15 задач. Предлагаю в 10:00 провести короткий груминг — 30 минут"),
    ("alina",   "Поддерживаю! Буду. Хочу обсудить риски по Gantt-диаграмме — там зависимостей оказалось больше, чем планировали"),
    ("dmitry",  "Я в 10:00 свободен. Беру оптимизацию SQL и интеграцию Redis на этот спринт. Уже нашёл несколько N+1 проблем"),
    ("anna",    "Kanban-доску почти доделала, завтра отправлю на ревью. После неё — Gantt-диаграмма"),
    ("elena",   "Иконки для достижений нарисую сегодня и сразу на ревью. Дима, ты первым посмотришь?"),
    ("dmitry",  "Лена, конечно! Сразу пинганёшь — зайду"),
    ("mikhail", "Начинаю E2E тесты для авторизации. Дима, можешь прислать Postman-коллекцию по auth-эндпоинтам?"),
    ("dmitry",  "Михаил, уже залил в /docs/api — там все эндпоинты с примерами запросов и env-файл для Postman 📁"),
    ("mikhail", "Спасибо, нашёл! Начинаю"),
    ("andrey",  "Docker Compose настроен 🐳 Теперь всё поднимается одной командой: `docker compose up`. Backend + Frontend + DB + Redis"),
    ("anna",    "Андрей, огонь! Теперь онбординг новых людей займёт 5 минут, а не 2 часа"),
    ("anna",    "Kanban-доска готова ✅ Отправила PR #47. Drag-and-drop работает плавно, WebSocket-обновления тоже"),
    ("alina",   "Посмотрела — выглядит отлично! Оставила пару комментариев в PR по UX мелочи"),
    ("anna",    "Поправила, rebased. Можно мержить 👍"),
    ("andrey",  "CI/CD пайплайн готов 🚀 После каждого PR автоматом деплоит на staging. Сборка ~3 минуты"),
    ("sofia",   "Супер! Теперь QA может проверять фичи сразу на стейджинге, не ждать ручного деплоя"),
    ("dmitry",  "Redis кеш подключил 🔥 Query time для /api/projects упал с 450ms до 12ms. Инвалидация через @CacheEvict работает"),
    ("alina",   "Дмитрий, шикарный результат! Запишем в changelog перед релизом"),
    ("dmitry",  "Уже добавил в CHANGELOG.md с деталями по метрикам"),
    ("elena",   "Ребята, набросала варианты иконок для достижений 🎨 Смотрите в Figma — ссылка в описании задачи #19"),
    ("anna",    "Очень нравится второй вариант! Особенно иконка для 'Легенды' — динамичная и стильная"),
    ("mikhail", "Нашёл баг 🐛 При refresh токена иногда возвращает 401. Стабильно воспроизвожу через Playwright. Дима, смотришь?"),
    ("dmitry",  "Вижу, разбираюсь. Похоже на race condition с TTL в Redis"),
    ("dmitry",  "Нашёл и починил! Был edge case с истечением кеша одновременно с refresh. Фикс в PR #51, всего 3 строки 😅"),
    ("alina",   "Мержим! Михаил, можешь перепроверить на staging?"),
    ("mikhail", "Проверил — баг исправлен ✅ Все Playwright тесты зелёные"),
    ("sofia",   "Сегодня стендап в 15:00 🕒 Обсуждаем прогресс Sprint 2 и риски по дедлайну. Zoom-ссылка в Calendar"),
    ("andrey",  "Grafana дашборд поднял 📊 Мониторим latency, error rate и JVM-метрики в реальном времени. Скину ссылку в #devops"),
    ("alina",   "Отличная работа, команда! 🎉 Sprint 2 идёт по плану. До встречи в 15:00"),
]


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("\n🚀 XProject Demo Data Seeder")
    print("=" * 55)

    # 1. Регистрация / вход участников команды
    print("\n📋 Шаг 1: Участники команды")
    tokens = {}
    user_ids = {}
    for email, pwd, first_name, last_name in TEAM:
        token = register_or_login(email, pwd, first_name, last_name)
        if token:
            tokens[email] = token
            me = get_me(token)
            if me:
                user_ids[email] = me["id"]

    admin_token = tokens.get("admin@example.com")
    if not admin_token:
        print("\n✗ Не удалось войти как admin. Запущен ли бэкенд?")
        sys.exit(1)

    # Обновляем имя admin (DataInitializer создаёт его с дефолтным именем)
    update_profile(admin_token, firstName="Алина", lastName="Раджапбаева")

    # Маппинг удобных ключей → user_id
    id_map = {
        "alina":   user_ids.get("admin@example.com"),
        "dmitry":  user_ids.get("dmitry.volkov@xproject.dev"),
        "anna":    user_ids.get("anna.sorokina@xproject.dev"),
        "mikhail": user_ids.get("mikhail.petrov@xproject.dev"),
        "elena":   user_ids.get("elena.kuznetsova@xproject.dev"),
        "andrey":  user_ids.get("andrey.smirnov@xproject.dev"),
        "sofia":   user_ids.get("sofia.morozova@xproject.dev"),
    }
    email_map = {
        "alina":   "admin@example.com",
        "dmitry":  "dmitry.volkov@xproject.dev",
        "anna":    "anna.sorokina@xproject.dev",
        "mikhail": "mikhail.petrov@xproject.dev",
        "elena":   "elena.kuznetsova@xproject.dev",
        "andrey":  "andrey.smirnov@xproject.dev",
        "sofia":   "sofia.morozova@xproject.dev",
    }

    # 2. Создание проекта
    print("\n🏗️  Шаг 2: Проект")
    proj = None
    for p in get_projects(admin_token):
        if "XProject" in p.get("name", ""):
            proj = p
            print(f"  ✓ Найден существующий проект: {p['name']} (id={p['id']})")
            break

    if not proj:
        proj = create_project(
            admin_token,
            name="XProject — Платформа управления ИТ-проектами",
            description=(
                "Разработка современной платформы для управления проектами с элементами "
                "геймификации, AI-ассистентом и real-time коллаборацией. "
                "Tech stack: Spring Boot 3 + React 18 + PostgreSQL + Redis + WebSocket."
            ),
            start_date=NOW - timedelta(days=30),
            end_date=NOW + timedelta(days=60),
        )
        if proj:
            print(f"  ✓ Создан проект: {proj['name']} (id={proj['id']})")

    if not proj:
        print("✗ Не удалось создать проект")
        sys.exit(1)

    proj_id = proj["id"]

    # 3. Добавление участников в проект
    print("\n👥 Шаг 3: Добавление в проект")
    role_map = {
        "admin@example.com":             "OWNER",
        "dmitry.volkov@xproject.dev":    "DEVELOPER",
        "anna.sorokina@xproject.dev":    "DEVELOPER",
        "mikhail.petrov@xproject.dev":   "DEVELOPER",
        "elena.kuznetsova@xproject.dev": "DEVELOPER",
        "andrey.smirnov@xproject.dev":   "DEVELOPER",
        "sofia.morozova@xproject.dev":   "MANAGER",
    }
    for email, role in role_map.items():
        uid = user_ids.get(email)
        name = next((f"{t[2]} {t[3]}" for t in TEAM if t[0] == email), email)
        if uid:
            ok = add_member(admin_token, proj_id, uid, role)
            symbol = "✓" if ok else "ℹ"  # ℹ = уже состоит
            print(f"  {symbol} {name:25} → {role}")

    # 4. Создание задач
    print(f"\n📝 Шаг 4: Задачи ({len(TASKS)} шт.)")
    created = 0
    for spec in TASKS:
        title, desc, priority, category, member_key, status, ddl_offset, xp, est_h, tags = spec
        assigned_id = id_map.get(member_key)
        deadline = NOW + timedelta(days=ddl_offset)
        task = create_task(
            admin_token, proj_id,
            title=title,
            description=desc,
            priority=priority,
            category=category,
            assigned_to_id=assigned_id,
            deadline=deadline,
            xp_reward=xp,
            estimated_hours=est_h,
            tags=tags,
        )
        if task:
            if status != "NEW":
                set_task_status(admin_token, task["id"], status)
            created += 1
            status_icon = {"COMPLETED": "✅", "IN_PROGRESS": "🔄", "IN_REVIEW": "👀", "NEW": "📌"}.get(status, "?")
            print(f"  {status_icon} [{member_key:7}] {title[:55]}")
        time.sleep(0.1)  # не заваливаем сервер

    # 5. Сообщения в чате
    print(f"\n💬 Шаг 5: Чат ({len(CHAT)} сообщений)")
    sent = 0
    for member_key, content in CHAT:
        email = email_map.get(member_key)
        token = tokens.get(email)
        if token:
            ok = send_message(token, proj_id, content)
            if ok:
                sent += 1
                name = member_key.capitalize()
                print(f"  ✓ [{name:8}] {content[:65]}")
            else:
                print(f"  ✗ Ошибка отправки сообщения от {member_key}")
        time.sleep(0.15)

    # ── Итог ──────────────────────────────────────────────────────────────────
    print("\n" + "=" * 55)
    print("✅  Демо-данные успешно загружены!\n")
    print(f"📊  Итоги:")
    print(f"   Участников:  {len(tokens)}/7")
    print(f"   Задач:       {created}/{len(TASKS)}")
    print(f"   Сообщений:   {sent}/{len(CHAT)}")
    print(f"\n🔑  Учётные данные для входа:")
    print(f"   {'Алина Раджапбаева':30} admin@example.com  /  admin123   (Admin)")
    print(f"   {'Дмитрий Волков':30} dmitry.volkov@xproject.dev  /  {PASSWORD}")
    print(f"   {'Анна Сорокина':30} anna.sorokina@xproject.dev  /  {PASSWORD}")
    print(f"   {'Михаил Петров':30} mikhail.petrov@xproject.dev  /  {PASSWORD}")
    print(f"   {'Елена Кузнецова':30} elena.kuznetsova@xproject.dev  /  {PASSWORD}")
    print(f"   {'Андрей Смирнов':30} andrey.smirnov@xproject.dev  /  {PASSWORD}")
    print(f"   {'София Морозова':30} sofia.morozova@xproject.dev  /  {PASSWORD}")
    print()


if __name__ == "__main__":
    main()
