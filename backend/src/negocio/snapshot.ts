import { query } from '../db.ts'

export async function snapshotNegocio(cuentaId: string, correoSesion: string) {
  const cuentaQ = await query<{
    id: string
    negocio: string
    giro: string
    telefono: string
    titular_correo: string
    plan_id: string
    ciclo: string
    clave_licencia: string
    inicio: Date
    vence: Date
    en_prueba: boolean
    suspendida: boolean
    cancelada: boolean
    prueba_usada: boolean
    tutorial_pendiente: boolean
    garantia_hasta: Date | null
    logo_url: string | null
    color_marca: string | null
    fact_pais: string
    fact_estado: string
    fact_direccion: string
    fact_codigo_postal: string
    folio_venta: number
    folio_entrada: number
    folio_perdida: number
  }>(`SELECT * FROM cuentas WHERE id = $1`, [cuentaId])

  const c = cuentaQ.rows[0]
  if (!c) throw new Error('cuenta_no_encontrada')

  const activada = Boolean(c.negocio?.trim())

  const [sucursalesQ, usuariosQ, productosQ, existenciasQ, entradasQ, perdidasQ, ventasQ, mediosQ] =
    await Promise.all([
      query<{ id: string; nombre: string; direccion: string }>(
        `SELECT id, nombre, direccion FROM sucursales WHERE cuenta_id = $1 AND activa ORDER BY creado_en`,
        [cuentaId],
      ),
      query<{
        id: string
        nombre: string
        correo: string
        telefono: string
        puesto: string
        fecha_ingreso: string
        rol: string
        sucursal_id: string | null
        activo: boolean
        permisos: string[]
      }>(
        `SELECT id, nombre, correo, telefono, puesto, fecha_ingreso::text, rol::text AS rol,
                sucursal_id, activo, permisos
         FROM usuarios WHERE cuenta_id = $1 ORDER BY creado_en`,
        [cuentaId],
      ),
      query<{
        id: string
        sku: string
        nombre: string
        categoria: string
        precio: string
        costo: string
        stock_minimo: number
        caducidad: string | null
      }>(
        `SELECT id, sku, nombre, categoria, precio::text, costo::text, stock_minimo,
                caducidad::text
         FROM productos WHERE cuenta_id = $1 AND activo ORDER BY nombre`,
        [cuentaId],
      ),
      query<{ producto_id: string; sucursal_id: string; cantidad: number }>(
        `SELECT e.producto_id, e.sucursal_id, e.cantidad
         FROM existencias e
         JOIN productos p ON p.id = e.producto_id
         WHERE p.cuenta_id = $1`,
        [cuentaId],
      ),
      query<{
        id: string
        folio: number
        fecha: Date
        sucursal_id: string
        producto_id: string
        producto: string
        cantidad: number
        costo_unitario: string
        proveedor: string
        nota: string
      }>(
        `SELECT e.id, e.folio, e.fecha, e.sucursal_id, e.producto_id, p.nombre AS producto,
                e.cantidad, e.costo_unitario::text, e.proveedor, e.nota
         FROM entradas e
         JOIN productos p ON p.id = e.producto_id
         WHERE e.cuenta_id = $1
         ORDER BY e.fecha DESC
         LIMIT 500`,
        [cuentaId],
      ),
      query<{
        id: string
        folio: number
        fecha: Date
        sucursal_id: string
        producto_id: string
        producto: string
        cantidad: number
        costo_unitario: string
        motivo: string
        nota: string
      }>(
        `SELECT pe.id, pe.folio, pe.fecha, pe.sucursal_id, pe.producto_id, p.nombre AS producto,
                pe.cantidad, pe.costo_unitario::text, pe.motivo::text AS motivo, pe.nota
         FROM perdidas pe
         JOIN productos p ON p.id = pe.producto_id
         WHERE pe.cuenta_id = $1
         ORDER BY pe.fecha DESC
         LIMIT 500`,
        [cuentaId],
      ),
      query<{
        id: string
        folio: number
        fecha: Date
        sucursal_id: string
        cajero_nombre: string
        metodo_pago: string
        total: string
        recibido: string
        es_anticipo: boolean
        anticipo_cliente: string | null
        anticipo_telefono: string | null
        anticipo_entrega: string | null
      }>(
        `SELECT id, folio, fecha, sucursal_id, cajero_nombre, metodo_pago::text AS metodo_pago,
                total::text, recibido::text, es_anticipo, anticipo_cliente, anticipo_telefono,
                anticipo_entrega::text
         FROM ventas WHERE cuenta_id = $1
         ORDER BY fecha DESC
         LIMIT 1000`,
        [cuentaId],
      ),
      query<{ marca: string; ultimos4: string; vence: string; titular: string }>(
        `SELECT marca, ultimos4, vence, titular FROM medios_pago WHERE cuenta_id = $1 LIMIT 1`,
        [cuentaId],
      ),
    ])

  const existencias: Record<string, Record<string, number>> = {}
  for (const e of existenciasQ.rows) {
    ;(existencias[e.producto_id] ??= {})[e.sucursal_id] = e.cantidad
  }

  const ventaIds = ventasQ.rows.map((v) => v.id)
  const partidasPorVenta: Record<
    string,
    { productoId: string | null; nombre: string; cantidad: number; precio: number }[]
  > = {}
  const pagosPorVenta: Record<
    string,
    { fecha: string; monto: number; metodo: string; recibido: number }[]
  > = {}

  if (ventaIds.length) {
    const partidasQ = await query<{
      venta_id: string
      producto_id: string | null
      nombre: string
      cantidad: number
      precio: string
    }>(
      `SELECT venta_id, producto_id, nombre, cantidad, precio::text
       FROM venta_partidas WHERE venta_id = ANY($1::uuid[])`,
      [ventaIds],
    )
    for (const p of partidasQ.rows) {
      ;(partidasPorVenta[p.venta_id] ??= []).push({
        productoId: p.producto_id,
        nombre: p.nombre,
        cantidad: p.cantidad,
        precio: Number(p.precio),
      })
    }

    const pagosQ = await query<{
      venta_id: string
      fecha: Date
      monto: string
      metodo: string
      recibido: string
    }>(
      `SELECT venta_id, fecha, monto::text, metodo::text AS metodo, recibido::text
       FROM anticipo_pagos WHERE venta_id = ANY($1::uuid[]) ORDER BY fecha`,
      [ventaIds],
    )
    for (const p of pagosQ.rows) {
      ;(pagosPorVenta[p.venta_id] ??= []).push({
        fecha: p.fecha.toISOString(),
        monto: Number(p.monto),
        metodo: p.metodo,
        recibido: Number(p.recibido),
      })
    }
  }

  const sucursales = sucursalesQ.rows.map((s) => ({
    id: s.id,
    nombre: s.nombre,
    direccion: s.direccion,
  }))

  const usuarioSesion = usuariosQ.rows.find(
    (u) => u.correo.trim().toLowerCase() === correoSesion.trim().toLowerCase(),
  )

  const medio = mediosQ.rows[0]

  return {
    titular: c.titular_correo,
    licencia: activada
      ? {
          planId: c.plan_id,
          ciclo: c.ciclo,
          clave: c.clave_licencia,
          inicio: c.inicio.toISOString(),
          vence: c.vence.toISOString(),
          negocio: c.negocio,
          giro: c.giro,
          telefono: c.telefono,
          enPrueba: c.en_prueba,
          suspendida: c.suspendida,
          cancelada: c.cancelada,
          garantiaHasta: c.garantia_hasta?.toISOString(),
          tarjeta: medio
            ? {
                marca: medio.marca,
                ultimos4: medio.ultimos4,
                vence: medio.vence,
                titular: medio.titular,
              }
            : undefined,
          facturacion: {
            pais: c.fact_pais,
            estado: c.fact_estado,
            direccion: c.fact_direccion,
            codigoPostal: c.fact_codigo_postal,
          },
        }
      : null,
    pruebaUsada: c.prueba_usada,
    tutorialPendiente: c.tutorial_pendiente,
    marca: {
      logo: c.logo_url,
      color: c.color_marca,
    },
    planElegido: null,
    sucursalActivaId: usuarioSesion?.sucursal_id ?? sucursales[0]?.id ?? '',
    sucursales,
    usuarios: usuariosQ.rows.map((u) => ({
      id: u.id,
      nombre: u.nombre,
      correo: u.correo,
      telefono: u.telefono,
      puesto: u.puesto,
      fechaIngreso: u.fecha_ingreso.slice(0, 10),
      rol: u.rol,
      sucursalId: u.sucursal_id ?? '',
      activo: u.activo,
      permisos: u.permisos ?? [],
    })),
    productos: productosQ.rows.map((p) => ({
      id: p.id,
      sku: p.sku,
      nombre: p.nombre,
      categoria: p.categoria,
      precio: Number(p.precio),
      costo: Number(p.costo),
      stockMinimo: p.stock_minimo,
      caducidad: p.caducidad ?? undefined,
      existencias: existencias[p.id] ?? {},
    })),
    entradas: entradasQ.rows.map((e) => ({
      id: e.id,
      folio: e.folio,
      fecha: e.fecha.toISOString(),
      sucursalId: e.sucursal_id,
      productoId: e.producto_id,
      producto: e.producto,
      cantidad: e.cantidad,
      costoUnitario: Number(e.costo_unitario),
      proveedor: e.proveedor,
      nota: e.nota,
    })),
    perdidas: perdidasQ.rows.map((p) => ({
      id: p.id,
      folio: p.folio,
      fecha: p.fecha.toISOString(),
      sucursalId: p.sucursal_id,
      productoId: p.producto_id,
      producto: p.producto,
      cantidad: p.cantidad,
      costoUnitario: Number(p.costo_unitario),
      motivo: p.motivo,
      nota: p.nota,
    })),
    ventas: ventasQ.rows
      .map((v) => {
        const partidas = (partidasPorVenta[v.id] ?? []).map((p) => ({
          productoId: p.productoId ?? '',
          nombre: p.nombre,
          cantidad: p.cantidad,
          precio: p.precio,
        }))
        const venta: Record<string, unknown> = {
          id: v.id,
          folio: v.folio,
          fecha: v.fecha.toISOString(),
          sucursalId: v.sucursal_id,
          cajero: v.cajero_nombre,
          metodoPago: v.metodo_pago,
          partidas,
          total: Number(v.total),
          recibido: Number(v.recibido),
        }
        if (v.es_anticipo) {
          venta.anticipo = {
            cliente: v.anticipo_cliente ?? '',
            telefono: v.anticipo_telefono ?? '',
            entrega: v.anticipo_entrega ?? '',
            pagos: pagosPorVenta[v.id] ?? [],
          }
        }
        return venta
      })
      .reverse(),
    folioVenta: c.folio_venta,
    folioEntrada: c.folio_entrada,
    folioPerdida: c.folio_perdida,
    sesion: {
      correo: correoSesion,
      nombre: usuarioSesion?.nombre ?? correoSesion.split('@')[0] ?? 'Usuario',
    },
  }
}
