-- Cierra los cupos que estaban en NULL (ilimitado). NULL en planes significa sin tope.

UPDATE planes SET
  limite_productos = 1000,
  incluye = ARRAY[
    'Hasta 2 sucursales',
    'Hasta 5 usuarios',
    'Hasta 1,000 productos',
    'Anticipos en el punto de venta',
    'Alertas de stock bajo y por caducar',
    'Historial de ventas de 12 meses',
    'Soporte por correo'
  ]
WHERE id = 'doble';

UPDATE planes SET limite_productos = 3000 WHERE id = 'doble-especial';

UPDATE planes SET
  lema = 'El cupo más alto, cerrado para no dejar crecer la base sin tope.',
  limite_sucursales = 20,
  limite_usuarios = 60,
  limite_productos = 5000,
  historial_meses = 36,
  incluye = ARRAY[
    'Hasta 20 sucursales',
    'Hasta 60 usuarios',
    'Hasta 5,000 productos',
    'Historial de ventas de 36 meses',
    'Misma app de mostrador: POS, inventario y caducados',
    'Soporte prioritario por correo'
  ]
WHERE id = 'especial-super';
