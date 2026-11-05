<script setup lang="ts">
const pilares = [
  {
    icono: '🎯',
    titulo: 'Misión',
    texto:
      'Impulsar el crecimiento de las paleterías y neverías con herramientas digitales sencillas, accesibles y pensadas para su operación diaria.',
  },
  {
    icono: '🔭',
    titulo: 'Visión',
    texto:
      'Ser la plataforma de referencia en Latinoamérica para la administración de negocios de paletas y helados artesanales.',
  },
  {
    icono: '🚀',
    titulo: 'Objetivo',
    texto:
      'Reducir el tiempo que nuestros clientes dedican a tareas administrativas para que se enfoquen en lo que mejor saben hacer: crear sabores que enamoran.',
  },
]

const diferenciadores = [
  {
    icono: '🏆',
    titulo: 'Nuestra diferencia competitiva',
    texto:
      'A diferencia de los sistemas de punto de venta genéricos, iPaletitas está diseñada para el giro: manejamos recetarios, insumos perecederos, producción por lotes y temporadas de alta demanda.',
  },
  {
    icono: '⭐',
    titulo: 'Nuestro distintivo en el mercado',
    texto:
      'Somos una plataforma hecha por y para paleteros: unimos la tradición artesanal con la tecnología, con una interfaz amigable y soporte cercano en español.',
  },
]

const plus = [
  'Dashboards de ventas, productos y empleados con gráficas en tiempo real.',
  'Recetario digital vinculado al inventario de insumos.',
  'Alertas de stock bajo para no quedarte sin tus sabores estrella.',
  'Control de plantilla, rotación y productividad del personal.',
  'Acceso desde cualquier dispositivo, sin instalaciones.',
]

// TODO: reemplazar por las URLs reales de las cuentas de iPaletitas
const redes = [
  { nombre: 'Facebook', url: 'https://www.facebook.com/ipaletitas', clase: 'facebook' },
  { nombre: 'Instagram', url: 'https://www.instagram.com/ipaletitas', clase: 'instagram' },
  { nombre: 'TikTok', url: 'https://www.tiktok.com/@ipaletitas', clase: 'tiktok' },
  { nombre: 'WhatsApp', url: 'https://wa.me/520000000000', clase: 'whatsapp' },
]
</script>

<template>
  <div class="nosotros-view">
    <section class="hero">
      <p class="etiqueta">Quiénes somos</p>
      <h1 class="titulo">iPaletitas</h1>
      <p class="descripcion">
        Somos una plataforma de gestión creada para paleterías y neverías. Nacimos para que los
        pequeños y medianos negocios de paletas y helados controlen sus productos, ventas y
        personal desde un solo lugar, sin complicaciones.
      </p>
    </section>

    <section class="grid-3">
      <article v-for="pilar in pilares" :key="pilar.titulo" class="tarjeta">
        <span class="tarjeta-icono">{{ pilar.icono }}</span>
        <h2 class="tarjeta-titulo">{{ pilar.titulo }}</h2>
        <p class="tarjeta-texto">{{ pilar.texto }}</p>
      </article>
    </section>

    <section class="grid-2">
      <article v-for="item in diferenciadores" :key="item.titulo" class="tarjeta">
        <span class="tarjeta-icono">{{ item.icono }}</span>
        <h2 class="tarjeta-titulo">{{ item.titulo }}</h2>
        <p class="tarjeta-texto">{{ item.texto }}</p>
      </article>
    </section>

    <section class="tarjeta tarjeta-plus">
      <span class="tarjeta-icono">✨</span>
      <h2 class="tarjeta-titulo">El plus que ofrece nuestra plataforma</h2>
      <ul class="lista-plus">
        <li v-for="beneficio in plus" :key="beneficio">{{ beneficio }}</li>
      </ul>
    </section>

    <section class="redes">
      <h2 class="redes-titulo">Síguenos en nuestras redes</h2>
      <p class="redes-texto">Entérate de novedades, consejos y promociones.</p>

      <div class="redes-botones">
        <a
          v-for="red in redes"
          :key="red.nombre"
          :href="red.url"
          :class="['btn-red', red.clase]"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg v-if="red.clase === 'facebook'" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 8h3V4h-3c-2.76 0-5 2.24-5 5v2H7v4h2v7h4v-7h3l1-4h-4V9c0-.55.45-1 1-1z" />
          </svg>
          <svg v-else-if="red.clase === 'instagram'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
          </svg>
          <svg v-else-if="red.clase === 'tiktok'" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 3c.3 2.4 1.8 4 4 4.3v3.2c-1.5 0-2.8-.4-4-1.2V15a6 6 0 1 1-6-6c.3 0 .7 0 1 .1v3.3a2.8 2.8 0 1 0 2 2.6V3h3z" />
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
            <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z" />
            <path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.5-2-1-1 1c-1.2-.5-2.5-1.8-3-3l1-1-1-2L9 8.5z" fill="currentColor" stroke="none" />
          </svg>
          {{ red.nombre }}
        </a>
      </div>
    </section>
  </div>
</template>

<style scoped>
.nosotros-view {
  display: flex;
  flex-direction: column;
  gap: 1.8rem;
  max-width: 1200px;
  margin: 0 auto;
}

.hero {
  background: linear-gradient(120deg, #1f62e7, #3d96ef);
  color: white;
  border-radius: 24px;
  padding: 3rem;
  box-shadow: 0 12px 30px rgba(31, 98, 231, 0.25);
}

.etiqueta {
  text-transform: uppercase;
  letter-spacing: 2px;
  font-size: 0.85rem;
  color: #bfdbfe;
  margin-bottom: 0.5rem;
}

.titulo {
  font-size: 3.2rem;
  font-weight: 900;
  letter-spacing: -1px;
  margin-bottom: 1rem;
}

.descripcion {
  font-size: 1.15rem;
  line-height: 1.7;
  max-width: 760px;
  color: #eff6ff;
}

.grid-3,
.grid-2 {
  display: grid;
  gap: 1.5rem;
}

.grid-3 {
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.grid-2 {
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
}

.tarjeta {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.06);
}

.tarjeta-icono {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: #eff6ff;
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.tarjeta-titulo {
  font-size: 1.4rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.7rem;
}

.tarjeta-texto {
  color: #475569;
  line-height: 1.65;
}

.lista-plus {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 0.8rem 2rem;
  padding: 0;
  list-style: none;
}

.lista-plus li {
  position: relative;
  padding-left: 1.8rem;
  color: #475569;
  line-height: 1.6;
}

.lista-plus li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #2563eb;
  font-weight: 800;
}

.redes {
  text-align: center;
  background: white;
  border-radius: 20px;
  padding: 2.5rem 2rem;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.06);
}

.redes-titulo {
  font-size: 1.6rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.4rem;
}

.redes-texto {
  color: #64748b;
  margin-bottom: 1.5rem;
}

.redes-botones {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
}

.btn-red {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.8rem 1.6rem;
  border-radius: 30px;
  color: white;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-red svg {
  width: 20px;
  height: 20px;
}

.btn-red:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.18);
}

.facebook { background: #1877f2; }
.instagram { background: linear-gradient(45deg, #f58529, #dd2a7b, #8134af); }
.tiktok { background: #111827; }
.whatsapp { background: #22c55e; }

@media (max-width: 700px) {
  .hero { padding: 2rem 1.5rem; }
  .titulo { font-size: 2.4rem; }
  .grid-2 { grid-template-columns: 1fr; }
}
</style>
