-- Ambiente visual del panel (Mi marca): clásico, tinte o vivo.

ALTER TABLE cuentas
  ADD COLUMN IF NOT EXISTS ambiente_marca text NOT NULL DEFAULT 'clasico';

ALTER TABLE cuentas DROP CONSTRAINT IF EXISTS cuentas_ambiente_marca_chk;
ALTER TABLE cuentas
  ADD CONSTRAINT cuentas_ambiente_marca_chk
  CHECK (ambiente_marca IN ('clasico', 'tinte', 'vivo'));

COMMENT ON COLUMN cuentas.ambiente_marca IS 'clasico = solo acentos; tinte = fondos suaves; vivo = entorno completo con el color de marca.';
