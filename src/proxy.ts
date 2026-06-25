import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rotas públicas (sem auth necessário)
const PUBLIC_ROUTES = [
  "/login", "/cadastro", "/agendar/login", "/agendar/cadastro",
  "/agendar/recuperar-senha", "/recuperar-senha", "/redefinir-senha",
  "/termos", "/privacidade",
];

// Rotas que são públicas mas com prefixo /agendar (landing, sem subpastas protegidas)
const PORTAL_PROTECTED = [
  "/agendar/inicio", "/agendar/novo",
  "/agendar/meus-agendamentos", "/agendar/perfil",
];

// Rotas exclusivas do painel admin
const ADMIN_ROUTES = [
  "/dashboard", "/agenda", "/clientes", "/agendamentos",
  "/profissionais", "/servicos", "/financeiro", "/relatorios", "/configuracoes",
  "/minha-conta",
];

function buildCsp(nonce: string) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'unsafe-inline'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://*.supabase.co",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

function setSecurityHeaders(response: NextResponse, csp: string) {
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // 1. Rotas protegidas do portal do cliente — requer login
  const isPortalProtected = PORTAL_PROTECTED.some((r) => path === r || path.startsWith(r + "/"));
  if (!user && isPortalProtected) {
    const url = new URL("/agendar/login", request.url);
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  // 2. Rotas do admin — requer login
  const isAdminRoute = ADMIN_ROUTES.some((r) => path === r || path.startsWith(r + "/"));
  if (!user && isAdminRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 3. Usuário logado tenta acessar /login ou /agendar/login → redireciona
  if (user && (path === "/login" || path === "/agendar/login" || path === "/agendar/cadastro")) {
    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", user.id).single();

    const dest = (profile?.role === "admin" || profile?.role === "super_admin") ? "/dashboard" : "/agendar/inicio";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // 4. Cliente tentando acessar painel admin → redireciona para portal
  if (user && isAdminRoute) {
    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", user.id).single();

    if (profile?.role === "cliente") {
      return NextResponse.redirect(new URL("/agendar/inicio", request.url));
    }
  }

  setSecurityHeaders(supabaseResponse, csp);
  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
