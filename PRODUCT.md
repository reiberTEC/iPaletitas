# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

Aplicación instalable para **escritorio, tableta y móvil** (PWA hoy; tiendas más adelante — ver `APP.md`). No es un sitio web de marketing como producto final. El frontend Vue es la app; la landing pública es solo la puerta comercial (cuenta + Descargar).

## Users

- **Dueño o administrador de un comercio pequeño en México.** Nació pensado para paleterías y neverías, pero sirve a cualquier comercio de mostrador (taquerías, cafeterías, abarrotes). Contrata un plan, da de alta su catálogo, sus sucursales y a su equipo, y revisa ventas e inventario.
- **Empleados del negocio** (cajero, gerente, almacén). Entran con el correo que el dueño registró y solo ven lo que su rol y permisos permiten. El cajero cobra en el mostrador, muchas veces con prisa y desde tablet o celular.
- **Equipo interno de iPaletitas** (correos `@ipaletitas`), que administra cuentas, licencias, planes y cobranza desde el panel de administración.

## Product Purpose

Punto de venta e inventario en la nube para comercios pequeños: cobrar con ticket, controlar existencias y entradas, bajar caducados a pérdida, ver el historial y las gráficas de ventas, manejar anticipos, sucursales y usuarios con permisos. El éxito es que el mostrador cobre rápido sin errores y que el dueño sepa en segundos cómo va su negocio, qué le falta surtir y cuánto perdió por caducidad o merma.

## Positioning

- Hecho en español y con precios en pesos, para el comercio de mostrador mexicano; no es un ERP ni un CRM.
- **Marca blanca por negocio:** cada negocio que contrata sube su logo y el panel adopta los colores de su marca, de modo que el sistema se siente propio del negocio y no de iPaletitas.
- **App multi-dispositivo:** la experiencia se diseña para escritorio (caja / oficina), tableta (mostrador) y móvil (consulta y operaciones rápidas), no como página web genérica.

## Operating Context

- Mostrador con computadora, tablet o teléfono; uso rápido y repetido durante el día, a veces con poca luz o de noche (existe modo oscuro).
- Flujo comercial: página pública → registro → elegir plan (semana gratis) → activar licencia → panel del negocio.
- Planes: Básica, Doble, Doble Especial y Especial Super, con límites de sucursales, usuarios, productos y meses de historial.
- Roles: Administrador, Gerente, Cajero y Almacén, con permisos por módulo (ver, crear, editar, eliminar). El titular de la cuenta siempre tiene acceso total.

## Capabilities and Constraints

- Frontend Vue 3 + TypeScript + Vite + Tailwind CSS v4, iconos `@lucide/vue`, gráficas con chart.js / vue-chartjs.
- Sin router: `App.vue` cambia de vista y `PanelCliente.vue` cambia de sección.
- **Panel + auth** van a PostgreSQL vía `backend/` (JWT). Con token, el estado del negocio se carga y se guarda en la API; sin token (o si la API no responde) aún puede caer a `localStorage` (`ipaletitas:v1`).
- Módulos del panel: Inicio, Punto de venta (con anticipos opcionales), Productos (avisos de agotados y por acabarse, surtir, fecha de caducidad), Entradas, **Caducados** (pasar a pérdida por caducidad, daño o merma), Historial (gráfica por día/semana/mes y producto más vendido), Usuarios, Sucursales, Suscripciones, Mi licencia, Nosotros.
- El nombre de la empresa proveedora (iPaletitas) puede cambiar en el futuro; no debe quedar incrustado en lugares difíciles de cambiar.

## Brand Commitments

- Nombre de la empresa proveedora: **iPaletitas** (puede cambiar).
- **Pali**, la mascota, con todas sus poses (`frontend/src/assets`: saludando, señalando, pensando, pulgar, lentes, mesero, portafolio, super, billete).
- **PaletaIcon**, el ícono de la paleta (`frontend/src/components/icons/PaletaIcon.vue`).
- **Modo oscuro** disponible en todo el sistema.
- Voz: español de México, cercana y directa, de tú.

## Evidence on Hand

- Datos de ejemplo sembrados al activar la licencia (productos de paletería, ventas y usuarios de prueba; al menos un producto caducado y uno por caducar).
- No hay clientes reales, testimonios, métricas ni prensa: no se deben inventar.

## Product Principles

1. El mostrador primero: cobrar debe ser lo más rápido y claro de todo el sistema.
2. El sistema es del negocio: su marca manda dentro del panel; iPaletitas acompaña sin imponerse.
3. Cada persona ve solo lo que le toca según su rol.
4. Avisar antes de que falte o se eche a perder: inventario, caducidad, límites del plan y vencimientos se anuncian con tiempo.
5. Claridad sobre adorno: un dueño ocupado debe entender cualquier pantalla de un vistazo.
6. Una sola app, tres tamaños: escritorio, tableta y móvil deben completar las tareas críticas sin “versión incompleta”.

## Roadmap inmediato

1. ~~Caducados → pérdida~~ (hecho en el panel).
2. ~~Esquema PostgreSQL + API auth + panel conectado~~ — datos del negocio compartidos entre dispositivos.
3. ~~PWA instalable~~ (manifest, sección Descargar, modo standalone) — ver `APP.md`. Siguiente: publicar en HTTPS; luego APK / instalador Windows si se quieren tiendas.
