-- Punto 7: tokens para recuperar / definir contraseña.
-- Pagos: ids de Stripe para renovaciones (Subscription).

CREATE TABLE IF NOT EXISTS password_tokens (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id   uuid REFERENCES usuarios (id) ON DELETE CASCADE,
  staff_id     uuid REFERENCES staff (id) ON DELETE CASCADE,
  token_hash   text NOT NULL,
  proposito    text NOT NULL CHECK (proposito IN ('recuperar', 'invitar')),
  vence        timestamptz NOT NULL,
  usado_en     timestamptz,
  creado_en    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT password_tokens_sujeto_chk CHECK (
    (usuario_id IS NOT NULL AND staff_id IS NULL)
    OR (usuario_id IS NULL AND staff_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS password_tokens_hash_idx ON password_tokens (token_hash)
  WHERE usado_en IS NULL;
CREATE INDEX IF NOT EXISTS password_tokens_usuario_idx ON password_tokens (usuario_id)
  WHERE usado_en IS NULL;

ALTER TABLE cuentas
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

CREATE UNIQUE INDEX IF NOT EXISTS cuentas_stripe_customer_idx
  ON cuentas (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS cuentas_stripe_subscription_idx
  ON cuentas (stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

COMMENT ON TABLE password_tokens IS 'Tokens de un solo uso para recuperar o invitar a definir contraseña.';
COMMENT ON COLUMN cuentas.stripe_customer_id IS 'Customer de Stripe (suscripción recurrente).';
COMMENT ON COLUMN cuentas.stripe_subscription_id IS 'Subscription de Stripe activa o reciente.';
