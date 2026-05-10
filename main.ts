// Открываем KV-хранилище (бесплатно в Deno Deploy)
const kv = await Deno.openKv();

const MAIN_URL = Deno.env.get("MAIN_URL") || "https://web.team-s.club";
const SECRET_KEY = Deno.env.get("SECRET_KEY") || "change-me-123";

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  // ===== ПЕРЕКЛЮЧЕНИЕ ФЛАГА (теперь через KV) =====
  if (url.pathname === "/toggle") {
    const key = url.searchParams.get("key");
    if (key !== SECRET_KEY) {
      return new Response("Unauthorized", { status: 403 });
    }

    const mode = url.searchParams.get("mode");
    
    if (mode === "on") {
      await kv.set(["review_mode"], true);
      return new Response("REVIEW MODE ON — will return ok: false");
    } else if (mode === "off") {
      await kv.set(["review_mode"], false);
      return new Response(`REVIEW MODE OFF — will return url: ${MAIN_URL}`);
    }

    // Без mode — показать текущее состояние
    const current = await kv.get(["review_mode"]);
    const isReview = current.value !== false; // по умолчанию true
    return new Response(`Current mode: ${isReview ? "REVIEW (ok: false)" : "LIVE (returns MAIN_URL)"}`);
  }

  // ===== ОСНОВНОЙ ЭНДПОИНТ =====
  if (req.method !== "POST") {
    return new Response("Not Found", { status: 404 });
  }

  // Читаем флаг из KV (доступно всем экземплярам)
  const result = await kv.get(["review_mode"]);
  const isReviewMode = result.value !== false; // если нет записи — считаем что ревью

  if (isReviewMode) {
    return new Response(JSON.stringify({ ok: false }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ ok: true, url: MAIN_URL }), {
    headers: { "Content-Type": "application/json" }
  });
});
