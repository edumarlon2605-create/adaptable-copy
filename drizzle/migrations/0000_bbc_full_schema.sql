-- 1. Enum de papéis
CREATE TYPE public.app_role AS ENUM ('admin', 'consultor', 'cliente');

-- 2. Tabela de papéis por usuário
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

GRANT SELECT, INSERT, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Tabela de perfis
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    cpf TEXT UNIQUE,
    phone TEXT,
    whatsapp TEXT,
    email TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    status TEXT NOT NULL DEFAULT 'ativo',
    notes TEXT,
    consultor_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Tabela de cartas contempladas
CREATE TABLE public.cartas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    valor NUMERIC NOT NULL,
    administradora TEXT NOT NULL,
    grupo TEXT NOT NULL,
    cota TEXT NOT NULL,
    prazo INTEGER NOT NULL,
    parcela NUMERIC NOT NULL,
    situacao TEXT NOT NULL DEFAULT 'disponivel',
    valor_entrada NUMERIC NOT NULL,
    descricao TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cartas TO authenticated;
GRANT ALL ON public.cartas TO service_role;
GRANT SELECT ON public.cartas TO anon;

ALTER TABLE public.cartas ENABLE ROW LEVEL SECURITY;

-- 5. Gatilho para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cartas_updated_at
BEFORE UPDATE ON public.cartas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Schema interno e função de papéis (security definer)
CREATE SCHEMA IF NOT EXISTS internal;

CREATE OR REPLACE FUNCTION internal.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = internal, public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    );
$$;

