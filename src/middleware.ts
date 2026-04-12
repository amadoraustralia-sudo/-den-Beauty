import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rotas públicas (sem auth necessário)
const PUBLIC_ROUTES = [
  "/login", "/cadastro", "/agendar/login", "/agendar/cadastro",
  "/agendar/recuperar-senha", "/recuperar-senha", "/redefinir-senha",
  "/termos", "/privacidade",
];

// Rotas do portal do cliente que exigem login
const PORTAL_PROTECTED = [
  "/agendar/inicio", "/agendar/novo",
  "/agendar/meus-agendamentos", "/agendar/perfil",
];

// Rotas exclusivas do painel admin
const ADMIN_ROUTES = [
  "/dashboard", "/agenda", "/clientes", "/agendamentos",
  "/profissionais", "/servicos", "/financeiro", "/relatorios", "/configuracoes",
];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANTE: usar getUser() (valida com servidor) e nunca getSession() (apenas local)
  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  const isPublic = PUBLIC_ROUTES.some((r) => path === r || path.startsWith(r + "/"));

  // 1. Rotas protegidas do portal do cliente — requer login
  const isPortalProtected = PORTAL_PROTECTED.some((r) => path === r || path.startsWith(r + "/"));
  if (!user && isPortalProtected) {
    const url = new URL("/agendar/login", request.url);
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  // 2. Rotas do painel admin — requer login
  const isAdminRoute = ADMIN_ROUTES.some((r) => path === r || path.startsWith(r + "/"));
  if (!user && isAdminRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 3. Usuário logado tenta acessar páginas de auth → redireciona para área correta
  if (user && (path === "/login" || path === "/agendar/login" || path === "/agendar/cadastro")) {
    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", user.id).single();

    const dest = profile?.role === "admin" ? "/dashboard" : "/agendar/inicio";
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

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
