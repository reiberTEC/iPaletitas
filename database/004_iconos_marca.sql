-- Estilo de iconos del panel (Mi marca): paletas de iPaletitas o iconos genéricos.

ALTER TABLE cuentas
  ADD COLUMN IF NOT EXISTS iconos_estilo text NOT NULL DEFAULT 'paleta';

ALTER TABLE cuentas DROP CONSTRAINT IF EXISTS cuentas_iconos_estilo_chk;
ALTER TABLE cuentas
  ADD CONSTRAINT cuentas_iconos_estilo_chk
  CHECK (iconos_estilo IN ('paleta', 'genericos'));

COMMENT ON COLUMN cuentas.iconos_estilo IS 'paleta = PaletaIcon; genericos = iconos Lucide (mejor para otros giros).';
