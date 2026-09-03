ALTER TABLE public.profiles
  ALTER COLUMN documentos_ok SET DEFAULT false;

COMMENT ON COLUMN public.profiles.documentos_ok IS 'Indica que os documentos do cliente foram verificados pela equipe.';