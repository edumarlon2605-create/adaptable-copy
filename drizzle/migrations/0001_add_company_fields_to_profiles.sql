ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS person_type TEXT NOT NULL DEFAULT 'cpf',
  ADD COLUMN IF NOT EXISTS cnpj TEXT,
  ADD COLUMN IF NOT EXISTS cnae TEXT,
  ADD COLUMN IF NOT EXISTS corporate_name TEXT;

UPDATE public.profiles
SET person_type = 'cpf'
WHERE person_type IS NULL OR person_type NOT IN ('cpf', 'cnpj');

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_person_type_check
  CHECK (person_type IN ('cpf', 'cnpj')) NOT VALID;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_cnpj_key
ON public.profiles(cnpj)
WHERE cnpj IS NOT NULL;

COMMENT ON COLUMN public.profiles.person_type IS 'Tipo de cliente: cpf para pessoa física ou cnpj para pessoa jurídica.';
COMMENT ON COLUMN public.profiles.cnpj IS 'CNPJ normalizado, contendo apenas 14 dígitos.';
COMMENT ON COLUMN public.profiles.cnae IS 'Código CNAE da empresa.';
COMMENT ON COLUMN public.profiles.corporate_name IS 'Razão social da empresa.';