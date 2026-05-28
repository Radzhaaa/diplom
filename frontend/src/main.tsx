import { createRoot } from "react-dom/client";
import App from "./App.tsx";
/* 1) Tailwind — база и утилиты */
import "./index.css";
/* 2) XProject: переменные, glass, типографика (перекрывают Tailwind) */
import "./styles/globals.v2.css";
/* 3) Финальный слой: layout на весь экран и glass (гарантированно поверх всего) */
import "./styles/xproject-overrides.css";
import "./styles/landing.css";
import { AuthProvider, useAuth } from "./contexts/AuthContext.tsx";
import { NotificationProvider } from "./contexts/NotificationContext.tsx";
import { ThemeProvider } from "./contexts/ThemeContext.tsx";
import { AchievementUnlockProvider } from "./contexts/AchievementUnlockContext.tsx";
import { ActiveTimerProvider } from "./contexts/ActiveTimerContext.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";

function AppWithNotifications() {
  const { user } = useAuth();
  return (
    <NotificationProvider user={user}>
      <ActiveTimerProvider>
        <App />
      </ActiveTimerProvider>
    </NotificationProvider>
  );
}

function AppWithProviders() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <AchievementUnlockProvider>
            <AppWithNotifications />
          </AchievementUnlockProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

if (typeof document !== "undefined") {
  document.documentElement.setAttribute("data-xproject-entry", "main.tsx");
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(<AppWithProviders />);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
