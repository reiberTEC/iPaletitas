-- El panel no asume que el negocio sea una paletería.
-- ninguna: el inicio habla del negocio. pali: muestra a Pali.

ALTER TABLE cuentas
  ADD COLUMN IF NOT EXISTS mascota_panel text NOT NULL DEFAULT 'ninguna';

ALTER TABLE cuentas DROP CONSTRAINT IF EXISTS cuentas_mascota_panel_chk;

ALTER TABLE cuentas
  ADD CONSTRAINT cuentas_mascota_panel_chk
  CHECK (mascota_panel IN ('ninguna', 'pali', 'cafe'));
