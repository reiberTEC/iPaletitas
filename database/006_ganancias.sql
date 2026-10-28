-- Ganancias: permiso solo para Administrador / titular.
-- Añade ganancias.* a administradores que aún no lo tienen.

UPDATE usuarios
SET permisos = (
  SELECT ARRAY(
    SELECT DISTINCT p
    FROM unnest(
      COALESCE(permisos, ARRAY[]::text[])
      || ARRAY[
        'ganancias.ver',
        'ganancias.crear',
        'ganancias.editar',
        'ganancias.eliminar'
      ]
    ) AS p
  )
)
WHERE rol = 'Administrador'
  AND NOT ('ganancias.ver' = ANY(COALESCE(permisos, ARRAY[]::text[])));
