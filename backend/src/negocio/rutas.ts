import type { IncomingMessage, ServerResponse } from 'node:http'
import { exigirUsuario } from '../auth/sesion.ts'
import { pool, query } from '../db.ts'
import { error, json, leerJson } from '../http.ts'
import { activarCuenta, type DatosActivacion } from './activar.ts'
import { snapshotNegocio } from './snapshot.ts'

type Cuerpo = Record<string, unknown>

async function cuerpo(req: IncomingMessage, res: ServerResponse): Promise<Cuerpo | null> {
  try {
    return (await leerJson(req)) as Cuerpo
  } catch (e) {
    error(
      res,
      400,
      e instanceof Error && e.message === 'cuerpo_grande' ? 'Petición demasiado grande.' : 'JSON inválido.',
    )
    return null
  }
}

async function responderSnapshot(
  res: ServerResponse,
  cuentaId: string,
  correo: string,
  codigo = 200,
) {
  const snap = await snapshotNegocio(cuentaId, correo)
  json(res, codigo, snap)
}

function str(v: unknown, max = 200) {
  return typeof v === 'string' ? v.trim().slice(0, max) : ''
}

function num(v: unknown) {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : NaN
}

export async function manejarNegocio(req: IncomingMessage, res: ServerResponse, ruta: string) {
  const sesion = await exigirUsuario(req, res)
  if (!sesion) return

  const metodo = req.method ?? 'GET'

  if (metodo === 'GET' && ruta === '/api/negocio') {
    return responderSnapshot(res, sesion.cuentaId, sesion.correo)
  }

  if (metodo === 'POST' && ruta === '/api/negocio/activar') {
    const datos = await cuerpo(req, res)
    if (!datos) return
    const planId = str(datos.planId) || 'basica'
    const ciclo = str(datos.ciclo) === 'anual' ? 'anual' : 'mensual'
    const tarjeta = (datos.tarjeta ?? {}) as Cuerpo
    const fact = (datos.facturacion ?? {}) as Cuerpo
    const payload: DatosActivacion = {
      negocio: str(datos.negocio, 120),
      giro: str(datos.giro, 80),
      telefono: str(datos.telefono, 40),
      sucursal: str(datos.sucursal, 80),
      planId,
      ciclo,
      tarjeta: {
        marca: str(tarjeta.marca, 40) || 'Tarjeta',
        ultimos4: str(tarjeta.ultimos4, 4),
        vence: str(tarjeta.vence, 7),
        titular: str(tarjeta.titular, 120),
      },
      facturacion: {
        pais: str(fact.pais, 60) || 'México',
        estado: str(fact.estado, 60),
        direccion: str(fact.direccion, 200),
        codigoPostal: str(fact.codigoPostal, 12),
      },
    }
    if (!payload.negocio) return error(res, 400, 'El nombre del negocio es obligatorio.')
    try {
      await activarCuenta(sesion.cuentaId, sesion.id, sesion.correo, sesion.nombre, payload)
      return responderSnapshot(res, sesion.cuentaId, sesion.correo)
    } catch (e) {
      if (e instanceof Error && e.message === 'ya_activada') {
        return error(res, 409, 'Esta cuenta ya tiene licencia activa.')
      }
      console.error(e)
      return error(res, 500, 'No se pudo activar la licencia.')
    }
  }

  if (metodo === 'POST' && ruta === '/api/negocio/tutorial/terminar') {
    await query(`UPDATE cuentas SET tutorial_pendiente = false WHERE id = $1`, [sesion.cuentaId])
    return responderSnapshot(res, sesion.cuentaId, sesion.correo)
  }

  if (metodo === 'PUT' && ruta === '/api/negocio/marca') {
    const datos = await cuerpo(req, res)
    if (!datos) return
    await query(`UPDATE cuentas SET logo_url = $2, color_marca = $3, actualizado_en = now() WHERE id = $1`, [
      sesion.cuentaId,
      typeof datos.logo === 'string' ? datos.logo : null,
      typeof datos.color === 'string' ? datos.color : null,
    ])
    return responderSnapshot(res, sesion.cuentaId, sesion.correo)
  }

  if (metodo === 'DELETE' && ruta === '/api/negocio/marca') {
    await query(`UPDATE cuentas SET logo_url = null, color_marca = null, actualizado_en = now() WHERE id = $1`, [
      sesion.cuentaId,
    ])
    return responderSnapshot(res, sesion.cuentaId, sesion.correo)
  }

  if (metodo === 'PUT' && ruta === '/api/negocio/plan') {
    const datos = await cuerpo(req, res)
    if (!datos) return
    const planId = str(datos.planId)
    const ciclo = str(datos.ciclo) === 'anual' ? 'anual' : 'mensual'
    if (!planId) return error(res, 400, 'Plan inválido.')
    await query(
      `UPDATE cuentas SET plan_id = $2::plan_id, ciclo = $3::ciclo_pago, actualizado_en = now() WHERE id = $1`,
      [sesion.cuentaId, planId, ciclo],
    )
    return responderSnapshot(res, sesion.cuentaId, sesion.correo)
  }

  if (metodo === 'PUT' && ruta === '/api/negocio/sucursal-activa') {
    const datos = await cuerpo(req, res)
    if (!datos) return
    const id = str(datos.id, 40)
    const ok = await query(
      `SELECT 1 FROM sucursales WHERE id = $1 AND cuenta_id = $2 AND activa`,
      [id, sesion.cuentaId],
    )
    if (!ok.rowCount) return error(res, 404, 'Sucursal no encontrada.')
    // Solo persistimos preferencia en el usuario si no es admin/titular fijo; el cliente también la guarda.
    await query(`UPDATE usuarios SET sucursal_id = $2 WHERE id = $1`, [sesion.id, id])
    return responderSnapshot(res, sesion.cuentaId, sesion.correo)
  }

  // ---- Productos ----
  if (metodo === 'POST' && ruta === '/api/negocio/productos') {
    const datos = await cuerpo(req, res)
    if (!datos) return
    return crearProducto(res, sesion, datos)
  }

  const matchProducto = ruta.match(/^\/api\/negocio\/productos\/([^/]+)$/)
  if (matchProducto) {
    const id = matchProducto[1]!
    if (metodo === 'PUT') {
      const datos = await cuerpo(req, res)
      if (!datos) return
      return actualizarProducto(res, sesion, id, datos)
    }
    if (metodo === 'DELETE') {
      await query(
        `UPDATE productos SET activo = false, actualizado_en = now()
         WHERE id = $1 AND cuenta_id = $2`,
        [id, sesion.cuentaId],
      )
      return responderSnapshot(res, sesion.cuentaId, sesion.correo)
    }
  }

  // ---- Entradas / pérdidas / ventas ----
  if (metodo === 'POST' && ruta === '/api/negocio/entradas') {
    const datos = await cuerpo(req, res)
    if (!datos) return
    return registrarEntrada(res, sesion, datos)
  }
  if (metodo === 'POST' && ruta === '/api/negocio/perdidas') {
    const datos = await cuerpo(req, res)
    if (!datos) return
    return registrarPerdida(res, sesion, datos)
  }
  if (metodo === 'POST' && ruta === '/api/negocio/ventas') {
    const datos = await cuerpo(req, res)
    if (!datos) return
    return registrarVenta(res, sesion, datos)
  }
  const matchAbono = ruta.match(/^\/api\/negocio\/ventas\/([^/]+)\/abonar$/)
  if (matchAbono && metodo === 'POST') {
    const datos = await cuerpo(req, res)
    if (!datos) return
    return abonar(res, sesion, matchAbono[1]!, datos)
  }

  // ---- Usuarios ----
  if (metodo === 'POST' && ruta === '/api/negocio/usuarios') {
    const datos = await cuerpo(req, res)
    if (!datos) return
    return crearUsuario(res, sesion, datos)
  }
  const matchUsuario = ruta.match(/^\/api\/negocio\/usuarios\/([^/]+)$/)
  if (matchUsuario) {
    const id = matchUsuario[1]!
    if (metodo === 'PUT') {
      const datos = await cuerpo(req, res)
      if (!datos) return
      return actualizarUsuario(res, sesion, id, datos)
    }
    if (metodo === 'DELETE') {
      // Baja lógica: queda en historial (activo = false) y libera cupo del plan.
      await query(
        `UPDATE usuarios SET activo = false, actualizado_en = now()
         WHERE id = $1 AND cuenta_id = $2
           AND lower(correo) <> (SELECT lower(titular_correo) FROM cuentas WHERE id = $2)`,
        [id, sesion.cuentaId],
      )
      return responderSnapshot(res, sesion.cuentaId, sesion.correo)
    }
  }

  const matchInvitar = ruta.match(/^\/api\/negocio\/usuarios\/([^/]+)\/invitar$/)
  if (matchInvitar && metodo === 'POST') {
    const id = matchInvitar[1]!
    const u = await query<{ id: string; correo: string }>(
      `SELECT id, correo FROM usuarios WHERE id = $1 AND cuenta_id = $2 AND activo LIMIT 1`,
      [id, sesion.cuentaId],
    )
    if (!u.rows[0]) return error(res, 404, 'Usuario no encontrado.')
    const { crearTokenPassword } = await import('../auth/password.ts')
    const { enlace } = await crearTokenPassword({ usuarioId: u.rows[0].id, proposito: 'invitar' })
    console.log(`[auth] Enlace invitar (${u.rows[0].correo}): ${enlace}`)
    const snap = await snapshotNegocio(sesion.cuentaId, sesion.correo)
    return json(res, 200, { ...snap, enlaceInvitacion: enlace })
  }

  const matchReactivar = ruta.match(/^\/api\/negocio\/usuarios\/([^/]+)\/reactivar$/)
  if (matchReactivar && metodo === 'POST') {
    const id = matchReactivar[1]!
    const cupo = await query<{ activos: string; limite: number | null }>(
      `SELECT
         (SELECT count(*)::text FROM usuarios WHERE cuenta_id = $1 AND activo) AS activos,
         (SELECT limite_usuarios FROM planes p JOIN cuentas c ON c.plan_id = p.id WHERE c.id = $1) AS limite`,
      [sesion.cuentaId],
    )
    const activos = Number(cupo.rows[0]?.activos ?? 0)
    const limite = cupo.rows[0]?.limite
    if (limite != null && activos >= limite) {
      return error(res, 409, 'Llegaste al límite de usuarios de tu plan. Mejora el plan o da de baja a alguien más.')
    }
    await query(
      `UPDATE usuarios SET activo = true, actualizado_en = now()
       WHERE id = $1 AND cuenta_id = $2`,
      [id, sesion.cuentaId],
    )
    return responderSnapshot(res, sesion.cuentaId, sesion.correo)
  }

  // ---- Sucursales ----
  if (metodo === 'POST' && ruta === '/api/negocio/sucursales') {
    const datos = await cuerpo(req, res)
    if (!datos) return
    const nombre = str(datos.nombre, 80)
    if (!nombre) return error(res, 400, 'El nombre de la sucursal es obligatorio.')
    await query(
      `INSERT INTO sucursales (cuenta_id, nombre, direccion) VALUES ($1, $2, $3)`,
      [sesion.cuentaId, nombre, str(datos.direccion, 200)],
    )
    return responderSnapshot(res, sesion.cuentaId, sesion.correo)
  }

  error(res, 404, 'Ruta no encontrada.')
}

