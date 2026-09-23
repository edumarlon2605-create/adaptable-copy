ALTER TABLE public.profiles
ADD COLUMN administrator_cpf text;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_administrator_cpf_format_check
CHECK (
  administrator_cpf IS NULL
  OR administrator_cpf ~ '^[0-9]{11}$'
) NOT VALID;

COMMENT ON COLUMN public.profiles.administrator_cpf IS 'CPF do administrador ou responsável legal da pessoa jurídica.';