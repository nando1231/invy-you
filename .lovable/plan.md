
## Plano: Chat com IA "Invy" — Assistente Financeira e de Rotinas

Vou criar a **Invy**, uma assistente IA que conversa com o usuário dentro do app para tirar dúvidas, dar dicas financeiras, ajudar a registrar gastos, sugerir melhorias em rotinas/metas e oferecer suporte geral.

### Como vai funcionar

A Invy aparece como um **botão flutuante** (ícone de chat) em todas as páginas do dashboard. Ao clicar, abre um painel lateral de chat com streaming de respostas em tempo real (token por token, como ChatGPT).

A IA terá **contexto real** do usuário: ela consulta os gastos, tarefas, hábitos e metas do próprio usuário no banco para dar respostas personalizadas (ex: "Você gastou R$ 320 em alimentação este mês, 15% acima do mês passado").

### O que a Invy poderá fazer

1. **Tirar dúvidas** sobre o app (como criar meta, como funciona recorrência, etc.)
2. **Dar dicas financeiras** baseadas nos gastos reais do usuário
3. **Registrar transações via conversa** ("gastei 50 reais no mercado hoje" → cria a transação)
4. **Analisar padrões** de gastos e rotinas
5. **Sugerir melhorias** em metas e hábitos
6. **Suporte geral** com tom amigável e motivador

### Arquitetura técnica

```text
[FAB Chat Button] → [ChatDrawer]
       ↓
[useChat hook] → streams via fetch SSE
       ↓
[Edge Function: invy-chat]
       ↓
   ┌───┴────┐
   ↓        ↓
[Lovable AI]  [Supabase user data]
google/       (transactions,
gemini-3-     tasks, habits,
flash-preview goals do usuário)
       ↓
[Tool calls: create_transaction]
       ↓
[Streaming response → UI]
```

### Implementação

**1. Banco de dados (nova tabela)**
- `chat_conversations` — armazena conversas (id, user_id, title, created_at)
- `chat_messages` — armazena mensagens (id, conversation_id, role, content, created_at)
- RLS: usuário só vê suas próprias conversas/mensagens

**2. Edge Function `invy-chat`** (`supabase/functions/invy-chat/index.ts`)
- Valida JWT do usuário
- Busca contexto: últimas 30 transações, tarefas pendentes, metas ativas, hábitos
- Monta system prompt com personalidade da Invy + contexto do usuário
- Chama Lovable AI Gateway (`google/gemini-3-flash-preview`) com **streaming**
- Suporta **tool calling**: `create_transaction` (para registrar gastos via chat)
- Trata erros 429 (rate limit) e 402 (créditos)
- Salva mensagens na tabela após resposta completa

**3. Componentes novos**
- `src/components/invy/InvyFAB.tsx` — botão flutuante (ícone Sparkles + gradient da marca)
- `src/components/invy/InvyChat.tsx` — drawer/sheet com lista de mensagens + input
- `src/components/invy/MessageBubble.tsx` — bolha com markdown via `react-markdown`
- `src/hooks/useInvyChat.ts` — gerencia estado, streaming SSE token-a-token, histórico

**4. Integração no DashboardLayout**
- Adicionar `<InvyFAB />` ao final do `DashboardLayout.tsx` para aparecer em todas as páginas autenticadas

### System prompt da Invy (resumo)
> "Você é a Invy, assistente financeira e de produtividade do app Invyou. Tom amigável, motivador, em português brasileiro. Use o contexto real do usuário para dar conselhos personalizados. Quando o usuário mencionar um gasto novo, use a tool `create_transaction`. Seja concisa (máx 3 parágrafos)."

### Pacotes a adicionar
- `react-markdown` (renderização das respostas)

### Arquivos
- **Novos**: migration SQL, `supabase/functions/invy-chat/index.ts`, `src/components/invy/InvyFAB.tsx`, `src/components/invy/InvyChat.tsx`, `src/components/invy/MessageBubble.tsx`, `src/hooks/useInvyChat.ts`
- **Editados**: `src/components/dashboard/DashboardLayout.tsx` (adicionar FAB), `package.json` (react-markdown)

### Custo / chaves
- Usa **Lovable AI** (`LOVABLE_API_KEY` já configurada) — sem necessidade de chave externa.
