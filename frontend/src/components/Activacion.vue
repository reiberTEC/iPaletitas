<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ArrowRight, Check, Copy, CreditCard, Gift, Lock, Pencil, ShieldCheck, Tag, X } from '@lucide/vue'
import FlujoEncabezado from './FlujoEncabezado.vue'
import FormTarjeta from './pago/FormTarjeta.vue'
import LogoTarjeta from './pago/LogoTarjeta.vue'
import { mascotaPlan } from './planes/mascotas'
import UiButton from './ui/Button.vue'
import UiModal from './ui/Modal.vue'
import { DIAS_GARANTIA, PLAN_RECOMENDADO, activarLicencia, estado, planPorId, precioPlan } from '@/stores/negocio'
import { CUPONES, IVA, MESES_SIN_INTERESES } from '@/stores/catalogo'
import { cobrarContratacion } from '@/stores/admin'
import { dinero, fecha, iniciales, precio } from '@/lib/formato'
import { BILLETERAS, registrarBilletera, textoTarjeta, type Billetera, type TarjetaRegistrada } from '@/lib/tarjeta'
import { copiarTexto } from '@/lib/utils'

defineEmits(['listo', 'volver', 'cambiarCuenta'])

const plan = computed(
  () => planPorId(estado.planElegido?.planId ?? estado.licencia?.planId ?? PLAN_RECOMENDADO),
)
const mascota = computed(() => mascotaPlan[plan.value.id])
const ciclo = computed(() => estado.planElegido?.ciclo ?? estado.licencia?.ciclo ?? 'mensual')
const primeraVez = !estado.sucursales.length

const giros = [
  'Paletería y nevería',
  'Abarrotes',
  'Cafetería',
  'Restaurante',
  'Panadería',
  'Tienda de ropa',
  'Papelería',
  'Otro',
]

const ESTADOS_MX = [
  'Aguascalientes',
  'Baja California',
  'Baja California Sur',
  'Campeche',
  'Chiapas',
  'Chihuahua',
  'Ciudad de México',
  'Coahuila',
  'Colima',
  'Durango',
  'Estado de México',
  'Guanajuato',
  'Guerrero',
  'Hidalgo',
  'Jalisco',
  'Michoacán',
  'Morelos',
  'Nayarit',
  'Nuevo León',
  'Oaxaca',
  'Puebla',
  'Querétaro',
  'Quintana Roo',
  'San Luis Potosí',
  'Sinaloa',
  'Sonora',
  'Tabasco',
  'Tamaulipas',
  'Tlaxcala',
  'Veracruz',
  'Yucatán',
  'Zacatecas',
]

const form = reactive({
  negocio: estado.licencia?.negocio ?? '',
  giro: estado.licencia?.giro ?? giros[0]!,
  telefono: estado.licencia?.telefono ?? '',
  sucursal: 'Matriz',
})

const facturacion = reactive({
  pais: 'México',
  estado: estado.licencia?.facturacion?.estado ?? '',
  direccion: estado.licencia?.facturacion?.direccion ?? '',
  codigoPostal: estado.licencia?.facturacion?.codigoPostal ?? '',
})

/* ---------- Método de pago ---------- */

type Metodo = 'tarjeta' | Billetera
const metodo = ref<Metodo>('tarjeta')
const billetera = computed(() => (metodo.value === 'tarjeta' ? null : metodo.value))
const correoBilletera = ref(estado.sesion?.correo ?? '')
const meses = ref(0)
const formTarjeta = ref<InstanceType<typeof FormTarjeta>>()
const autorizando = ref(false)

/* ---------- Montos: los precios ya traen IVA; aquí se desglosa ---------- */

const precioLista = computed(() => precioPlan(plan.value, ciclo.value))
const periodo = computed(() => (ciclo.value === 'mensual' ? 'mes' : 'año'))
const conSemanaGratis = !estado.pruebaUsada

