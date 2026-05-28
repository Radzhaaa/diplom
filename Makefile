## ─── XProject — Hot Deploy ─────────────────────────────────
##
## Быстрый деплой без полного пересборки docker-compose:
##
##   make deploy-frontend   # ~10 сек: vite build → docker cp → nginx reload
##   make deploy-backend    # ~40 сек: mvn package → docker cp → container restart
##   make deploy            # оба сразу (параллельно)
##
##   make up                # поднять всё с нуля (первый запуск)
##   make down              # остановить
##   make logs              # tail логов
##   make logs-backend
##   make logs-frontend
##   make ps                # статус контейнеров

FRONTEND_DIR  := frontend
FRONTEND_CNT  := xproject-frontend
BACKEND_DIR   := backend
BACKEND_CNT   := xproject-backend
JAR_PATTERN   := $(BACKEND_DIR)/target/gamified-project-management-*.jar

# ─── Hot deploy ──────────────────────────────────────────────

## Пересобрать фронт и залить в running-контейнер (без docker build)
deploy-frontend:
	@echo "▶ Building frontend..."
	cd "$(FRONTEND_DIR)" && npm run build
	@echo "▶ Copying dist/ to container $(FRONTEND_CNT)..."
	docker cp "$(FRONTEND_DIR)/dist/." $(FRONTEND_CNT):/usr/share/nginx/html/
	@echo "▶ Reloading nginx..."
	docker exec $(FRONTEND_CNT) nginx -s reload
	@echo "✅ Frontend deployed!"

## Пересобрать бэкенд JAR и перезапустить только backend-контейнер
deploy-backend:
	@echo "▶ Building backend JAR (skipping tests)..."
	cd $(BACKEND_DIR) && ./mvnw package -DskipTests -q
	@echo "▶ Copying JAR to container $(BACKEND_CNT)..."
	docker cp $(JAR_PATTERN) $(BACKEND_CNT):/app/app.jar
	@echo "▶ Restarting backend container..."
	docker restart $(BACKEND_CNT)
	@echo "⏳ Waiting for health check..."
	@sleep 5
	@docker inspect --format='{{.State.Health.Status}}' $(BACKEND_CNT) 2>/dev/null || true
	@echo "✅ Backend deployed!"

## Задеплоить оба компонента (параллельно)
deploy:
	$(MAKE) deploy-frontend & $(MAKE) deploy-backend & wait
	@echo "✅ Full deploy done!"

# ─── Docker compose ──────────────────────────────────────────

## Первый запуск / полная пересборка
up:
	docker compose up --build -d

## Остановить всё
down:
	docker compose down

## Только postgres + redis (инфраструктура)
infra:
	docker compose up -d postgres redis

## Перезапустить конкретный сервис (make restart svc=backend)
restart:
	docker compose restart $(svc)

# ─── Логи ────────────────────────────────────────────────────

logs:
	docker compose logs -f --tail=100

logs-backend:
	docker logs -f $(BACKEND_CNT) --tail=100

logs-frontend:
	docker logs -f $(FRONTEND_CNT) --tail=50

ps:
	docker compose ps

.PHONY: deploy-frontend deploy-backend deploy up down infra restart logs logs-backend logs-frontend ps
