#!/bin/bash
# Запуск платформы БЕЗ Docker: бэкенд на H2 (файловая БД), кеш in-memory, фронтенд на Vite.
# Требования: Java 17+, Maven, Node.js 18+

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

echo "=== XProject: запуск без Docker (профиль local) ==="

# Загрузка переменных из backend/.env (включая AI_API_KEY)
if [ -f "$SCRIPT_DIR/backend/.env" ]; then
  set -a
  source "$SCRIPT_DIR/backend/.env"
  set +a
fi

# Профиль local = H2 + без Redis, без установки PostgreSQL/Redis
export SPRING_PROFILES_ACTIVE=local

# Проверка и освобождение портов 8080 и 3000 (чтобы платформа гарантированно запустилась)
free_port() {
  local port=$1
  if command -v lsof &>/dev/null; then
    local pids=$(lsof -ti :"$port" 2>/dev/null)
    if [ -n "$pids" ]; then
      echo "Порт $port занят (PID: $pids). Останавливаем процессы..."
      echo "$pids" | xargs kill -9 2>/dev/null || true
      sleep 3
      # Повторная проверка
      if lsof -ti :"$port" &>/dev/null; then
        echo "    Предупреждение: порт $port всё ещё занят. Завершите процесс вручную: lsof -i :$port"
      fi
    fi
  fi
}
free_port 8080
free_port 3000
echo "Порты 8080 и 3000 проверены."

# 1. Сборка и запуск бэкенда (в фоне)
echo "[1/3] Сборка бэкенда..."
cd "$BACKEND_DIR"
if ! ./mvnw -q compile -DskipTests 2>/dev/null; then
  echo "    Первый запуск Maven может занять время..."
  ./mvnw compile -DskipTests
fi
echo "[2/3] Запуск бэкенда на http://localhost:8080 (H2 БД в ./backend/data/) ..."
./mvnw spring-boot:run -DskipTests -Dspring-boot.run.profiles=local &
BACKEND_PID=$!
cd "$SCRIPT_DIR"

# Ожидание готовности бэкенда
echo "    Ожидание старта бэкенда (до 60 сек)..."
BACKEND_OK=
for i in $(seq 1 30); do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/actuator/health 2>/dev/null | grep -q 200; then
    echo "    Бэкенд готов."
    BACKEND_OK=1
    break
  fi
  sleep 2
done
if [ -z "$BACKEND_OK" ]; then
  echo ""
  echo "!!! Бэкенд не запустился. Проверьте:"
  echo "    - Порт 8080 свободен: lsof -i :8080"
  echo "    - Java 17+: java -version"
  echo "    - В папке backend: ./mvnw spring-boot:run -DskipTests -Dspring-boot.run.profiles=local"
  echo ""
fi

# 2. Запуск фронтенда
echo "[3/3] Запуск фронтенда на http://localhost:3000 ..."
cd "$FRONTEND_DIR"
if [ ! -d node_modules ]; then
  npm install
fi
npm run dev &
FRONTEND_PID=$!
cd "$SCRIPT_DIR"

# Остановка при Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

echo ""
echo "=== Платформа запущена (без Docker) ==="
echo "  Backend:  http://localhost:8080"
echo "  Frontend: http://localhost:3000"
echo "  Swagger:  http://localhost:8080/swagger-ui.html"
echo "  Тестовый админ: email=admin, пароль=admin123"
echo "  БД: H2, данные в backend/data/"
echo ""
echo "Для остановки нажмите Ctrl+C."
wait $FRONTEND_PID 2>/dev/null || true
