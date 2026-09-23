CREATE TABLE public.payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carta_id uuid NOT NULL REFERENCES public.cartas(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'cancelado')),
  requested_by uuid NOT NULL,
  requested_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_by uuid,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.payment_requests TO authenticated;
GRANT ALL ON public.payment_requests TO service_role;

ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff read payment requests"
ON public.payment_requests
FOR SELECT TO authenticated
USING (internal.has_role(auth.uid(), 'admin'::public.app_role) OR internal.has_role(auth.uid(), 'consultor'::public.app_role));

CREATE POLICY "staff insert payment requests"
ON public.payment_requests
FOR INSERT TO authenticated
WITH CHECK ((internal.has_role(auth.uid(), 'admin'::public.app_role) OR internal.has_role(auth.uid(), 'consultor'::public.app_role)) AND requested_by = auth.uid());

CREATE POLICY "staff update payment requests"
ON public.payment_requests
FOR UPDATE TO authenticated
USING (internal.has_role(auth.uid(), 'admin'::public.app_role) OR internal.has_role(auth.uid(), 'consultor'::public.app_role))
WITH CHECK (internal.has_role(auth.uid(), 'admin'::public.app_role) OR internal.has_role(auth.uid(), 'consultor'::public.app_role));

CREATE POLICY "clients read own payment requests"
ON public.payment_requests
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1
  FROM public.cartas c
  JOIN public.profiles p ON p.id = c.cliente_id
  WHERE c.id = payment_requests.carta_id AND p.user_id = auth.uid()
));

CREATE UNIQUE INDEX payment_requests_one_pending_per_carta
ON public.payment_requests (carta_id)
WHERE status = 'pendente';

CREATE INDEX payment_requests_carta_requested_idx
ON public.payment_requests (carta_id, requested_at DESC);

CREATE TRIGGER update_payment_requests_updated_at
BEFORE UPDATE ON public.payment_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();