async function sucursalActivaId(sesion: { id: string; cuentaId: string; sucursalId: string | null }) {
  if (sesion.sucursalId) return sesion.sucursalId
  const { rows } = await query<{ id: string }>(
    `SELECT id FROM sucursales WHERE cuenta_id = $1 AND activa ORDER BY creado_en LIMIT 1`,
    [sesion.cuentaId],
  )
  return rows[0]?.id ?? null
}

async function crearProducto(
  res: ServerResponse,
  sesion: { cuentaId: string; correo: string; id: string; sucursalId: string | null },
  datos: Cuerpo,
) {
  const sku = str(datos.sku, 40)
  const nombre = str(datos.nombre, 120)
  if (!sku || !nombre) return error(res, 400, 'SKU y nombre son obligatorios.')
  const sucursalId = await sucursalActivaId(sesion)
  if (!sucursalId) return error(res, 400, 'No hay sucursal activa.')

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const p = await client.query<{ id: string }>(
      `INSERT INTO productos (
         cuenta_id, sku, nombre, categoria, precio, costo, stock_minimo, caducidad
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, NULLIF($8, '')::date)
       RETURNING id`,
      [
        sesion.cuentaId,
        sku,
        nombre,
        str(datos.categoria, 80),
        num(datos.precio) || 0,
        num(datos.costo) || 0,
        Math.max(0, Math.floor(num(datos.stockMinimo) || 0)),
        str(datos.caducidad, 10),
      ],
    )
    const existencia = Math.max(0, Math.floor(num(datos.existenciaInicial) || 0))
    await client.query(
      `INSERT INTO existencias (producto_id, sucursal_id, cantidad) VALUES ($1, $2, $3)`,
      [p.rows[0]!.id, sucursalId, existencia],
    )
    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    console.error(e)
    return error(res, 409, 'No se pudo crear el producto (¿SKU duplicado?).')
  } finally {
    client.release()
  }
  return responderSnapshot(res, sesion.cuentaId, sesion.correo)
}

