-- Icono elegido por producto (Mi marca / catálogo).

ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS icono text NOT NULL DEFAULT '';

COMMENT ON COLUMN productos.icono IS 'Id de icono del catálogo frontend (paleta, comida, cafe…). Vacío = según Mi marca / categoría.';
