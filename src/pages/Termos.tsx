import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import invyouIcon from "@/assets/invyou-icon.png";

const Termos = () => {
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
            <h1 className="text-3xl sm:text-4xl font-bold">Termos de Uso</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Última atualização: 16 de junho de 2026
            </p>
          </div>

          <section className="space-y-3">
            <p className="text-muted-foreground leading-relaxed">
              Estes Termos de Uso regulam a utilização do aplicativo Invyou. Ao criar uma conta ou
              utilizar o serviço, você concorda integralmente com as cláusulas a seguir.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">1. O serviço</h2>
            <p className="text-muted-foreground leading-relaxed">
              O Invyou é uma ferramenta de organização pessoal, controle financeiro, hábitos,
              metas e tarefas, com auxílio de um assistente baseado em inteligência artificial
              (IA Invy). O acesso ao app é totalmente <strong>gratuito</strong>; não há
              assinaturas, compras dentro do app ou cobranças ocultas.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">2. Cadastro e conta</h2>
            <p className="text-muted-foreground leading-relaxed">
              Você é responsável por fornecer informações verdadeiras e por manter a segurança das
              suas credenciais. Notifique-nos imediatamente em caso de uso não autorizado da sua
              conta.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">3. Uso adequado</h2>
            <p className="text-muted-foreground leading-relaxed">
              Você concorda em não utilizar o Invyou para fins ilícitos, fraudulentos, ofensivos
              ou que violem direitos de terceiros. Reservamo-nos o direito de suspender ou
              encerrar contas que descumpram estes Termos.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">4. Não é consultoria financeira</h2>
            <p className="text-muted-foreground leading-relaxed">
              As informações, análises, gráficos e recomendações exibidas no Invyou — inclusive
              aquelas geradas pela IA Invy — têm caráter <strong>meramente informativo e
              educacional</strong>. O Invyou <strong>não presta consultoria financeira,
              contábil, jurídica ou de investimentos</strong>. Decisões financeiras são de
              responsabilidade exclusiva do usuário, que deve, sempre que necessário, consultar
              profissionais qualificados.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">5. Inteligência Artificial</h2>
            <p className="text-muted-foreground leading-relaxed">
              A IA Invy pode produzir respostas imprecisas, incompletas ou desatualizadas. Não
              garantimos exatidão, adequação ou aplicabilidade do conteúdo gerado. Verifique
              sempre as informações antes de tomar decisões com base nelas.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">6. Propriedade intelectual</h2>
            <p className="text-muted-foreground leading-relaxed">
              Todos os direitos sobre o app, marca, layout, código e materiais pertencem ao
              Invyou. O conteúdo inserido pelo usuário permanece de propriedade do próprio
              usuário, que concede licença limitada de uso para operação do serviço.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">7. Limitação de responsabilidade</h2>
            <p className="text-muted-foreground leading-relaxed">
              Na máxima extensão permitida pela lei, o Invyou não se responsabiliza por danos
              indiretos, lucros cessantes, perda de dados ou prejuízos decorrentes do uso ou da
              impossibilidade de uso do serviço.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">8. Exclusão de conta</h2>
            <p className="text-muted-foreground leading-relaxed">
              Você pode encerrar a sua conta a qualquer momento em
              <strong> Configurações → Zona de Perigo → Excluir minha conta</strong>. A exclusão é
              permanente e remove todos os seus dados do serviço.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">9. Alterações</h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos modificar estes Termos a qualquer tempo. As alterações entram em vigor a
              partir da publicação dentro do app. O uso contínuo após a alteração indica
              concordância.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">10. Lei aplicável e foro</h2>
            <p className="text-muted-foreground leading-relaxed">
              Estes Termos são regidos pelas leis da República Federativa do Brasil, incluindo a
              Lei Geral de Proteção de Dados (LGPD). Fica eleito o foro do domicílio do usuário
              para dirimir quaisquer controvérsias.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">11. Contato</h2>
            <p className="text-muted-foreground leading-relaxed">
              Dúvidas sobre estes Termos podem ser enviadas para <strong>{"{EMAIL_CONTATO}"}</strong>.
              Razão social: <strong>{"{RAZAO_SOCIAL}"}</strong>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Termos;