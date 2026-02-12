

# Usuário Administrador (bypass do paywall)

## O que será feito

Criar um sistema de roles (papéis) no banco de dados para que usuários marcados como "admin" possam acessar o app sem precisar pagar assinatura.

## Etapas

### 1. Criar tabela de roles no banco de dados
- Nova tabela `user_roles` com colunas `user_id` e `role`
- Tipo enum `app_role` com valores: `admin`, `user`
- Políticas de segurança (RLS) para proteger a tabela
- Função auxiliar `has_role()` para verificar roles de forma segura

### 2. Atribuir role de admin à sua conta
- Inserir registro na tabela `user_roles` para o email `cavilhaads@gmail.com` com role `admin`

### 3. Atualizar a verificação de assinatura
- Modificar a Edge Function `check-subscription` para verificar se o usuário tem role `admin` antes de checar trial/Stripe
- Se for admin, retornar `subscribed: true` automaticamente

### 4. Resultado
- Sua conta `cavilhaads@gmail.com` terá acesso total sem precisar pagar
- Usuários normais continuam passando pelo fluxo de trial + assinatura

---

### Detalhes Técnicos

**Migração SQL:**
```sql
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Política: apenas admins podem ver roles
CREATE POLICY "Admins can view roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);
```

**Inserção do admin:**
```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users
WHERE email = 'cavilhaads@gmail.com';
```

**Edge Function `check-subscription`:** Adicionar verificação de admin logo no início, antes do check de trial/Stripe. Se `has_role(user_id, 'admin')` retornar true, responder com `subscribed: true` imediatamente.