GRANT USAGE ON SCHEMA internal TO authenticated;
GRANT EXECUTE ON FUNCTION internal.has_role(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION internal.has_role(UUID, public.app_role) TO service_role;

CREATE OR REPLACE FUNCTION internal.current_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- 7. Políticas
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (internal.has_role(auth.uid(), 'admin'))
WITH CHECK (internal.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can read own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (internal.has_role(auth.uid(), 'admin'))
WITH CHECK (internal.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage cartas"
ON public.cartas
FOR ALL
TO authenticated
USING (internal.has_role(auth.uid(), 'admin'))
WITH CHECK (internal.has_role(auth.uid(), 'admin'));

CREATE POLICY "Consultores can manage cartas"
ON public.cartas
FOR ALL
TO authenticated
USING (internal.has_role(auth.uid(), 'consultor'))
WITH CHECK (internal.has_role(auth.uid(), 'consultor'));

CREATE POLICY "Public can view available cartas"
ON public.cartas
FOR SELECT
TO anon, authenticated
USING (situacao = 'disponivel');

-- 8. Índices de perfis
CREATE UNIQUE INDEX IF NOT EXISTS profiles_cpf_key ON public.profiles(cpf) WHERE cpf IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_key ON public.profiles(lower(email)) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON public.profiles(user_id);

-- 9. Campos financeiros das cartas
ALTER TABLE public.cartas
  ADD COLUMN IF NOT EXISTS versao TEXT,
  ADD COLUMN IF NOT EXISTS valor_bem NUMERIC,
  ADD COLUMN IF NOT EXISTS saldo_devedor NUMERIC,
  ADD COLUMN IF NOT EXISTS valores_pagos NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credito_contemplacao NUMERIC,
  ADD COLUMN IF NOT EXISTS credito_disponivel NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS data_adesao DATE,
  ADD COLUMN IF NOT EXISTS data_contemplacao DATE,
  ADD COLUMN IF NOT EXISTS previsao_encerramento DATE,
  ADD COLUMN IF NOT EXISTS parcelas_totais INTEGER,
  ADD COLUMN IF NOT EXISTS parcelas_pagas INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dia_vencimento INTEGER,
  ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS taxa_mensal NUMERIC NOT NULL DEFAULT 0.0012,
  ADD COLUMN IF NOT EXISTS percentual_administrativo numeric NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS valor_administrativo numeric,
  ADD COLUMN IF NOT EXISTS valor_total numeric,
  ADD COLUMN IF NOT EXISTS primeiro_vencimento date,
  ADD COLUMN IF NOT EXISTS categoria text,
  ADD COLUMN IF NOT EXISTS bem_especifico text;

ALTER TABLE public.cartas ALTER COLUMN valor DROP NOT NULL;
ALTER TABLE public.cartas ALTER COLUMN prazo DROP NOT NULL;
ALTER TABLE public.cartas ALTER COLUMN parcela DROP NOT NULL;
ALTER TABLE public.cartas ALTER COLUMN valor_entrada DROP NOT NULL;

DROP POLICY IF EXISTS "Clientes read own cartas" ON public.cartas;
CREATE POLICY "Clientes read own cartas" ON public.cartas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = cartas.cliente_id AND p.user_id = auth.uid()
    )
  );

-- 10. Parcelas
CREATE TABLE IF NOT EXISTS public.carta_parcelas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carta_id UUID NOT NULL REFERENCES public.cartas(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  vencimento DATE NOT NULL,
  valor NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  pago_em TIMESTAMPTZ,
  pago_por uuid,
  observacoes text,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (carta_id, numero)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.carta_parcelas TO authenticated;
GRANT ALL ON public.carta_parcelas TO service_role;

ALTER TABLE public.carta_parcelas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage parcelas" ON public.carta_parcelas;
CREATE POLICY "Admins manage parcelas" ON public.carta_parcelas
  FOR ALL TO authenticated
  USING (internal.has_role(auth.uid(), 'admin'))
  WITH CHECK (internal.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Consultores manage parcelas" ON public.carta_parcelas;
CREATE POLICY "Consultores manage parcelas" ON public.carta_parcelas
  FOR ALL TO authenticated
  USING (internal.has_role(auth.uid(), 'consultor'))
  WITH CHECK (internal.has_role(auth.uid(), 'consultor'));

DROP POLICY IF EXISTS "Clientes read own parcelas" ON public.carta_parcelas;
CREATE POLICY "Clientes read own parcelas" ON public.carta_parcelas
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.cartas c
    JOIN public.profiles p ON p.id = c.cliente_id
    WHERE c.id = carta_parcelas.carta_id AND p.user_id = auth.uid()
  ));

DROP TRIGGER IF EXISTS update_carta_parcelas_updated_at ON public.carta_parcelas;
CREATE TRIGGER update_carta_parcelas_updated_at BEFORE UPDATE ON public.carta_parcelas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.protect_paid_parcela()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status = 'pago' THEN
    IF NEW.valor <> OLD.valor OR NEW.numero <> OLD.numero OR NEW.carta_id <> OLD.carta_id THEN
      RAISE EXCEPTION 'Parcela paga não pode ter valor, número ou carta alterados.';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_protect_paid_parcela ON public.carta_parcelas;
CREATE TRIGGER trg_protect_paid_parcela
  BEFORE UPDATE ON public.carta_parcelas
  FOR EACH ROW EXECUTE FUNCTION public.protect_paid_parcela();

-- 11. Perfis: consultor por user_id e políticas de consultor
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS consultor_user_id UUID,
  ADD COLUMN IF NOT EXISTS rg TEXT,
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS marital_status TEXT,
  ADD COLUMN IF NOT EXISTS profession TEXT,
  ADD COLUMN IF NOT EXISTS cep TEXT,
  ADD COLUMN IF NOT EXISTS street TEXT,
  ADD COLUMN IF NOT EXISTS number TEXT,
  ADD COLUMN IF NOT EXISTS complement TEXT,
  ADD COLUMN IF NOT EXISTS neighborhood TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Brasil',
  ADD COLUMN IF NOT EXISTS rg_doc_path TEXT,
  ADD COLUMN IF NOT EXISTS cnh_doc_path TEXT,
  ADD COLUMN IF NOT EXISTS address_proof_path TEXT;

DROP POLICY IF EXISTS "Consultores can manage own clients" ON public.profiles;
CREATE POLICY "Consultores can manage own clients"
ON public.profiles
FOR ALL
TO authenticated
USING (
  internal.has_role(auth.uid(), 'consultor'::app_role)
  AND consultor_user_id = auth.uid()
)
WITH CHECK (
  internal.has_role(auth.uid(), 'consultor'::app_role)
  AND consultor_user_id = auth.uid()
);

-- 12. Histórico de pagamentos
CREATE TABLE IF NOT EXISTS public.payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carta_id uuid NOT NULL REFERENCES public.cartas(id) ON DELETE CASCADE,
  installment_number integer,
  due_date date,
  amount numeric,
  status text,
  payment_date timestamptz,
  event_type text NOT NULL,
  notes text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.payment_history TO authenticated;
GRANT ALL ON public.payment_history TO service_role;

ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff read history" ON public.payment_history;
CREATE POLICY "staff read history" ON public.payment_history
  FOR SELECT TO authenticated
  USING (internal.has_role(auth.uid(),'admin') OR internal.has_role(auth.uid(),'consultor'));

DROP POLICY IF EXISTS "cliente read own history" ON public.payment_history;
CREATE POLICY "cliente read own history" ON public.payment_history
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.cartas c JOIN public.profiles p ON p.id = c.cliente_id
    WHERE c.id = payment_history.carta_id AND p.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "staff insert history" ON public.payment_history;
CREATE POLICY "staff insert history" ON public.payment_history
  FOR INSERT TO authenticated
  WITH CHECK (internal.has_role(auth.uid(),'admin') OR internal.has_role(auth.uid(),'consultor'));

CREATE OR REPLACE FUNCTION public.block_history_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.cartas c WHERE c.id = OLD.carta_id) THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'Histórico de pagamentos não pode ser excluído.';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.block_history_delete() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_block_history_delete ON public.payment_history;
CREATE TRIGGER trg_block_history_delete
  BEFORE DELETE ON public.payment_history
  FOR EACH ROW EXECUTE FUNCTION public.block_history_delete();

