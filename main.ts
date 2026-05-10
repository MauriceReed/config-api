// Никаких импортов — используем встроенный Deno.serve
let REVIEW_MODE = true;
const MAIN_URL = Deno.env.get("MAIN_URL") || "https://web.team-s.club";
const SECRET_KEY = Deno.env.get("SECRET_KEY") || "change-me-123";

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  // Секретная ручка переключения
  if (url.pathname === "/toggle") {
    const key = url.searchParams.get("key");
    if (key !== SECRET_KEY) {
      return new Response("Unauthorized", { status: 403 });
    }

    const mode = url.searchParams.get("mode");
    if (mode === "on") {
      REVIEW_MODE = true;
      return new Response("REVIEW MODE ON — will return ok: false");
    } else if (mode === "off") {
      REVIEW_MODE = false;
      return new Response(`REVIEW MODE OFF — will return url: ${MAIN_URL}`);
    }

    return new Response(`Current mode: ${REVIEW_MODE ? "REVIEW (ok: false)" : "LIVE (returns MAIN_URL)"}`);
  }

  // Основной эндпоинт
  if (req.method !== "POST") {
    return new Response("Not Found", { status: 404 });
  }

  if (REVIEW_MODE) {
    return new Response(JSON.stringify({ ok: false }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ ok: true, url: MAIN_URL }), {
    headers: { "Content-Type": "application/json" }
  });
});
