const MAIN_URL = Deno.env.get("MAIN_URL") || "https://web.team-s.club";
const SECRET_KEY = Deno.env.get("SECRET_KEY") || "change-me-123";

// Эта функция вызывается при КАЖДОМ запросе и читает свежее значение из env
function isReviewMode(): boolean {
  const envValue = Deno.env.get("REVIEW_MODE");
  // Если переменная не задана или равна "true" — режим ревью включён
  return envValue !== "false";
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  // ===== СЕКРЕТНАЯ РУЧКА ПЕРЕКЛЮЧЕНИЯ (через env менять не можем из кода,
  //       поэтому просто показываем инструкцию) =====
  if (url.pathname === "/toggle") {
    const key = url.searchParams.get("key");
    if (key !== SECRET_KEY) {
      return new Response("Unauthorized", { status: 403 });
    }

    const currentMode = isReviewMode();
    return new Response(
      `Current mode: ${currentMode ? "REVIEW (ok: false)" : "LIVE (returns MAIN_URL)"}\n\n` +
      `To change mode:\n` +
      `1. Go to Deno Deploy Dashboard → Settings → Environment Variables\n` +
      `2. Set REVIEW_MODE to "false" (to go LIVE) or "true" (for review)\n` +
      `3. Changes apply within seconds to all instances`
    );
  }

  // ===== ОСНОВНОЙ ЭНДПОИНТ =====
  if (req.method !== "POST") {
    return new Response("Not Found", { status: 404 });
  }

  // При каждом запросе читаем свежее значение
  if (isReviewMode()) {
    return new Response(JSON.stringify({ ok: false }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ ok: true, url: MAIN_URL }), {
    headers: { "Content-Type": "application/json" }
  });
});
