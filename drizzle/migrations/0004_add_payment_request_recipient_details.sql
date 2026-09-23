ALTER TABLE public.payment_requests
  ADD COLUMN recipient_name text,
  ADD COLUMN recipient_document text,
  ADD COLUMN bank_name text,
  ADD COLUMN bank_agency text,
  ADD COLUMN bank_account text,
  ADD COLUMN bank_account_type text,
  ADD COLUMN bank_account_holder text;

ALTER TABLE public.payment_requests
  ADD CONSTRAINT payment_requests_recipient_name_length CHECK (recipient_name IS NULL OR char_length(btrim(recipient_name)) BETWEEN 2 AND 150) NOT VALID,
  ADD CONSTRAINT payment_requests_recipient_document_length CHECK (recipient_document IS NULL OR char_length(regexp_replace(recipient_document, '\D', '', 'g')) IN (11, 14)) NOT VALID,
  ADD CONSTRAINT payment_requests_bank_name_length CHECK (bank_name IS NULL OR char_length(btrim(bank_name)) BETWEEN 2 AND 100) NOT VALID,
  ADD CONSTRAINT payment_requests_bank_agency_length CHECK (bank_agency IS NULL OR char_length(btrim(bank_agency)) BETWEEN 1 AND 20) NOT VALID,
  ADD CONSTRAINT payment_requests_bank_account_length CHECK (bank_account IS NULL OR char_length(btrim(bank_account)) BETWEEN 1 AND 30) NOT VALID,
  ADD CONSTRAINT payment_requests_bank_account_type_values CHECK (bank_account_type IS NULL OR bank_account_type IN ('corrente', 'poupanca', 'pagamento')) NOT VALID,
  ADD CONSTRAINT payment_requests_bank_account_holder_length CHECK (bank_account_holder IS NULL OR char_length(btrim(bank_account_holder)) BETWEEN 2 AND 150) NOT VALID;