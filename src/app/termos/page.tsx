import Link from "next/link";

export default function TermosPage() {
  const dataAtualizacao = "08 de abril de 2026";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--brand-800)" }}>
            <span className="text-xs font-bold text-white">EB</span>
          </div>
          <span className="font-bold text-sm tracking-wide" style={{ color: "var(--text-primary)" }}>Éden Beauty</span>
        </div>

        <h1 className="mb-2" style={{ fontSize: "1.75rem" }}>Termos de Uso</h1>
        <p className="text-sm mb-10" style={{ color: "var(--text-muted)" }}>Última atualização: {dataAtualizacao}</p>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          <section>
            <h2 className="font-semibold mb-3" style={{ color: "var(--text-primary)", fontSize: "1rem" }}>1. Aceitação dos termos</h2>
            <p>Ao acessar ou utilizar o sistema Éden Beauty, você concorda com estes Termos de Uso. Caso não concorde com qualquer disposição, recomendamos que não utilize o sistema.</p>
          </section>

          <section>
            <h2 className="font-semibold mb-3" style={{ color: "var(--text-primary)", fontSize: "1rem" }}>2. Descrição do serviço</h2>
            <p>O Éden Beauty é uma plataforma SaaS de gestão para salões de beleza e barbearias, oferecendo funcionalidades de agendamento online, controle financeiro, cadastro de clientes e profissionais, e relatórios de desempenho.</p>
          </section>

          <section>
            <h2 className="font-semibold mb-3" style={{ color: "var(--text-primary)", fontSize: "1rem" }}>3. Cadastro e responsabilidade do usuário</h2>
            <p>Para utilizar o sistema, é necessário criar uma conta com informações verdadeiras e atualizadas. O usuário é responsável pela confidencialidade de suas credenciais de acesso e por todas as atividades realizadas em sua conta.</p>
          </section>

          <section>
            <h2 className="font-semibold mb-3" style={{ color: "var(--text-primary)", fontSize: "1rem" }}>4. Uso permitido</h2>
            <p>O sistema deve ser utilizado exclusivamente para fins legítimos de gestão de estabelecimentos de beleza. É vedado o uso para atividades ilegais, envio de spam, tentativas de acesso não autorizado ou qualquer forma de abuso da plataforma.</p>
          </section>

          <section>
            <h2 className="font-semibold mb-3" style={{ color: "var(--text-primary)", fontSize: "1rem" }}>5. Propriedade intelectual</h2>
            <p>Todo o conteúdo, design, código e funcionalidades do Éden Beauty são de propriedade exclusiva dos desenvolvedores. É proibida a reprodução, modificação ou distribuição sem autorização expressa por escrito.</p>
          </section>

          <section>
            <h2 className="font-semibold mb-3" style={{ color: "var(--text-primary)", fontSize: "1rem" }}>6. Disponibilidade do serviço</h2>
            <p>Nos esforçamos para manter o sistema disponível 24 horas por dia, 7 dias por semana. No entanto, não garantimos disponibilidade ininterrupta e nos reservamos o direito de realizar manutenções programadas com aviso prévio sempre que possível.</p>
          </section>

          <section>
            <h2 className="font-semibold mb-3" style={{ color: "var(--text-primary)", fontSize: "1rem" }}>7. Limitação de responsabilidade</h2>
            <p>O Éden Beauty não se responsabiliza por perdas de dados decorrentes de uso inadequado, falhas de conexão do usuário ou eventos de força maior. Recomendamos que os usuários mantenham cópias de informações críticas.</p>
          </section>

          <section>
            <h2 className="font-semibold mb-3" style={{ color: "var(--text-primary)", fontSize: "1rem" }}>8. Alterações nos termos</h2>
            <p>Podemos atualizar estes Termos periodicamente. Notificaremos os usuários sobre alterações significativas por e-mail ou aviso no sistema. O uso continuado após as alterações implica aceitação dos novos termos.</p>
          </section>

          <section>
            <h2 className="font-semibold mb-3" style={{ color: "var(--text-primary)", fontSize: "1rem" }}>9. Encerramento de conta</h2>
            <p>O usuário pode encerrar sua conta a qualquer momento. Nos reservamos o direito de suspender ou encerrar contas que violem estes Termos de Uso.</p>
          </section>

          <section>
            <h2 className="font-semibold mb-3" style={{ color: "var(--text-primary)", fontSize: "1rem" }}>10. Contato</h2>
            <p>Dúvidas sobre estes termos podem ser enviadas para: <a href="mailto:contato@edenbeauty.com.br" style={{ color: "var(--brand-600)" }}>contato@edenbeauty.com.br</a></p>
          </section>
        </div>

        <div className="mt-12 pt-8 flex gap-4" style={{ borderTop: "1px solid var(--border)" }}>
          <Link href="/privacidade" style={{ color: "var(--brand-600)", fontSize: "0.875rem" }}>Política de Privacidade</Link>
          <Link href="/cadastro" style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Voltar ao cadastro</Link>
        </div>
      </div>
    </div>
  );
}
