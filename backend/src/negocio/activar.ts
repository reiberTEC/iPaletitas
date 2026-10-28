import type pg from 'pg'
import { PERMISOS_ADMIN } from '../auth/permisos.ts'
import { pool } from '../db.ts'

function hace(dias: number) {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return d.toLocaleDateString('en-CA')
}

export interface DatosActivacion {
  negocio: string
  giro: string
  telefono: string
  sucursal: string
  planId: string
  ciclo: 'mensual' | 'anual'
  tarjeta: { marca: string; ultimos4: string; vence: string; titular: string }
  facturacion: { pais: string; estado: string; direccion: string; codigoPostal: string }
}

export async function activarCuenta(
  cuentaId: string,
  usuarioId: string,
  correo: string,
  nombre: string,
  datos: DatosActivacion,
) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const cuenta = await client.query<{
      prueba_usada: boolean
      clave_licencia: string
      negocio: string
    }>(`SELECT prueba_usada, clave_licencia, negocio FROM cuentas WHERE id = $1 FOR UPDATE`, [cuentaId])
    const c = cuenta.rows[0]
    if (!c) throw new Error('cuenta_no_encontrada')
    if (c.negocio?.trim()) throw new Error('ya_activada')

    const inicio = new Date()
    const vence = new Date(inicio)
    vence.setMonth(vence.getMonth() + (datos.ciclo === 'anual' ? 12 : 1))
    const garantia = c.prueba_usada ? null : new Date(inicio.getTime() + 7 * 86_400_000)

    await client.query(
      `UPDATE cuentas SET
         negocio = $2, giro = $3, telefono = $4,
         plan_id = $5::plan_id, ciclo = $6::ciclo_pago,
         inicio = $7, vence = $8, en_prueba = false, suspendida = false, cancelada = false,
         prueba_usada = true, tutorial_pendiente = true, garantia_hasta = $9,
         fact_pais = $10, fact_estado = $11, fact_direccion = $12, fact_codigo_postal = $13,
         actualizado_en = now()
       WHERE id = $1`,
      [
        cuentaId,
        datos.negocio.trim(),
        datos.giro.trim(),
        datos.telefono.trim(),
        datos.planId,
        datos.ciclo,
        inicio.toISOString(),
        vence.toISOString(),
        garantia?.toISOString() ?? null,
        datos.facturacion.pais || 'México',
        datos.facturacion.estado,
        datos.facturacion.direccion,
        datos.facturacion.codigoPostal,
      ],
    )

    await client.query(`DELETE FROM medios_pago WHERE cuenta_id = $1`, [cuentaId])
    await client.query(
      `INSERT INTO medios_pago (cuenta_id, marca, ultimos4, vence, titular)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        cuentaId,
        datos.tarjeta.marca,
        datos.tarjeta.ultimos4,
        datos.tarjeta.vence,
        datos.tarjeta.titular,
      ],
    )

    let sucursalId: string
    const sucExistente = await client.query<{ id: string }>(
      `SELECT id FROM sucursales WHERE cuenta_id = $1 ORDER BY creado_en LIMIT 1`,
      [cuentaId],
    )
    if (sucExistente.rows[0]) {
      sucursalId = sucExistente.rows[0].id
      await client.query(
        `UPDATE sucursales SET nombre = $2, direccion = 'Dirección por definir' WHERE id = $1`,
        [sucursalId, datos.sucursal.trim() || 'Matriz'],
      )
    } else {
      const s = await client.query<{ id: string }>(
        `INSERT INTO sucursales (cuenta_id, nombre, direccion)
         VALUES ($1, $2, 'Dirección por definir') RETURNING id`,
        [cuentaId, datos.sucursal.trim() || 'Matriz'],
      )
      sucursalId = s.rows[0]!.id
    }

    await client.query(
      `UPDATE usuarios SET
         nombre = $2, telefono = $3, puesto = 'Dueño del negocio',
         rol = 'Administrador', sucursal_id = $4, activo = true, permisos = $5::text[],
         actualizado_en = now()
       WHERE id = $1`,
      [usuarioId, nombre, datos.telefono.replace(/\D/g, ''), sucursalId, [...PERMISOS_ADMIN]],
    )

    await sembrarDemo(client, cuentaId, sucursalId, nombre)

    await client.query(
      `INSERT INTO bitacora (autor, accion, detalle, cuenta_id)
       VALUES ($1, 'Activó su licencia', $2, $3)`,
      [correo, `${datos.negocio} · plan ${datos.planId}`, cuentaId],
    )

    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

async function sembrarDemo(
  client: pg.PoolClient,
  cuentaId: string,
  sucursalId: string,
  nombreCajeroDemo: string,
) {
  // Solo catálogo y ventas de ejemplo. El equipo lo arma el dueño en Usuarios.
  const cajeroDemo = nombreCajeroDemo.trim() || 'Administrador'

  const catalogo: [string, string, number, number, number, string | null][] = [
    ['Paleta de mango', 'Paletas de agua', 18, 7, 12, hace(-3)],
    ['Paleta de chocolate', 'Paletas de leche', 22, 9, 6, hace(20)],
    ['Agua de horchata 1 L', 'Aguas frescas', 30, 11, 24, hace(4)],
  ]

  const productos: { id: string; nombre: string; precio: number }[] = []
  for (let i = 0; i < catalogo.length; i++) {
    const [nombre, categoria, precio, costo, existencia, caducidad] = catalogo[i]!
    const p = await client.query<{ id: string }>(
      `INSERT INTO productos (
         cuenta_id, sku, nombre, categoria, precio, costo, stock_minimo, caducidad
       ) VALUES ($1, $2, $3, $4, $5, $6, 10, $7::date)
       RETURNING id`,
      [
        cuentaId,
        `PAL-${String(i + 1).padStart(3, '0')}`,
        nombre,
        categoria,
        precio,
        costo,
        caducidad,
      ],
    )
    const id = p.rows[0]!.id
    await client.query(
      `INSERT INTO existencias (producto_id, sucursal_id, cantidad) VALUES ($1, $2, $3)`,
      [id, sucursalId, existencia],
    )
    productos.push({ id, nombre, precio })
  }

  const metodos = ['Efectivo', 'Tarjeta', 'Transferencia'] as const
  let folio = 1001
  for (let dia = 6; dia >= 0; dia--) {
    const tickets = 3 + ((dia * 7) % 5)
    for (let t = 0; t < tickets; t++) {
      const fecha = new Date()
      fecha.setDate(fecha.getDate() - dia)
      fecha.setHours(10 + t, (t * 17) % 60, 0, 0)
      if (fecha.getTime() > Date.now()) continue

      const a = productos[(dia + t) % productos.length]!
      const b = productos[(dia + t * 3 + 1) % productos.length]!
      const partidas = [{ id: a.id, nombre: a.nombre, cantidad: 1 + (t % 3), precio: a.precio }]
      if (b.id !== a.id) partidas.push({ id: b.id, nombre: b.nombre, cantidad: 1, precio: b.precio })
      const total = partidas.reduce((s, p) => s + p.precio * p.cantidad, 0)

      const v = await client.query<{ id: string }>(
        `INSERT INTO ventas (
           cuenta_id, sucursal_id, folio, fecha, cajero_nombre, metodo_pago, total, recibido
         ) VALUES ($1, $2, $3, $4, $5, $6::metodo_pago_venta, $7, $7)
         RETURNING id`,
        [cuentaId, sucursalId, folio++, fecha.toISOString(), cajeroDemo, metodos[t % metodos.length], total],
      )
      for (const p of partidas) {
        await client.query(
          `INSERT INTO venta_partidas (venta_id, producto_id, nombre, cantidad, precio)
           VALUES ($1, $2, $3, $4, $5)`,
          [v.rows[0]!.id, p.id, p.nombre, p.cantidad, p.precio],
        )
      }
    }
  }

  await client.query(`UPDATE cuentas SET folio_venta = $2 WHERE id = $1`, [cuentaId, folio])
}
