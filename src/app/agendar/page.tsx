import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const iconeCategoria: Record<string, string> = {
  Cabelo: "✂️", Barba: "🪒", Unhas: "💅", Estética: "✨",
  Sobrancelha: "👁️", Maquiagem: "💄", Outro: "🌿",
};

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export const metadata = {
  title: "Éden Beauty — Agende seu horário",
  description: "Agende serviços de beleza online, escolha seu profissional e horário favorito.",
};

export default async function LandingPage() {
  const supabase = await createClient();

  const [
    { data: servicos },
    { data: profissionais },
    { data: config },
    { data: { user } },
  ] = await Promise.all([
    supabase.from("servicos").select("id, nome, categoria, descricao, duracao_min, preco").eq("ativo", true).order("categoria").order("nome"),
    supabase.from("profissionais").select("id, nome, cargo, especialidades").eq("ativo", true).order("nome"),
    supabase.from("configuracoes").select("*").limit(1).single(),
    supabase.auth.getUser(),
  ]);

  const nomeEstabelecimento = config?.nome_estabelecimento ?? "Éden Beauty";
  const isLogado = !!user;

  // Agrupa serviços por categoria
  const categorias = [...new Set((servicos ?? []).map((s) => s.categoria))];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5F0E8" }}>
      {/* TOPBAR */}
      <header style={{ backgroundColor: "var(--brand-800)", position: "sticky", top: 0, zIndex: 50 }}>
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--brand-400)" }}>
              <span className="text-xs font-bold text-white">EB</span>
            </div>
            <span className="font-bold text-sm tracking-wide text-white">{nomeEstabelecimento}</span>
          </div>
          <div className="flex items-center gap-2">
            {isLogado ? (
              <Link href="/agendar/inicio" className="px-4 py-2 rounded-lg text-xs font-medium text-white" style={{ background: "rgb(255 255 255 / 0.15)" }}>
                Minha área →
              </Link>
            ) : (
              <>
                <Link href="/agendar/login" className="text-xs font-medium" style={{ color: "rgb(255 255 255 / 0.65)" }}>
                  Entrar
                </Link>
                <Link href="/agendar/cadastro" className="px-4 py-2 rounded-lg text-xs font-semibold text-white" style={{ background: "var(--brand-500)" }}>
                  Criar conta
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section style={{ background: "linear-gradient(135deg, var(--brand-800) 0%, var(--brand-600) 100%)", paddingTop: "4rem", paddingBottom: "5rem" }}>
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6" style={{ background: "rgb(255 255 255 / 0.12)", color: "rgb(255 255 255 / 0.8)" }}>
            ✨ Agendamento online rápido e fácil
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight" style={{ color: "white" }}>
            Beleza que encaixa<br />no seu dia
          </h1>
          <p className="text-lg mb-8 max-w-xl mx-auto" style={{ color: "rgb(255 255 255 / 0.7)" }}>
            Agende seus serviços favoritos online, escolha seu profissional e horário preferido — tudo sem sair de casa.
          </p>

          {/* Info do salão */}
          {config && (
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {config.telefone && (
                <span className="flex items-center gap-1.5 text-sm" style={{ color: "rgb(255 255 255 / 0.65)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.94a16 16 0 0 0 6.15 6.15l1.84-1.83a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  {config.telefone}
                </span>
              )}
              {config.endereco && (
                <span className="flex items-center gap-1.5 text-sm" style={{ color: "rgb(255 255 255 / 0.65)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {config.endereco}
                </span>
              )}
              {config.horario_abertura && (
                <span className="flex items-center gap-1.5 text-sm" style={{ color: "rgb(255 255 255 / 0.65)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {config.horario_abertura?.slice(0,5)} – {config.horario_fechamento?.slice(0,5)}
                </span>
              )}
            </div>
          )}

          <Link
            href={isLogado ? "/agendar/novo" : "/agendar/cadastro"}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-base shadow-lg transition-opacity hover:opacity-90"
            style={{ background: "white", color: "var(--brand-800)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            Agendar agora
          </Link>
        </div>
      </section>

      {/* SERVIÇOS */}
      {servicos && servicos.length > 0 && (
        <section className="py-16">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--brand-800)" }}>Nossos serviços</h2>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Tudo que você precisa em um só lugar</p>
            </div>

            {categorias.map((cat) => (
              <div key={cat} className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">{iconeCategoria[cat] ?? "🌿"}</span>
                  <h3 className="text-base font-semibold" style={{ color: "var(--brand-700)" }}>{cat}</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {servicos.filter((s) => s.categoria === cat).map((s) => (
                    <div key={s.id} className="rounded-xl p-4" style={{ background: "white", border: "1px solid var(--border)" }}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{s.nome}</p>
                        <span className="font-bold text-sm flex-shrink-0" style={{ color: "var(--brand-600)" }}>
                          R$ {Number(s.preco).toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                      {s.descricao && (
                        <p className="text-xs mb-2 leading-relaxed" style={{ color: "var(--text-muted)" }}>{s.descricao}</p>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--brand-50)", color: "var(--brand-600)" }}>
                        ⏱ {s.duracao_min < 60 ? `${s.duracao_min}min` : `${Math.floor(s.duracao_min / 60)}h${s.duracao_min % 60 > 0 ? s.duracao_min % 60 + "min" : ""}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* EQUIPE */}
      {profissionais && profissionais.length > 0 && (
        <section className="py-16" style={{ background: "white" }}>
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--brand-800)" }}>Nossa equipe</h2>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Profissionais especializados para o seu cuidado</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {profissionais.map((p) => (
                <div key={p.id} className="text-center p-4 rounded-xl" style={{ border: "1px solid var(--border)" }}>
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-bold"
                    style={{ background: "var(--brand-100)", color: "var(--brand-700)" }}
                  >
                    {getInitials(p.nome)}
                  </div>
                  <p className="font-semibold text-sm mb-0.5" style={{ color: "var(--text-primary)" }}>{p.nome}</p>
                  {p.cargo && <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>{p.cargo}</p>}
                  {p.especialidades && p.especialidades.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1">
                      {p.especialidades.slice(0, 2).map((esp: string) => (
                        <span key={esp} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--brand-50)", color: "var(--brand-600)" }}>
                          {esp}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA BOTTOM */}
      <section className="py-16" style={{ background: "var(--brand-800)" }}>
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-3 text-white">Pronto para se cuidar?</h2>
          <p className="text-sm mb-8" style={{ color: "rgb(255 255 255 / 0.65)" }}>
            Crie sua conta gratuitamente e agende em menos de 2 minutos.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={isLogado ? "/agendar/novo" : "/agendar/cadastro"}
              className="px-8 py-3.5 rounded-xl font-semibold text-sm shadow-lg"
              style={{ background: "white", color: "var(--brand-800)" }}
            >
              {isLogado ? "Agendar agora" : "Criar conta grátis"}
            </Link>
            {!isLogado && (
              <Link
                href="/agendar/login"
                className="px-8 py-3.5 rounded-xl font-semibold text-sm"
                style={{ background: "rgb(255 255 255 / 0.12)", color: "white", border: "1px solid rgb(255 255 255 / 0.2)" }}
              >
                Já tenho conta
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-6" style={{ background: "#1a2a1a", color: "rgb(255 255 255 / 0.4)" }}>
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span>© 2026 {nomeEstabelecimento}. Todos os direitos reservados.</span>
          <div className="flex gap-4">
            <Link href="/termos" target="_blank" className="hover:opacity-75" style={{ color: "inherit" }}>Termos de Uso</Link>
            <Link href="/privacidade" target="_blank" className="hover:opacity-75" style={{ color: "inherit" }}>Privacidade</Link>
            <Link href="/login" className="hover:opacity-75" style={{ color: "inherit" }}>Área do gestor</Link>
          </div>
        </div>
      </footer>

      {/* WhatsApp flutuante */}
      {config?.telefone && (
        <a
          href={`https://wa.me/55${config.telefone.replace(/\D/g, "")}?text=Olá! Gostaria de agendar um horário no ${nomeEstabelecimento}.`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-xl z-50 transition-transform hover:scale-105"
          style={{ background: "#25D366" }}
          aria-label="WhatsApp"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      )}
    </div>
  );
}