const mostrandoCupon = ref(false)
const codigoCupon = ref('')
const errorCupon = ref('')
const cupon = ref<{ codigo: string; porcentaje: number; descripcion: string } | null>(null)

function aplicarCupon() {
  const codigo = codigoCupon.value.trim().toUpperCase()
  const encontrado = CUPONES[codigo]
  if (!encontrado) {
    errorCupon.value = 'Ese cupón no existe o ya no está vigente.'
    return
  }
  cupon.value = { codigo, ...encontrado }
  errorCupon.value = ''
  mostrandoCupon.value = false
}

function quitarCupon() {
  cupon.value = null
  codigoCupon.value = ''
}

const porcentaje = computed(() => cupon.value?.porcentaje ?? 0)
const totalHoy = computed(() => Math.round(precioLista.value * (100 - porcentaje.value)) / 100)
const subtotal = computed(() => precioLista.value / (1 + IVA))
const descuento = computed(() => (subtotal.value * porcentaje.value) / 100)
const iva = computed(() => (subtotal.value - descuento.value) * IVA)

const plazos = computed(() => (ciclo.value === 'anual' && metodo.value === 'tarjeta' ? MESES_SIN_INTERESES : []))
const mesesElegidos = computed(() => (plazos.value.length ? meses.value : 0))

const enDias = (dias: number, base = new Date()) => {
  const dia = new Date(base)
  dia.setDate(dia.getDate() + dias)
  return fecha(dia.toISOString())
}
const finSemanaGratis = computed(() => enDias(DIAS_GARANTIA))
const primeraRenovacion = computed(() => {
  const dia = new Date()
  dia.setMonth(dia.getMonth() + (ciclo.value === 'anual' ? 12 : 1))
  return fecha(dia.toISOString())
})

const limites = computed(() => {
  const l = plan.value.limites
  const texto = (n: number, singular: string, plural: string, ilimitado: string) =>
    n === Infinity ? ilimitado : n === 1 ? `1 ${singular}` : `${n.toLocaleString('es-MX')} ${plural}`
  return [
    texto(l.sucursales, 'sucursal', 'sucursales', 'sucursales ilimitadas'),
    texto(l.usuarios, 'usuario', 'usuarios', 'usuarios ilimitados'),
    texto(l.productos, 'producto', 'productos', 'productos ilimitados'),
  ].join(' · ')
})

/* ---------- Pagar ---------- */

const activada = ref(false)
const cobrado = ref(0)
const mesesCobrados = ref(0)
const copiado = ref(false)

function pagar() {
  if (billetera.value) {
    autorizando.value = true
    return
  }
  const tarjeta = formTarjeta.value?.validar()
  if (tarjeta) completar(tarjeta)
}

function autorizarBilletera() {
  if (!billetera.value) return
  autorizando.value = false
  completar(registrarBilletera(billetera.value, correoBilletera.value))
}

function completar(tarjeta: TarjetaRegistrada) {
  activarLicencia({
    negocio: form.negocio.trim(),
    giro: form.giro,
    telefono: form.telefono.trim(),
    sucursal: form.sucursal.trim(),
    tarjeta,
    facturacion: {
      pais: facturacion.pais,
      estado: facturacion.estado,
      direccion: facturacion.direccion.trim(),
      codigoPostal: facturacion.codigoPostal,
    },
  })
  cobrado.value = totalHoy.value
  mesesCobrados.value = mesesElegidos.value
  cobrarContratacion({ cupon: cupon.value?.codigo, porcentaje: porcentaje.value, meses: mesesElegidos.value })
  activada.value = true
  window.scrollTo({ top: 0, behavior: 'instant' })
}

async function copiar() {
  await copiarTexto(estado.licencia?.clave ?? '')
  copiado.value = true
  setTimeout(() => (copiado.value = false), 1800)
}
</script>

