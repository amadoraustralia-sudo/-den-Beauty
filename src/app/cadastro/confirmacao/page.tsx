import Link from "next/link";

export default function ConfirmacaoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "var(--bg)" }}>
      <div className="text-center max-w-sm">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ backgroundColor: "var(--brand-100)" }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9"/>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            <path d="m16 19 2 2 4-4"/>
          </svg>
        </div>
        <h2 className="mb-2">Verifique seu e-mail</h2>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          Enviamos um link de confirmação para o seu e-mail. Clique no link para ativar sua conta e começar a agendar.
        </p>
        <Link href="/login" className="btn btn-primary">
          Ir para o login
        </Link>
      </div>
    </div>
  );
}
