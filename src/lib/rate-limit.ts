/**
 * Rate limiter in-memory simples para Server Actions e API Routes.
 * Em produção multi-instância (Vercel), substituir por Redis (Upstash).
 *
 * Uso:
 *   const result = await rateLimit(ip, "login", 5, 60); // 5 tentativas por 60s
 *   if (!result.ok) return { error: "rate_limit" };
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Map em memória — suficiente para single-instance / dev
const store = new Map<string, RateLimitEntry>();

/**
 * @param identifier  IP ou userId
 * @param action      Prefixo da chave (ex: "login", "reset-password")
 * @param maxRequests Máximo de requisições permitidas na janela
 * @param windowSecs  Duração da janela em segundos
 */
export function rateLimit(
  identifier: string,
  action: string,
  maxRequests: number,
  windowSecs: number
): { ok: boolean; remaining: number; resetAt: number } {
  const key = `${action}:${identifier}`;
  const now = Date.now();

  let entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + windowSecs * 1000 };
  }

  entry.count += 1;
  store.set(key, entry);

  const remaining = Math.max(0, maxRequests - entry.count);
  return {
    ok: entry.count <= maxRequests,
    remaining,
    resetAt: entry.resetAt,
  };
}

/**
 * Extrai o IP da request do Next.js.
 * Suporta Vercel (x-forwarded-for) e ambientes locais.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0].trim();
    if (ip) return ip;
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp;
  // Fallback para ambiente local sem headers de proxy.
  // Em dev, múltiplos usuários compartilham o bucket — aceitável.
  // Em produção (Vercel) x-forwarded-for é sempre injetado; este bloco nunca é atingido.
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[rate-limit] IP header ausente: fallback 127.0.0.1 (bucket compartilhado em dev)');
  }
  return '127.0.0.1';
}
