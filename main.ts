const SECRET_KEY = Deno.env.get("SECRET_KEY") || "change-me-123";

// Таблица ГЕО-ссылок (ключи — ISO alpha-2 коды стран)
const GEO_LINKS: Record<string, string> = {
  "GB": "https://track.ftdhunters.com/visit/?bta=35073&nci=5343&utm_campaign=&afp10=ASO&afp1={subid}&pathid=RPBAsoCrash",
  "DE": "https://track.spartaaffiliates.com/visit/?bta=36172&nci=5490&afp10=ASO&afp1={subid}&pathid=WinbeatzASOChick",
  "ES": "https://track.spartaaffiliates.com/visit/?bta=36172&nci=5490&afp10=ASO&afp1={subid}&pathid=WinbeatzASOChick",
  "IT": "https://track.spartaaffiliates.com/visit/?bta=36172&nci=5490&afp10=ASO&afp1={subid}&pathid=WinbeatzASOChick",
  "CA": "https://track.spartaaffiliates.com/visit/?bta=36172&nci=5490&afp10=ASO&afp1={subid}&pathid=WinbeatzASOChick",
};

function isReviewMode(): boolean {
  return Deno.env.get("REVIEW_MODE") !== "false";
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  // /toggle
  if (url.pathname === "/toggle") {
    const key = url.searchParams.get("key");
    if (key !== SECRET_KEY) {
      return new Response("Unauthorized", { status: 403 });
    }
    return new Response(isReviewMode() ? "review" : "live");
  }

  // Основной эндпоинт — только POST
  if (req.method !== "POST") {
    return new Response("", { status: 404 });
  }

  // Режим ревью
  if (isReviewMode()) {
    return new Response(JSON.stringify({ ok: false }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  // Достаём страну из заголовка Cloudflare
  const country = req.headers.get("CF-IPCountry") || "";

  // Ищем в таблице
  if (country && GEO_LINKS[country]) {
    console.log(`Country: ${country} → ${GEO_LINKS[country]}`);
    return new Response(JSON.stringify({ ok: true, url: GEO_LINKS[country] }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  // Страна не определена или нет в таблице
  console.log(`Country: ${country || "unknown"} → REJECTED`);
  return new Response(JSON.stringify({ ok: false }), {
    headers: { "Content-Type": "application/json" }
  });
});

// const SECRET_KEY = Deno.env.get("SECRET_KEY") || "change-me-123";

// const GEO_LINKS: Record<string, string> = {
//   "en_GB": "https://track.ftdhunters.com/visit/?bta=35073&nci=5343&utm_campaign=&afp10=ASO&afp1={subid}&pathid=RPBAsoCrash",
//   "de_DE": "https://track.spartaaffiliates.com/visit/?bta=36172&nci=5490&afp10=ASO&afp1={subid}&pathid=WinbeatzASOChick",
//   "es_ES": "https://track.spartaaffiliates.com/visit/?bta=36172&nci=5490&afp10=ASO&afp1={subid}&pathid=WinbeatzASOChick",
//   "it_IT": "https://track.spartaaffiliates.com/visit/?bta=36172&nci=5490&afp10=ASO&afp1={subid}&pathid=WinbeatzASOChick",
//   "en_CA": "https://track.spartaaffiliates.com/visit/?bta=36172&nci=5490&afp10=ASO&afp1={subid}&pathid=WinbeatzASOChick",
//   "en_US": "https://track.spartaaffiliates.com/visit/?bta=36172&nci=5490&afp10=ASO&afp1={subid}&pathid=WinbeatzASOChick",
// };

// function isReviewMode(): boolean {
//   return Deno.env.get("REVIEW_MODE") !== "false";
// }

// Deno.serve(async (req: Request) => {
//   const url = new URL(req.url);

//   // /toggle — только для переключения режима через env (ничего не пишет лишнего)
//   if (url.pathname === "/toggle") {
//     const key = url.searchParams.get("key");
//     if (key !== SECRET_KEY) {
//       return new Response("Unauthorized", { status: 403 });
//     }
//     const mode = isReviewMode();
//     return new Response(mode ? "review" : "live");
//   }

//   // Основной эндпоинт — только POST
//   if (req.method !== "POST") {
//     return new Response("", { status: 404 });
//   }

//   // Режим ревью
//   if (isReviewMode()) {
//     return new Response(JSON.stringify({ ok: false }), {
//       headers: { "Content-Type": "application/json" }
//     });
//   }

//   // Читаем локаль
//   let locale: string | undefined;
//   try {
//     const body = await req.json();
//     locale = body.locale;
//   } catch {
//     //
//   }

//   // Нет локали или нет в таблице
//   if (!locale || !GEO_LINKS[locale]) {
//     return new Response(JSON.stringify({ ok: false }), {
//       headers: { "Content-Type": "application/json" }
//     });
//   }

//   // Отдаём ссылку
//   return new Response(JSON.stringify({ ok: true, url: GEO_LINKS[locale] }), {
//     headers: { "Content-Type": "application/json" }
//   });
// });
