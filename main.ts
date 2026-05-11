const SECRET_KEY = Deno.env.get("SECRET_KEY") || "change-me-123";
const IPINFO_TOKEN = Deno.env.get("IPINFO_TOKEN") || "";

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

// Получение страны через ipinfo.io
async function getCountryByIP(ip: string): Promise<string> {
  if (!IPINFO_TOKEN) return "";
  
  try {
    const resp = await fetch(`https://ipinfo.io/${ip}?token=${IPINFO_TOKEN}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (resp.ok) {
      const data = await resp.json();
      return (data.country || "").toUpperCase();
    }
  } catch {
    //
  }
  return "";
}

// Извлечение IP клиента
function getClientIP(req: Request): string {
  // Deno Deploy иногда даёт IP напрямую
  const denoIP = (req as any).ip;
  if (denoIP && typeof denoIP === "string") return denoIP;
  
  // Стандартные заголовки
  const xForwarded = req.headers.get("x-forwarded-for");
  if (xForwarded) return xForwarded.split(",")[0].trim();
  
  const xReal = req.headers.get("x-real-ip");
  if (xReal) return xReal.trim();
  
  // Последняя надежда — берём из RemoteAddr (если доступен)
  const remoteAddr = (req as any).remoteAddr;
  if (remoteAddr && typeof remoteAddr === "string") return remoteAddr;
  
  return "";
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

  // Основной эндпоинт
  if (req.method !== "POST") {
    return new Response("", { status: 404 });
  }

  // Режим ревью
  if (isReviewMode()) {
    return new Response(JSON.stringify({ ok: false }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  // Определяем страну
  let country = Deno.env.get("TEST_COUNTRY") || "";
  
  if (!country) {
    const ip = getClientIP(req);
    if (ip) {
      country = await getCountryByIP(ip);
    }
  }

  console.log(`IP: ${getClientIP(req)}, Country: ${country || "unknown"}`);

  // Ищем в таблице
  if (country && GEO_LINKS[country]) {
    return new Response(JSON.stringify({ ok: true, url: GEO_LINKS[country] }), {
      headers: { "Content-Type": "application/json" }
    });
  }

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
