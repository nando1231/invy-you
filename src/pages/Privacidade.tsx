import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import invyouIcon from "@/assets/invyou-icon.png";

const Privacidade = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={invyouIcon} alt="Invyou" className="w-8 h-8" />
            <span className="font-bold text-lg tracking-tight lowercase">
              inv<span className="text-gradient">you</span>
            </span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-10 max-w-3xl">
        <div className="glass rounded-2xl p-6 sm:p-10 border-glow space-y-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold">Política de Privacidade</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Última atualização: 16 de junho de 2026
            </p>
          </div>

          <section className="space-y-3">
            <p className="text-muted-foreground leading-relaxed">
              A sua privacidade é prioridade para o Invyou. Esta Política de Privacidade descreve
              como coletamos, usamos, armazenamos e protegemos as suas informações ao utilizar o
              aplicativo, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 —
              LGPD).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">1. Dados que coletamos</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                <strong>Cadastro:</strong> nome completo e e-mail, fornecidos no momento do
                registro.
              </li>
              <li>
                <strong>Dados financeiros:</strong> transações, categorias, metas, hábitos, tarefas
                e lançamentos recorrentes que você insere manualmente no app.
              </li>
              <li>
                <strong>Interações com a IA Invy:</strong> mensagens enviadas ao assistente, usadas
                exclusivamente para gerar respostas personalizadas.
              </li>
              <li>
                <strong>Dados técnicos mínimos:</strong> informações de sessão necessárias para
                autenticação e segurança.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">2. Finalidade do tratamento</h2>
            <p className="text-muted-foreground leading-relaxed">
              Utilizamos seus dados para: (i) fornecer e operar o app; (ii) personalizar a sua
              experiência e as recomendações da IA Invy; (iii) gerar relatórios, gráficos e
              resumos; (iv) garantir segurança, prevenir fraudes e cumprir obrigações legais.
              Nunca vendemos seus dados a terceiros.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">3. Armazenamento e segurança</h2>
            <p className="text-muted-foreground leading-relaxed">
              Seus dados são armazenados em infraestrutura segura provida pelo Supabase, com
              criptografia em trânsito (HTTPS) e em repouso. Aplicamos Row-Level Security (RLS)
              para garantir que cada usuário só acesse os próprios dados.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">4. Compartilhamento</h2>
            <p className="text-muted-foreground leading-relaxed">
              Compartilhamos dados apenas com provedores essenciais à operação (hospedagem,
              autenticação e modelos de IA), todos sob obrigações contratuais de confidencialidade.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">5. Seus direitos (LGPD)</h2>
            <p className="text-muted-foreground leading-relaxed">
              Você pode, a qualquer momento: acessar, corrigir, exportar e excluir seus dados.
              A exclusão da conta está disponível diretamente no app, em
              <strong> Configurações → Zona de Perigo → Excluir minha conta</strong>. Ao confirmar,
              todos os seus dados são apagados em definitivo dos nossos servidores.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">6. Retenção</h2>
            <p className="text-muted-foreground leading-relaxed">
              Mantemos seus dados enquanto sua conta estiver ativa. Após a exclusão, a remoção é
              imediata, exceto registros que devam ser conservados por obrigação legal.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">7. Crianças</h2>
            <p className="text-muted-foreground leading-relaxed">
              O Invyou não é destinado a menores de 13 anos. Não coletamos intencionalmente dados
              de crianças.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">8. Alterações</h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos atualizar esta Política periodicamente. Avisaremos sobre mudanças relevantes
              dentro do app.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">9. Contato</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para dúvidas, solicitações de titular ou exercer seus direitos sob a LGPD, entre em
              contato com o Encarregado de Dados (DPO) em <strong>{"{EMAIL_CONTATO}"}</strong>.
              Controlador: <strong>{"{RAZAO_SOCIAL}"}</strong>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Privacidade;