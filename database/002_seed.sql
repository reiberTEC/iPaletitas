-- Semilla: planes, cupones y un usuario staff de desarrollo.
-- Contraseña local del staff: ipaletitas-dev  (cámbiala en producción)

INSERT INTO planes (
  id, nombre, lema, precio_mensual, acento, acento_oscuro, incluye_de, destacado,
  limite_sucursales, limite_usuarios, limite_productos, historial_meses, incluye
) VALUES
  (
    'basica',
    'Básica',
    'Para la paletería que va empezando.',
    199,
    '#10b981',
    NULL,
    NULL,
    false,
    1, 2, 50, 3,
    ARRAY[
      '1 sucursal',
      'Hasta 2 usuarios',
      'Punto de venta para registrar tus ventas',
      'Catálogo de hasta 50 productos',
      'Control de inventario básico',
      'Reporte diario de ventas',
      'Soporte por correo'
    ]
  ),
  (
    'doble',
    'Doble',
    'Para negocios que ya despegaron.',
    399,
    '#3b82f6',
    NULL,
    'basica',
    false,
    2, 5, NULL, 12,
    ARRAY[
      'Hasta 2 sucursales',
      'Hasta 5 usuarios',
      'Productos ilimitados',
      'Recetario digital vinculado al inventario',
      'Alertas de stock bajo',
      'Reportes semanales y mensuales',
      'Soporte por chat'
    ]
  ),
  (
    'doble-especial',
    'Doble Especial',
    'Para crecer con varias sucursales y equipo.',
    699,
    '#7c3aed',
    NULL,
    'doble',
    true,
    5, 15, NULL, 24,
    ARRAY[
      'Hasta 5 sucursales',
      'Hasta 15 usuarios',
      'Gestión de empleados con roles y permisos',
      'Control de insumos y producción por lotes',
      'Dashboards con gráficas en tiempo real',
      'Exporta reportes a Excel y PDF',
      'Soporte prioritario'
    ]
  ),
  (
    'especial-super',
    'Especial Super',
    'Todo iPaletitas, sin límites.',
    1199,
    '#f59e0b',
    '#93c5fd',
    'doble-especial',
    false,
    NULL, NULL, NULL, NULL,
    ARRAY[
      'Sucursales y usuarios ilimitados',
      'Pronóstico de demanda por temporada',
      'Programa de lealtad para tus clientes',
      'Facturación electrónica (CFDI) integrada',
      'API e integraciones con otras plataformas',
      'Asesor dedicado y soporte 24/7'
    ]
  )
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  lema = EXCLUDED.lema,
  precio_mensual = EXCLUDED.precio_mensual,
  acento = EXCLUDED.acento,
  acento_oscuro = EXCLUDED.acento_oscuro,
  incluye_de = EXCLUDED.incluye_de,
  destacado = EXCLUDED.destacado,
  limite_sucursales = EXCLUDED.limite_sucursales,
  limite_usuarios = EXCLUDED.limite_usuarios,
  limite_productos = EXCLUDED.limite_productos,
  historial_meses = EXCLUDED.historial_meses,
  incluye = EXCLUDED.incluye;

INSERT INTO cupones (codigo, porcentaje, descripcion, activo) VALUES
  ('PALETA10', 10, '10% en tu primer pago', true),
  ('BIENVENIDA15', 15, '15% de bienvenida en tu primer pago', true)
ON CONFLICT (codigo) DO UPDATE SET
  porcentaje = EXCLUDED.porcentaje,
  descripcion = EXCLUDED.descripcion,
  activo = EXCLUDED.activo;

-- Hash con pgcrypto (bcrypt). Contraseña: ipaletitas-dev
INSERT INTO staff (correo, nombre, password_hash, activo)
SELECT
  'admin@ipaletitas.com',
  'Admin iPaletitas',
  crypt('ipaletitas-dev', gen_salt('bf')),
  true
WHERE NOT EXISTS (
  SELECT 1 FROM staff WHERE lower(correo) = 'admin@ipaletitas.com'
);