<template>
  <div class="ip-fondo min-h-svh w-full font-sans text-slate-900">
    <FlujoEncabezado :paso="3" :sin-volver="activada" @volver="$emit('volver')" />

    <main class="mx-auto w-full max-w-6xl px-5 pt-12 pb-20 sm:px-6 lg:pt-16">
      <section v-if="activada && estado.licencia" class="mx-auto max-w-xl">
        <div class="relative w-fit">
          <img :src="mascota.src" :alt="mascota.alt" class="mascota-exito h-40 w-auto" />
          <span class="exito-sello" aria-hidden="true"><Check class="size-6" :stroke-width="3" /></span>
        </div>
        <h1 class="mt-6 font-display text-[clamp(2rem,5vw,3rem)] leading-[1.02] font-extrabold tracking-[-0.03em] text-balance">
          ¡Tu suscripción está activa!
        </h1>
        <p class="mt-4 text-lg leading-8 text-slate-600">
          Cobramos {{ dinero(cobrado) }}
          <template v-if="mesesCobrados">en {{ mesesCobrados }} meses sin intereses</template>
          a tu
          <template v-if="estado.licencia.tarjeta">{{ textoTarjeta(estado.licencia.tarjeta) }}</template>
          por el plan {{ plan.nombre }} de <strong class="text-slate-900">{{ estado.licencia.negocio }}</strong>. Se renueva
          solo el {{ fecha(estado.licencia.vence) }}.
          <template v-if="estado.licencia.garantiaHasta">
            Tu semana gratis dura hasta el {{ fecha(estado.licencia.garantiaHasta) }}: si no te convence, pide tu
            devolución en Mi licencia.
          </template>
        </p>

        <div class="mt-8 rounded-2xl bg-white p-6">
          <h2 class="font-display text-lg font-bold">Tu clave de licencia</h2>
          <div class="clave mt-4">
            <code class="clave-texto">{{ estado.licencia.clave }}</code>
            <button type="button" class="clave-copiar ip-boton" @click="copiar">
              <Check v-if="copiado" class="size-4" />
              <Copy v-else class="size-4" />
              {{ copiado ? 'Copiada' : 'Copiar' }}
            </button>
          </div>
          <p class="mt-4 text-base leading-7 text-slate-600">
            <template v-if="primeraVez">
              Creamos tu sucursal <strong class="text-slate-900">{{ form.sucursal || 'Matriz' }}</strong> con 3 productos
              de ejemplo, y al entrar te damos un recorrido rápido por el sistema.
            </template>
            <template v-else>Tus datos, productos y ventas se conservan con la nueva licencia.</template>
          </p>
        </div>

        <UiButton size="lg" class="mt-8 h-13 px-8 text-[1.0625rem]" @click="$emit('listo')">
          Entrar a mi panel
          <ArrowRight class="size-5" />
        </UiButton>
      </section>

      <section v-else class="grid items-start gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <form class="rounded-2xl bg-white p-6 sm:p-10" @submit.prevent="pagar">
          <div class="cuenta">
            <span class="cuenta-avatar" aria-hidden="true">{{ iniciales(estado.sesion?.nombre ?? '') }}</span>
            <div class="min-w-0">
              <p class="m-0 truncate font-display text-xl font-bold">{{ estado.sesion?.correo }}</p>
              <button type="button" class="cuenta-cambiar" @click="$emit('cambiarCuenta')">
                Cambiar cuenta
                <Pencil class="size-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <h1 class="mt-8 font-display text-[clamp(1.75rem,3.5vw,2.25rem)] leading-[1.05] font-extrabold tracking-[-0.03em]">
            Paga tu suscripción
          </h1>

          <!-- Datos del negocio -->
          <fieldset class="bloque">
            <legend class="bloque-titulo">Datos de tu negocio</legend>
            <div class="grid gap-5 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <label class="ip-label" for="negocio">Nombre del negocio</label>
                <input
                  id="negocio"
                  v-model="form.negocio"
                  class="ip-input"
                  autocomplete="organization"
                  required
                  placeholder="Paletería La Michoacana"
                />
              </div>
              <div>
                <label class="ip-label" for="giro">Giro</label>
                <select id="giro" v-model="form.giro" class="ip-input">
                  <option v-for="giro in giros" :key="giro">{{ giro }}</option>
                </select>
              </div>
              <div>
                <label class="ip-label" for="telefono">Teléfono de contacto</label>
                <input
                  id="telefono"
                  v-model="form.telefono"
                  class="ip-input"
                  type="tel"
                  autocomplete="tel"
                  inputmode="tel"
                  required
                  placeholder="55 1234 5678"
                />
              </div>
              <div v-if="primeraVez" class="sm:col-span-2">
                <label class="ip-label" for="sucursal">Nombre de tu sucursal principal</label>
                <input id="sucursal" v-model="form.sucursal" class="ip-input" required placeholder="Matriz" />
              </div>
            </div>
          </fieldset>

          <!-- Método de pago -->
          <fieldset class="bloque">
            <legend class="bloque-titulo">Método de pago</legend>
            <div class="metodos">
              <label :class="['metodo', { activo: metodo === 'tarjeta' }]">
                <input v-model="metodo" type="radio" name="metodo" value="tarjeta" class="sr-only" />
                <CreditCard class="size-5 shrink-0" aria-hidden="true" />
                <span class="metodo-texto">Tarjeta de crédito o débito</span>
              </label>
              <label v-for="opcion in BILLETERAS" :key="opcion" :class="['metodo', { activo: metodo === opcion }]">
                <input v-model="metodo" type="radio" name="metodo" :value="opcion" class="sr-only" />
                <LogoTarjeta :marca="opcion" :ancho="54" aria-hidden="true" />
                <span class="sr-only">{{ opcion }}</span>
              </label>
            </div>
          </fieldset>

          <!-- Tarjeta o billetera -->
          <fieldset v-if="metodo === 'tarjeta'" class="bloque">
            <legend class="bloque-titulo">
              Información de la tarjeta
              <Lock class="size-4" aria-hidden="true" />
            </legend>
            <FormTarjeta ref="formTarjeta">
              <template v-if="plazos.length">
                <label class="ip-label" for="meses">Pagos</label>
                <select id="meses" v-model.number="meses" class="ip-input">
                  <option :value="0">Una sola exhibición de {{ dinero(totalHoy) }}</option>
                  <option v-for="n in plazos" :key="n" :value="n">
                    {{ n }} meses sin intereses de {{ dinero(totalHoy / n) }}
                  </option>
                </select>
                <p class="mt-2 mb-0 text-sm text-slate-500">Los meses sin intereses aplican con tarjeta de crédito.</p>
              </template>
            </FormTarjeta>
          </fieldset>

          <fieldset v-else class="bloque">
            <legend class="bloque-titulo">Tu cuenta de {{ billetera }}</legend>
            <div class="billetera">
              <LogoTarjeta v-if="billetera" :marca="billetera" :ancho="60" aria-hidden="true" />
              <p class="m-0 text-base leading-7 text-slate-600">
                Al pagar te pediremos autorizar el cobro en {{ billetera }}. Hoy se cobran {{ dinero(totalHoy) }} y cada
                renovación se cobra ahí sola.
              </p>
            </div>
            <label class="ip-label mt-5" for="correo-billetera">Correo de tu cuenta de {{ billetera }}</label>
            <input
              id="correo-billetera"
              v-model="correoBilletera"
              class="ip-input"
              type="email"
              autocomplete="email"
              required
              placeholder="tucorreo@ejemplo.com"
            />
          </fieldset>

          <!-- Facturación -->
          <fieldset class="bloque">
            <legend class="bloque-titulo">Datos de facturación</legend>
            <div class="grid gap-5 sm:grid-cols-2">
              <div>
                <label class="ip-label" for="pais">País o región</label>
                <select id="pais" v-model="facturacion.pais" class="ip-input" autocomplete="country-name">
                  <option>México</option>
                </select>
              </div>
              <div>
                <label class="ip-label" for="estado-mx">Estado</label>
                <select id="estado-mx" v-model="facturacion.estado" class="ip-input" required autocomplete="address-level1">
                  <option value="" disabled>Elige tu estado</option>
                  <option v-for="nombre in ESTADOS_MX" :key="nombre">{{ nombre }}</option>
                </select>
              </div>
              <div>
                <label class="ip-label" for="direccion">Dirección</label>
                <input
                  id="direccion"
                  v-model="facturacion.direccion"
                  class="ip-input"
                  autocomplete="street-address"
                  required
                  placeholder="Calle, número y colonia"
                />
              </div>
              <div>
                <label class="ip-label" for="codigo-postal">Código postal</label>
                <input
                  id="codigo-postal"
                  v-model="facturacion.codigoPostal"
                  class="ip-input tabular-nums"
                  autocomplete="postal-code"
                  inputmode="numeric"
                  required
                  maxlength="5"
                  pattern="[0-9]{5}"
                  title="Son 5 dígitos"
                  placeholder="06600"
                />
              </div>
            </div>
          </fieldset>

          <!-- Confirmación -->
          <div class="cierre">
            <p class="legal">
              Al pagar confirmo que <strong>leí y acepto</strong> los Términos de la licencia de uso y el Aviso de privacidad
              de iPaletitas, en particular la <strong>renovación automática</strong>: mi suscripción se cobra sola cada
              {{ periodo }} a este método de pago hasta que la cancele.
              <template v-if="conSemanaGratis">
                Si en los primeros {{ DIAS_GARANTIA }} días el servicio no me convence, pido la devolución completa desde Mi
                licencia (una sola vez por cuenta).
              </template>
              Puedo cancelar cuando quiera desde Suscripciones o escribiendo a soporte.
            </p>
            <div class="cierre-acciones">
              <div v-if="conSemanaGratis" class="sello-garantia" aria-hidden="true">
                <span class="sello-dias"><strong>{{ DIAS_GARANTIA }}</strong>días</span>
                <span class="sello-texto">Garantía de devolución</span>
              </div>
              <UiButton type="submit" size="lg" class="h-13 px-7 text-[1.0625rem]">
                <Lock class="size-5" aria-hidden="true" />
                Pagar {{ dinero(totalHoy) }}
              </UiButton>
            </div>
          </div>
        </form>

        <aside class="resumen rounded-2xl bg-white p-6 sm:p-8 lg:sticky lg:top-28" aria-labelledby="titulo-resumen">
          <div class="flex items-center justify-between gap-4">
            <h2 id="titulo-resumen" class="font-display text-xl font-extrabold tracking-tight">Resumen del pedido</h2>
            <span class="moneda" title="Precios en pesos mexicanos">MXN</span>
          </div>

          <div class="pedido">
            <img :src="mascota.src" alt="" aria-hidden="true" class="pedido-mascota" />
            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-3">
                <p class="m-0 font-bold">iPaletitas · Plan {{ plan.nombre }}</p>
                <p class="m-0 font-bold tabular-nums">{{ precio(precioLista) }}</p>
              </div>
              <p class="mt-1 mb-0 text-sm text-slate-500">
                Suscripción {{ ciclo === 'anual' ? 'anual' : 'mensual' }} · {{ limites }}
              </p>
              <span v-if="conSemanaGratis" class="regalo"><Gift class="size-3.5" aria-hidden="true" /> Semana gratis</span>
            </div>
          </div>
          <p class="pedido-nota">
            <template v-if="conSemanaGratis">
              Si no te convence, pides tu devolución completa hasta el {{ finSemanaGratis }}.
            </template>
            Se renueva sola el {{ primeraRenovacion }} por {{ precio(precioLista) }} / {{ periodo }} con IVA incluido;
            <strong>cancela cuando quieras.</strong>
          </p>

          <div class="cupon">
            <div v-if="cupon" class="cupon-aplicado">
              <Tag class="size-4 shrink-0" aria-hidden="true" />
              <span class="min-w-0 flex-1"><strong>{{ cupon.codigo }}</strong> · {{ cupon.descripcion }}</span>
              <button type="button" class="cupon-quitar" :aria-label="`Quitar el cupón ${cupon.codigo}`" @click="quitarCupon">
                <X class="size-4" />
              </button>
            </div>
            <template v-else>
              <button
                v-if="!mostrandoCupon"
                type="button"
                class="cupon-enlace"
                @click="mostrandoCupon = true"
              >
                Tengo un cupón
              </button>
              <form v-else class="cupon-form" @submit.prevent="aplicarCupon">
                <label class="sr-only" for="cupon">Código del cupón</label>
                <input
                  id="cupon"
                  v-model="codigoCupon"
                  class="ip-input uppercase"
                  placeholder="Código"
                  autocomplete="off"
                  :aria-invalid="Boolean(errorCupon)"
                  :aria-describedby="errorCupon ? 'error-cupon' : undefined"
                />
                <UiButton type="submit" variant="outline">Aplicar</UiButton>
              </form>
              <p v-if="errorCupon" id="error-cupon" class="cupon-error">{{ errorCupon }}</p>
            </template>
          </div>

          <dl class="cuentas">
            <div>
              <dt>Subtotal</dt>
              <dd>{{ dinero(subtotal) }}</dd>
            </div>
            <div v-if="descuento">
              <dt>Descuento ({{ porcentaje }}%)</dt>
              <dd class="descuento">−{{ dinero(descuento) }}</dd>
            </div>
            <div>
              <dt>IVA {{ IVA * 100 }} %</dt>
              <dd>{{ dinero(iva) }}</dd>
            </div>
            <div class="cuentas-total">
              <dt>Total <span>(IVA incluido)</span></dt>
              <dd>{{ dinero(totalHoy) }}</dd>
            </div>
            <p v-if="mesesElegidos" class="m-0 text-right text-sm text-slate-500">
              {{ mesesElegidos }} pagos de {{ dinero(totalHoy / mesesElegidos) }} sin intereses
            </p>
          </dl>

          <p v-if="!conSemanaGratis" class="mt-5 mb-0 flex items-start gap-2 rounded-xl bg-slate-100 p-3 text-sm text-slate-700">
            <ShieldCheck class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Esta cuenta ya usó su semana gratis, así que este pago no tiene devolución.
          </p>

          <UiButton variant="ghost" class="mt-4 h-11 w-full text-base" @click="$emit('volver')">Cambiar de plan</UiButton>
        </aside>
      </section>
    </main>

    <UiModal v-if="autorizando && billetera" :titulo="`Autoriza el pago en ${billetera}`" @cerrar="autorizando = false">
      <div class="flex items-center gap-4">
        <LogoTarjeta :marca="billetera" :ancho="72" aria-hidden="true" />
        <p class="m-0 text-base leading-7 text-slate-600">
          iPaletitas quiere cobrar <strong class="text-slate-900">{{ dinero(totalHoy) }}</strong> hoy y
          {{ precio(precioLista) }} cada {{ periodo }} a la cuenta <strong class="text-slate-900">{{ correoBilletera }}</strong>.
        </p>
      </div>
      <div class="mt-6 flex justify-end gap-3">
        <UiButton variant="outline" @click="autorizando = false">Cancelar</UiButton>
        <UiButton @click="autorizarBilletera">Autorizar y pagar</UiButton>
      </div>
    </UiModal>
  </div>
