import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

// Ручной флаг ревью (меняем вручную или через secret-toggle)
let REVIEW_MODE = true;

// Берём MAIN_URL из переменных окружения Deno Deploy
const MAIN_URL = Deno.env.get("MAIN_URL") || "https://web.team-s.club";

// Секретный ключ для переключения флага
const SECRET_KEY = Deno.env.get("SECRET_KEY") || "change-me-123";

serve(async (req: Request) => {
  const url = new URL(req.url);

  // ===== СЕКРЕТНАЯ РУЧКА ПЕРЕКЛЮЧЕНИЯ ФЛАГА =====
  // GET /toggle?key=change-me-123         → показывает текущий режим
  // GET /toggle?key=change-me-123&mode=on → включает ревью (ok: false)
  // GET /toggle?key=change-me-123&mode=off→ выключает ревью (отдаёт MAIN_URL)
  if (url.pathname === "/toggle") {
    const key = url.searchParams.get("key");
    if (key !== SECRET_KEY) {
      return new Response("Unauthorized", { status: 403 });
    }

    const mode = url.searchParams.get("mode");
    if (mode === "on") {
      REVIEW_MODE = true;
      return new Response(`REVIEW MODE ON — will return ok: false`);
    } else if (mode === "off") {
      REVIEW_MODE = false;
      return new Response(`REVIEW MODE OFF — will return url: ${MAIN_URL}`);
    }

    // Без mode — просто показать текущее состояние
    return new Response(`Current mode: ${REVIEW_MODE ? "REVIEW (ok: false)" : "LIVE (returns MAIN_URL)"}`);
  }

  // ===== ОСНОВНОЙ ЭНДПОИНТ =====
  if (req.method !== "POST") {
    return new Response("Not Found", { status: 404 });
  }

  // Если флаг ревью включён — возвращаем ok: false (сценарий А навсегда)
  if (REVIEW_MODE) {
    return new Response(JSON.stringify({
      ok: false
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  // Флаг снят — отдаём MAIN_URL
  return new Response(JSON.stringify({
    ok: true,
    url: MAIN_URL
  }), {
    headers: { "Content-Type": "application/json" }
  });
});