CREATE INDEX IF NOT EXISTS idx_payment_history_carta ON public.payment_history(carta_id, created_at DESC);

-- 13. Modelos de carta
CREATE TABLE IF NOT EXISTS public.carta_modelos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  administradora text,
  valor_bem numeric NOT NULL,
  parcelas_totais integer NOT NULL,
  percentual_administrativo numeric NOT NULL DEFAULT 12,
  descricao text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.carta_modelos TO authenticated;
GRANT ALL ON public.carta_modelos TO service_role;

ALTER TABLE public.carta_modelos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff manage modelos" ON public.carta_modelos;
CREATE POLICY "staff manage modelos" ON public.carta_modelos
  FOR ALL TO authenticated
  USING (internal.has_role(auth.uid(),'admin') OR internal.has_role(auth.uid(),'consultor'))
  WITH CHECK (internal.has_role(auth.uid(),'admin') OR internal.has_role(auth.uid(),'consultor'));

DROP TRIGGER IF EXISTS update_carta_modelos_updated_at ON public.carta_modelos;
CREATE TRIGGER update_carta_modelos_updated_at
  BEFORE UPDATE ON public.carta_modelos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 14. Configurações do app
CREATE TABLE IF NOT EXISTS public.app_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.app_config TO authenticated;
GRANT SELECT ON public.app_config TO anon;
GRANT ALL ON public.app_config TO service_role;

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated read config" ON public.app_config;
CREATE POLICY "authenticated read config" ON public.app_config
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "anon read public config keys" ON public.app_config;
CREATE POLICY "anon read public config keys"
ON public.app_config FOR SELECT TO anon
USING (key IN ('whatsapp_numero', 'whatsapp_mensagem'));