async function actualizarProducto(
  res: ServerResponse,
  sesion: { cuentaId: string; correo: string },
  id: string,
  datos: Cuerpo,
) {
  await query(
    `UPDATE productos SET
       sku = $3, nombre = $4, categoria = $5, precio = $6, costo = $7,
       stock_minimo = $8, caducidad = NULLIF($9, '')::date, actualizado_en = now()
     WHERE id = $1 AND cuenta_id = $2 AND activo`,
    [
      id,
      sesion.cuentaId,
      str(datos.sku, 40),
      str(datos.nombre, 120),
      str(datos.categoria, 80),
      num(datos.precio) || 0,
      num(datos.costo) || 0,
      Math.max(0, Math.floor(num(datos.stockMinimo) || 0)),
      str(datos.caducidad, 10),
    ],
  )
  return responderSnapshot(res, sesion.cuentaId, sesion.correo)
}

async function registrarEntrada(
  res: ServerResponse,
  sesion: { cuentaId: string; correo: string; id: string; sucursalId: string | null },
  datos: Cuerpo,
) {
  const productoId = str(datos.productoId, 40)
  const cantidad = Math.floor(num(datos.cantidad))
  const costo = num(datos.costoUnitario)
  const sucursalId = str(datos.sucursalId, 40) || (await sucursalActivaId(sesion))
  if (!productoId || !sucursalId || !(cantidad > 0) || !(costo >= 0)) {
    return error(res, 400, 'Datos de entrada incompletos.')
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const folioQ = await client.query<{ folio_entrada: number }>(
      `UPDATE cuentas SET folio_entrada = folio_entrada + 1
       WHERE id = $1 RETURNING folio_entrada - 1 AS folio_entrada`,
      [sesion.cuentaId],
    )
    const folio = folioQ.rows[0]!.folio_entrada
    await client.query(
      `INSERT INTO entradas (
         cuenta_id, sucursal_id, producto_id, folio, cantidad, costo_unitario,
         proveedor, nota, registrado_por
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        sesion.cuentaId,
        sucursalId,
        productoId,
        folio,
        cantidad,
        costo,
        str(datos.proveedor, 120),
        str(datos.nota, 300),
        sesion.id,
      ],
    )
    await client.query(
      `INSERT INTO existencias (producto_id, sucursal_id, cantidad) VALUES ($1, $2, $3)
       ON CONFLICT (producto_id, sucursal_id)
       DO UPDATE SET cantidad = existencias.cantidad + EXCLUDED.cantidad`,
      [productoId, sucursalId, cantidad],
    )
    await client.query(`UPDATE productos SET costo = $2, actualizado_en = now() WHERE id = $1`, [
      productoId,
      costo,
    ])
    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    console.error(e)
    return error(res, 500, 'No se pudo registrar la entrada.')
  } finally {
    client.release()
  }
  return responderSnapshot(res, sesion.cuentaId, sesion.correo)
}

async function registrarPerdida(
  res: ServerResponse,
  sesion: { cuentaId: string; correo: string; id: string; sucursalId: string | null },
  datos: Cuerpo,
) {
  const productoId = str(datos.productoId, 40)
  let cantidad = Math.floor(num(datos.cantidad))
  const sucursalId = str(datos.sucursalId, 40) || (await sucursalActivaId(sesion))
  const motivo = str(datos.motivo, 40) || 'Caducidad'
  if (!productoId || !sucursalId || !(cantidad > 0)) {
    return error(res, 400, 'Datos de pérdida incompletos.')
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const stockQ = await client.query<{ cantidad: number; costo: string }>(
      `SELECT e.cantidad, p.costo::text
       FROM existencias e JOIN productos p ON p.id = e.producto_id
       WHERE e.producto_id = $1 AND e.sucursal_id = $2 AND p.cuenta_id = $3
       FOR UPDATE OF e`,
      [productoId, sucursalId, sesion.cuentaId],
    )
    const stock = stockQ.rows[0]
    if (!stock) {
      await client.query('ROLLBACK')
      return error(res, 404, 'Producto sin existencias en esta sucursal.')
    }
    cantidad = Math.min(cantidad, stock.cantidad)
    if (cantidad <= 0) {
      await client.query('ROLLBACK')
      return error(res, 400, 'No hay existencias para dar de baja.')
    }

    const folioQ = await client.query<{ folio_perdida: number }>(
      `UPDATE cuentas SET folio_perdida = folio_perdida + 1
       WHERE id = $1 RETURNING folio_perdida - 1 AS folio_perdida`,
      [sesion.cuentaId],
    )
    await client.query(
      `INSERT INTO perdidas (
         cuenta_id, sucursal_id, producto_id, folio, cantidad, costo_unitario,
         motivo, nota, registrado_por
       ) VALUES ($1, $2, $3, $4, $5, $6, $7::motivo_perdida, $8, $9)`,
      [
        sesion.cuentaId,
        sucursalId,
        productoId,
        folioQ.rows[0]!.folio_perdida,
        cantidad,
        Number(stock.costo),
        motivo,
        str(datos.nota, 300),
        sesion.id,
      ],
    )
    await client.query(
      `UPDATE existencias SET cantidad = cantidad - $3
       WHERE producto_id = $1 AND sucursal_id = $2`,
      [productoId, sucursalId, cantidad],
    )
    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    console.error(e)
    return error(res, 500, 'No se pudo registrar la pérdida.')
  } finally {
    client.release()
  }
  return responderSnapshot(res, sesion.cuentaId, sesion.correo)
}

async function registrarVenta(
  res: ServerResponse,
  sesion: { cuentaId: string; correo: string; id: string; nombre: string; sucursalId: string | null },
  datos: Cuerpo,
) {
  const partidas = Array.isArray(datos.partidas) ? datos.partidas : []
  const metodoPago = str(datos.metodoPago, 20) || 'Efectivo'
  const recibido = num(datos.recibido)
  const sucursalId = str(datos.sucursalId, 40) || (await sucursalActivaId(sesion))
  const anticipo = datos.anticipo as Cuerpo | undefined
  if (!sucursalId || !partidas.length) return error(res, 400, 'La venta no tiene partidas.')

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const lineas: { productoId: string; nombre: string; cantidad: number; precio: number }[] = []
    let total = 0
    for (const raw of partidas) {
      const p = raw as Cuerpo
      const productoId = str(p.productoId, 40)
      const cantidad = Math.floor(num(p.cantidad))
      const precio = num(p.precio)
      const nombre = str(p.nombre, 120)
      if (!productoId || !(cantidad > 0) || !(precio >= 0)) continue
      lineas.push({ productoId, nombre, cantidad, precio })
      total += cantidad * precio
    }
    if (!lineas.length) {
      await client.query('ROLLBACK')
      return error(res, 400, 'Partidas inválidas.')
    }

    for (const linea of lineas) {
      await client.query(
        `INSERT INTO existencias (producto_id, sucursal_id, cantidad) VALUES ($1, $2, 0)
         ON CONFLICT (producto_id, sucursal_id) DO NOTHING`,
        [linea.productoId, sucursalId],
      )
      const stock = await client.query<{ cantidad: number }>(
        `SELECT cantidad FROM existencias
         WHERE producto_id = $1 AND sucursal_id = $2 FOR UPDATE`,
        [linea.productoId, sucursalId],
      )
      const disponible = stock.rows[0]?.cantidad ?? 0
      await client.query(
        `UPDATE existencias SET cantidad = $3
         WHERE producto_id = $1 AND sucursal_id = $2`,
        [linea.productoId, sucursalId, Math.max(0, disponible - linea.cantidad)],
      )
    }

    const folioQ = await client.query<{ folio_venta: number }>(
      `UPDATE cuentas SET folio_venta = folio_venta + 1
       WHERE id = $1 RETURNING folio_venta - 1 AS folio_venta`,
      [sesion.cuentaId],
    )

    const esAnticipo = Boolean(anticipo)
    const montoAnticipo = esAnticipo ? num(anticipo!.monto) : total
    const cobrado = esAnticipo ? montoAnticipo : total
    const recibidoFinal = metodoPago === 'Efectivo' && Number.isFinite(recibido) ? recibido : cobrado

    const v = await client.query<{ id: string }>(
      `INSERT INTO ventas (
         cuenta_id, sucursal_id, folio, cajero_id, cajero_nombre, metodo_pago,
         total, recibido, es_anticipo, anticipo_cliente, anticipo_telefono, anticipo_entrega
       ) VALUES (
         $1, $2, $3, $4, $5, $6::metodo_pago_venta, $7, $8, $9, $10, $11, NULLIF($12, '')::date
       ) RETURNING id`,
      [
        sesion.cuentaId,
        sucursalId,
        folioQ.rows[0]!.folio_venta,
        sesion.id,
        sesion.nombre,
        metodoPago,
        total,
        recibidoFinal,
        esAnticipo,
        esAnticipo ? str(anticipo!.cliente, 120) : null,
        esAnticipo ? str(anticipo!.telefono, 40) : null,
        esAnticipo ? str(anticipo!.entrega, 10) : '',
      ],
    )
    const ventaId = v.rows[0]!.id
    for (const linea of lineas) {
      await client.query(
        `INSERT INTO venta_partidas (venta_id, producto_id, nombre, cantidad, precio)
         VALUES ($1, $2, $3, $4, $5)`,
        [ventaId, linea.productoId, linea.nombre, linea.cantidad, linea.precio],
      )
    }
    if (esAnticipo && montoAnticipo > 0) {
      await client.query(
        `INSERT INTO anticipo_pagos (venta_id, monto, metodo, recibido)
         VALUES ($1, $2, $3::metodo_pago_venta, $4)`,
        [ventaId, montoAnticipo, metodoPago, recibidoFinal],
      )
    }
    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    console.error(e)
    return error(res, 500, 'No se pudo registrar la venta.')
  } finally {
    client.release()
  }
  return responderSnapshot(res, sesion.cuentaId, sesion.correo)
}

async function abonar(
  res: ServerResponse,
  sesion: { cuentaId: string; correo: string },
  ventaId: string,
  datos: Cuerpo,
) {
  const monto = num(datos.monto)
  const metodo = str(datos.metodo, 20) || 'Efectivo'
  const recibido = num(datos.recibido)
  if (!(monto > 0)) return error(res, 400, 'Monto inválido.')

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const v = await client.query<{
      id: string
      total: string
      es_anticipo: boolean
    }>(
      `SELECT id, total::text, es_anticipo FROM ventas
       WHERE id = $1 AND cuenta_id = $2 FOR UPDATE`,
      [ventaId, sesion.cuentaId],
    )
    const venta = v.rows[0]
    if (!venta?.es_anticipo) {
      await client.query('ROLLBACK')
      return error(res, 404, 'Anticipo no encontrado.')
    }
    const pagadoQ = await client.query<{ s: string }>(
      `SELECT COALESCE(SUM(monto), 0)::text AS s FROM anticipo_pagos WHERE venta_id = $1`,
      [ventaId],
    )
    const saldo = Math.max(0, Number(venta.total) - Number(pagadoQ.rows[0]!.s))
    const abono = Math.min(monto, saldo)
    if (abono <= 0) {
      await client.query('ROLLBACK')
      return error(res, 400, 'Este anticipo ya está liquidado.')
    }
    const recibidoFinal = metodo === 'Efectivo' && Number.isFinite(recibido) ? recibido : abono
    await client.query(
      `INSERT INTO anticipo_pagos (venta_id, monto, metodo, recibido)
       VALUES ($1, $2, $3::metodo_pago_venta, $4)`,
      [ventaId, abono, metodo, recibidoFinal],
    )
    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    console.error(e)
    return error(res, 500, 'No se pudo registrar el abono.')
  } finally {
    client.release()
  }
  return responderSnapshot(res, sesion.cuentaId, sesion.correo)
}

async function crearUsuario(
  res: ServerResponse,
  sesion: { cuentaId: string; correo: string },
  datos: Cuerpo,
) {
  const correo = str(datos.correo, 120).toLowerCase()
  const nombre = str(datos.nombre, 120)
  if (!correo || !nombre) return error(res, 400, 'Nombre y correo son obligatorios.')
  const permisos = Array.isArray(datos.permisos) ? datos.permisos.map((p) => str(p, 40)).filter(Boolean) : []

  // Contraseña aleatoria: el usuario la define con el enlace de invitación (punto 7).
  const { hashPassword, passwordTemporal, crearTokenPassword } = await import('../auth/password.ts')
  let enlaceInvitacion: string | undefined

  try {
    const hash = await hashPassword(str(datos.password, 100) || passwordTemporal())
    const insertado = await query<{ id: string }>(
      `INSERT INTO usuarios (
         cuenta_id, sucursal_id, nombre, correo, telefono, puesto, fecha_ingreso,
         rol, activo, password_hash, permisos
       ) VALUES (
         $1, NULLIF($2, '')::uuid, $3, $4, $5, $6, COALESCE($7, '')::date,
         $8::rol_usuario, $9, $10, $11::text[]
       ) RETURNING id`,
      [
        sesion.cuentaId,
        str(datos.sucursalId, 40),
        nombre,
        correo,
        str(datos.telefono, 40).replace(/\D/g, ''),
        str(datos.puesto, 80),
        str(datos.fechaIngreso, 10) || new Date().toLocaleDateString('en-CA'),
        str(datos.rol, 40) || 'Cajero',
        datos.activo !== false,
        hash,
        permisos,
      ],
    )
    const { enlace } = await crearTokenPassword({
      usuarioId: insertado.rows[0]!.id,
      proposito: 'invitar',
    })
    enlaceInvitacion = enlace
    console.log(`[auth] Enlace invitar (${correo}): ${enlace}`)
  } catch (e) {
    console.error(e)
    return error(res, 409, 'No se pudo crear el usuario (¿correo ya en uso?).')
  }

  const snap = await snapshotNegocio(sesion.cuentaId, sesion.correo)
  json(res, 200, { ...snap, enlaceInvitacion })
}

async function actualizarUsuario(
  res: ServerResponse,
  sesion: { cuentaId: string; correo: string },
  id: string,
  datos: Cuerpo,
) {
  const permisos = Array.isArray(datos.permisos) ? datos.permisos.map((p) => str(p, 40)).filter(Boolean) : []
  await query(
    `UPDATE usuarios SET
       nombre = $3, correo = $4, telefono = $5, puesto = $6,
       fecha_ingreso = COALESCE(NULLIF($7, '')::date, fecha_ingreso),
       rol = $8::rol_usuario, sucursal_id = NULLIF($9, '')::uuid,
       activo = $10, permisos = $11::text[], actualizado_en = now()
     WHERE id = $1 AND cuenta_id = $2`,
    [
      id,
      sesion.cuentaId,
      str(datos.nombre, 120),
      str(datos.correo, 120).toLowerCase(),
      str(datos.telefono, 40).replace(/\D/g, ''),
      str(datos.puesto, 80),
      str(datos.fechaIngreso, 10),
      str(datos.rol, 40) || 'Cajero',
      str(datos.sucursalId, 40),
      datos.activo !== false,
      permisos,
    ],
  )
  return responderSnapshot(res, sesion.cuentaId, sesion.correo)
}