</template>

<style scoped>
/* ---------- Cuenta ---------- */

.cuenta {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.cuenta-avatar {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 999px;
  background: var(--marca-100);
  color: var(--marca-800);
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 800;
}

.cuenta-cambiar {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  min-height: 2rem;
  padding: 0;
  border: 0;
  background: none;
  color: #475569;
  font: inherit;
  font-size: 0.9375rem;
  cursor: pointer;
}

@media (hover: hover) and (pointer: fine) {
  .cuenta-cambiar:hover {
    color: var(--marca-700);
    text-decoration: underline;
  }
}

/* ---------- Bloques ---------- */

.bloque {
  min-width: 0;
  margin: 2rem 0 0;
  padding: 1.75rem 0 0;
  border: 0;
  border-top: 2px solid #e6e9ef;
}

.bloque-titulo {
  float: left;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  margin-bottom: 1rem;
  padding: 0;
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 700;
}

.bloque-titulo + * {
  clear: both;
}

/* ---------- Métodos de pago ---------- */

.metodos {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.metodo {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 3.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.75rem;
  background: #fff;
  box-shadow: inset 0 0 0 1px #e2e8f0;
  color: #334155;
  cursor: pointer;
  transition: box-shadow 150ms ease;
}

.metodo.activo {
  background: var(--marca-50);
  box-shadow: inset 0 0 0 2px var(--marca-600);
  color: var(--marca-800);
}

.metodo:has(input:focus-visible) {
  outline: 2px solid var(--marca-600);
  outline-offset: 2px;
}

@media (hover: hover) and (pointer: fine) {
  .metodo:not(.activo):hover {
    box-shadow: inset 0 0 0 1px #94a3b8;
  }
}

.metodo-texto {
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.2;
}

@media (max-width: 639px) {
  .metodos {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.billetera {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* ---------- Cierre ---------- */

.cierre {
  display: grid;
  gap: 1.5rem;
  margin-top: 2rem;
  padding-top: 1.75rem;
  border-top: 2px solid #e6e9ef;
}

.legal {
  margin: 0;
  color: #475569;
  font-size: 0.875rem;
  line-height: 1.6;
}

.legal strong {
  color: #0f172a;
}

.cierre-acciones {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem 1.25rem;
}

.sello-garantia {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.625rem 0.375rem 0.375rem;
  border: 1.5px solid #065f46;
  border-radius: 0.5rem;
  color: #065f46;
}

.sello-dias {
  display: grid;
  place-items: center;
  min-width: 2.25rem;
  padding: 0.125rem 0.25rem;
  border-radius: 0.375rem;
  background: #065f46;
  color: #fff;
  font-size: 0.625rem;
  font-weight: 700;
  line-height: 1;
  text-transform: uppercase;
}

.sello-dias strong {
  font-family: var(--font-display);
  font-size: 1rem;
}

.sello-texto {
  max-width: 7rem;
  font-size: 0.6875rem;
  font-weight: 800;
  line-height: 1.15;
  text-transform: uppercase;
}

/* ---------- Resumen del pedido ---------- */

.moneda {
  padding: 0.25rem 0.625rem;
  border-radius: 0.5rem;
  box-shadow: inset 0 0 0 1px #cbd5e1;
  font-size: 0.875rem;
  font-weight: 700;
}

.pedido {
  display: flex;
  gap: 0.875rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e6e9ef;
}

.pedido-mascota {
  width: 3rem;
  height: 3rem;
  flex-shrink: 0;
  object-fit: contain;
}

.regalo {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.625rem;
  padding: 0.125rem 0.5rem;
  border: 1px solid #dc2626;
  border-radius: 0.375rem;
  color: #b91c1c;
  font-size: 0.8125rem;
  font-weight: 600;
}

.pedido-nota {
  margin: 0.875rem 0 0;
  color: #475569;
  font-size: 0.875rem;
  line-height: 1.55;
  text-align: right;
}

.pedido-nota strong {
  color: #0f172a;
}

.cupon {
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid #e6e9ef;
}

.cupon-enlace {
  padding: 0;
  border: 0;
  background: none;
  color: var(--marca-700);
  font: inherit;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

.cupon-form {
  display: flex;
  gap: 0.5rem;
}

.cupon-error {
  margin: 0.5rem 0 0;
  color: #b91c1c;
  font-size: 0.875rem;
}

.cupon-aplicado {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  border-radius: 0.625rem;
  background: #ecfdf5;
  color: #065f46;
  font-size: 0.875rem;
}

.cupon-quitar {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border: 0;
  border-radius: 0.5rem;
  background: none;
  color: inherit;
  cursor: pointer;
}

@media (hover: hover) and (pointer: fine) {
  .cupon-quitar:hover {
    background: rgb(6 95 70 / 0.1);
  }
}

.cuentas {
  display: grid;
  gap: 0.625rem;
  margin: 1.25rem 0 0;
}

.cuentas > div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.9375rem;
}

.cuentas dt {
  color: #475569;
}

.cuentas dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
}

.descuento {
  color: #dc2626;
}

.cuentas-total {
  align-items: baseline;
  margin-top: 0.375rem;
}

.cuentas-total dt {
  color: #0f172a;
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 800;
}

.cuentas-total dt span {
  display: block;
  color: #64748b;
  font-family: var(--font-sans);
  font-size: 0.75rem;
  font-weight: 500;
}

.cuentas-total dd {
  color: var(--marca-700);
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 800;
}

/* ---------- Modo oscuro ---------- */

html.oscuro .bloque,
html.oscuro .cierre {
  border-top-color: rgb(255 255 255 / 0.1);
}

html.oscuro .pedido,
html.oscuro .cupon {
  border-top-color: rgb(255 255 255 / 0.1);
}

html.oscuro .metodo {
  background: rgb(255 255 255 / 0.04);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.12);
  color: #e2e8f0;
}

html.oscuro .metodo.activo {
  background: rgb(96 165 250 / 0.12);
  box-shadow: inset 0 0 0 2px var(--marca-400);
  color: #fff;
}

html.oscuro .cuenta-avatar {
  background: rgb(96 165 250 / 0.16);
  color: #dbeafe;
}

html.oscuro .cuenta-cambiar,
html.oscuro .legal,
html.oscuro .pedido-nota,
html.oscuro .cuentas dt {
  color: #94a3b8;
}

html.oscuro .legal strong,
html.oscuro .pedido-nota strong,
html.oscuro .cuentas-total dt {
  color: #f1f5f9;
}

html.oscuro .sello-garantia {
  border-color: #6ee7b7;
  color: #6ee7b7;
}

html.oscuro .sello-dias {
  background: #6ee7b7;
  color: #064e3b;
}

html.oscuro .moneda {
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.2);
}

html.oscuro .regalo {
  border-color: #f87171;
  color: #fca5a5;
}

html.oscuro .cupon-aplicado {
  background: rgb(16 185 129 / 0.12);
  color: #a7f3d0;
}

html.oscuro .cupon-enlace,
html.oscuro .cuentas-total dd {
  color: var(--marca-300);
}

html.oscuro .descuento,
html.oscuro .cupon-error {
  color: #fca5a5;
}

/* ---------- Éxito ---------- */

.exito-sello {
  position: absolute;
  right: -0.5rem;
  bottom: 0.5rem;
  display: grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  border: 4px solid #f5f6f8;
  border-radius: 999px;
  background: #059669;
  color: #fff;
}

.clave {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem 1rem;
  padding: 1rem 1rem 1rem 1.25rem;
  border-radius: 0.875rem;
  background: var(--marca-950);
}

.clave-texto {
  color: #fff;
  font-family: var(--font-display);
  font-size: clamp(1rem, 3.6vw, 1.25rem);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  overflow-wrap: anywhere;
}

.clave-copiar {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  padding: 0 1rem;
  border: 0;
  border-radius: 0.625rem;
  background: #fff;
  color: var(--marca-900);
  font: inherit;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
}

.clave-copiar:focus-visible {
  outline: 3px solid var(--marca-300);
  outline-offset: 2px;
}

@media (hover: hover) and (pointer: fine) {
  .clave-copiar:hover {
    background: var(--marca-100);
  }
}

.mascota-exito {
  animation: mascota-entra 600ms var(--ease-out) both;
}

@keyframes mascota-entra {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.94);
  }
}

@media (prefers-reduced-motion: reduce) {
  .mascota-exito {
    animation: none;
  }
}
</style>