INSERT INTO public.app_config(key, value) VALUES
  ('percentual_administrativo_padrao', '12'::jsonb),
  ('whatsapp_numero', '"551140966528"'::jsonb),
  ('whatsapp_mensagem', '"Olá! Vim pelo site da BBC Consórcios e gostaria de tirar uma dúvida sobre consórcio."'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 15. Leads do simulador
CREATE TABLE public.simulacao_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria TEXT NOT NULL,
  credito NUMERIC(14,2) NOT NULL,
  prazo INTEGER NOT NULL,
  parcela NUMERIC(14,2) NOT NULL,
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL,
  nascimento DATE,
  email TEXT NOT NULL,
  telefone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'novo',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.simulacao_leads TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.simulacao_leads TO authenticated;
GRANT ALL ON public.simulacao_leads TO service_role;

ALTER TABLE public.simulacao_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a validated lead"
ON public.simulacao_leads FOR INSERT TO anon, authenticated
WITH CHECK (
  length(btrim(nome)) BETWEEN 2 AND 120
  AND length(btrim(email)) BETWEEN 5 AND 255
  AND email ~* '^[A-Za-z0-9._%%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND length(regexp_replace(cpf, '\D', '', 'g')) = 11
  AND length(regexp_replace(telefone, '\D', '', 'g')) BETWEEN 10 AND 13
  AND length(btrim(categoria)) BETWEEN 2 AND 60
  AND credito > 0 AND credito <= 100000000
  AND prazo > 0 AND prazo <= 600
  AND parcela > 0 AND parcela <= 10000000
  AND (observacoes IS NULL OR length(observacoes) <= 2000)
  AND status = 'novo'
);

CREATE POLICY "Admins can manage leads"
  ON public.simulacao_leads
  FOR ALL
  TO authenticated
  USING (internal.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (internal.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Consultores can manage leads"
  ON public.simulacao_leads
  FOR ALL
  TO authenticated
  USING (internal.has_role(auth.uid(), 'consultor'::app_role))
  WITH CHECK (internal.has_role(auth.uid(), 'consultor'::app_role));

CREATE TRIGGER update_simulacao_leads_updated_at
  BEFORE UPDATE ON public.simulacao_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_simulacao_leads_created_at ON public.simulacao_leads (created_at DESC);

-- 16. documentos_ok
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS documentos_ok boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ALTER COLUMN documentos_ok SET DEFAULT false;
COMMENT ON COLUMN public.profiles.documentos_ok IS 'Indica que os documentos do cliente foram verificados pela equipe.';

-- 17. Usuário administrador inicial
DO $$
DECLARE
  admin_email text := 'bbc.ltda@admin.br';
  admin_password text := 'Limatada.cons1937@';
  admin_uid uuid;
BEGIN
  SELECT id INTO admin_uid FROM auth.users WHERE email = admin_email;

  IF admin_uid IS NULL THEN
    admin_uid := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      admin_uid, 'authenticated', 'authenticated', admin_email,
      crypt(admin_password, gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Administrador BBC"}'::jsonb,
      '', '', '', ''
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), admin_uid,
      jsonb_build_object('sub', admin_uid::text, 'email', admin_email, 'email_verified', true),
      'email', admin_uid::text, now(), now(), now()
    );
  END IF;

  INSERT INTO public.profiles (user_id, email, name, status)
  VALUES (admin_uid, admin_email, 'Administrador BBC', 'ativo')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_uid, 'admin'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;

-- 18. Políticas de storage para documentos dos clientes
DROP POLICY IF EXISTS "Clientes podem ler seus documentos" ON storage.objects;
CREATE POLICY "Clientes podem ler seus documentos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'client-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Clientes podem enviar seus documentos" ON storage.objects;
CREATE POLICY "Clientes podem enviar seus documentos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'client-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Clientes podem atualizar seus documentos" ON storage.objects;
CREATE POLICY "Clientes podem atualizar seus documentos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'client-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Clientes podem excluir seus documentos" ON storage.objects;
CREATE POLICY "Clientes podem excluir seus documentos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'client-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Staff pode ler documentos dos clientes" ON storage.objects;
CREATE POLICY "Staff pode ler documentos dos clientes"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'client-documents'
    AND (
      internal.has_role(auth.uid(), 'admin'::app_role)
      OR internal.has_role(auth.uid(), 'consultor'::app_role)
    )
  );

NOTIFY pgrst, 'reload schema';