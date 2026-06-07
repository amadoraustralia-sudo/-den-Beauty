import Link from "next/link";

export default function PrivacidadePage() {
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

        <h1 className="mb-2" style={{ fontSize: "1.75rem" }}>Política de Privacidade</h1>
        <p className="text-sm mb-10" style={{ color: "var(--text-muted)" }}>Última atualização: {dataAtualizacao}</p>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          <section>
            <h2 className="font-semibold mb-3" style={{ color: "var(--text-primary)", fontSize: "1rem" }}>1. Introdução</h2>
            <p>A presente Política de Privacidade descreve como o Éden Beauty coleta, utiliza, armazena e protege as informações pessoais dos usuários, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).</p>
          </section>

          <section>
            <h2 className="font-semibold mb-3" style={{ color: "var(--text-primary)", fontSize: "1rem" }}>2. Dados coletados</h2>
            <p className="mb-3">Coletamos os seguintes dados fornecidos diretamente pelo usuário:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-1">
              <li>Nome completo</li>
              <li>Endereço de e-mail</li>
              <li>Número de telefone ou WhatsApp</li>
              <li>Informações de uso do sistema (agendamentos, serviços contratados, histórico de atendimento)</li>
              <li>Dados do estabelecimento (para usuários administradores): nome, endereço, horários de funcionamento</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold mb-3" style={{ color: "var(--text-primary)", fontSize: "1rem" }}>3. Finalidade do tratamento</h2>
            <p className="mb-3">Os dados coletados são utilizados exclusivamente para:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-1">
              <li>Criar e gerenciar sua conta de usuário</li>
              <li>Realizar e confirmar agendamentos de serviços</li>
              <li>Enviar notificações sobre agendamentos e atualizações do sistema</li>
              <li>Melhorar a experiência de uso da plataforma</li>
              <li>Cumprir obrigações legais e regulatórias</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold mb-3" style={{ color: "var(--text-primary)", fontSize: "1rem" }}>4. Base legal</h2>
            <p>O tratamento de dados pessoais é realizado com base no consentimento do titular (art. 7º, I da LGPD), na execução de contrato ou procedimentos preliminares (art. 7º, V) e no legítimo interesse do controlador (art. 7º, IX), sempre nos limites e finalidades descritos nesta política.</p>
          </section>

          <section>
            <h2 className="font-semibold mb-3" style={{ color: "var(--text-primary)", fontSize: "1rem" }}>5. Compartilhamento de dados</h2>
            <p>Não vendemos nem compartilhamos seus dados pessoais com terceiros para fins comerciais. Podemos compartilhar informações com prestadores de serviços de infraestrutura tecnológica (como servidores em nuvem) estritamente necessários para o funcionamento da plataforma, mediante acordos de confidencialidade e proteção de dados.</p>
          </section>

          <section>
            <h2 className="font-semibold mb-3" style={{ color: "var(--text-primary)", fontSize: "1rem" }}>6. Armazenamento e segurança</h2>
            <p>Os dados são armazenados em servidores seguros com criptografia em trânsito (TLS) e em repouso. Adotamos medidas técnicas e organizacionais para proteger suas informações contra acesso não autorizado, perda, alteração ou destruição. Senhas são armazenadas com hash criptográfico e nunca em texto puro.</p>
          </section>

          <section>
            <h2 className="font-semibold mb-3" style={{ color: "var(--text-primary)", fontSize: "1rem" }}>7. Retenção de dados</h2>
            <p>Mantemos seus dados pelo período necessário para a prestação dos serviços e cumprimento de obrigações legais. Após o encerramento da conta, os dados poderão ser retidos por até 5 anos para fins de auditoria e conformidade fiscal, conforme exigido pela legislação brasileira.</p>
          </section>

          <section>
            <h2 className="font-semibold mb-3" style={{ color: "var(--text-primary)", fontSize: "1rem" }}>8. Direitos do titular</h2>
            <p className="mb-3">Em conformidade com a LGPD, você tem direito a:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-1">
              <li>Confirmar a existência de tratamento dos seus dados</li>
              <li>Acessar os dados que temos sobre você</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
              <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários</li>
              <li>Revogar o consentimento a qualquer momento</li>
              <li>Solicitar a portabilidade dos seus dados</li>
            </ul>
            <p className="mt-3">Para exercer esses direitos, entre em contato pelo e-mail indicado na seção 10.</p>
          </section>

          <section>
            <h2 className="font-semibold mb-3" style={{ color: "var(--text-primary)", fontSize: "1rem" }}>9. Cookies</h2>
            <p>Utilizamos cookies de sessão estritamente necessários para o funcionamento do sistema de autenticação. Não utilizamos cookies de rastreamento ou publicidade. Ao utilizar o sistema, você consente com o uso desses cookies técnicos.</p>
          </section>

          <section>
            <h2 className="font-semibold mb-3" style={{ color: "var(--text-primary)", fontSize: "1rem" }}>10. Contato e encarregado de dados (DPO)</h2>
            <p>Para dúvidas, solicitações ou exercício de direitos previstos na LGPD, entre em contato com nosso encarregado de proteção de dados: <a href="mailto:privacidade@edenbeauty.com.br" style={{ color: "var(--brand-600)" }}>privacidade@edenbeauty.com.br</a></p>
          </section>

          <section>
            <h2 className="font-semibold mb-3" style={{ color: "var(--text-primary)", fontSize: "1rem" }}>11. Alterações nesta política</h2>
            <p>Podemos atualizar esta Política periodicamente. Notificaremos os usuários sobre alterações relevantes por e-mail ou aviso no sistema. A data da última atualização está sempre indicada no topo desta página.</p>
          </section>
        </div>

        <div className="mt-12 pt-8 flex gap-4" style={{ borderTop: "1px solid var(--border)" }}>
          <Link href="/termos" style={{ color: "var(--brand-600)", fontSize: "0.875rem" }}>Termos de Uso</Link>
          <Link href="/cadastro" style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Voltar ao cadastro</Link>
        </div>
      </div>
    </div>
  );
}
