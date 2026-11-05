-- Baja a la cajera demo "Laura Méndez" si sigue activa (cuentas ya activadas).
UPDATE usuarios
SET activo = false, actualizado_en = now()
WHERE activo
  AND nombre = 'Laura Méndez'
  AND correo LIKE 'laura.%@ejemplo.com';
