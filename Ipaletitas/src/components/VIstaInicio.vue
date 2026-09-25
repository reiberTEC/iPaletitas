<template>
  <div class="home-view">
    <div class="hero-section">
      <h1 class="business-name">[Inserte nombre del Negocio]</h1>
      <p class="business-slogan">
        [Inserte Eslogan del Negocio] <span class="optional">[Opcional]</span>
      </p>
    </div>

    <div class="cards-grid">
      <div class="plan-card">
        <h3 class="card-subtitle">Tu Plan</h3>
        <h2 class="card-title">Estándar</h2>
        <button class="action-btn">Ver Plan</button>
      </div>
      <div class="plan-card">
        <h3 class="card-subtitle">Novedades</h3>
        <h2 class="card-title">Versión [Nº versión]</h2>
        <button class="action-btn">Detalles</button>
      </div>
      <div class="plan-card">
        <h3 class="card-subtitle">Actualizar</h3>
        <h2 class="card-title">Plan</h2>
        <button class="action-btn">Ver Opciones</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero-section { margin-bottom: 2.5rem; }
.business-name { font-size: 3.5rem; font-weight: 900; color: #0f172a; letter-spacing: -1px; margin-bottom: 0.5rem; }
.business-slogan { font-size: 1.1rem; color: #334155; font-weight: 300; }
.business-slogan .optional { color: #64748b; }
.cards-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
.plan-card { background: #f8fafc; border-radius: 20px; padding: 3.5rem 2.5rem; display: flex; flex-direction: column; align-items: flex-start; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
.card-subtitle { font-size: 1.8rem; font-weight: 300; color: #1e293b; margin-bottom: 1rem; }
.card-title { font-size: 3.2rem; font-weight: 800; color: #0f172a; margin-bottom: 3rem; letter-spacing: -1px; }
.action-btn { background: linear-gradient(90deg, #3b82f6, #2563eb); color: white; border: none; padding: 1rem 2.5rem; border-radius: 30px; font-size: 1.2rem; cursor: pointer; margin-top: auto; box-shadow: 0 4px 15px rgba(37,99,235,0.25); transition: transform 0.2s; }
.action-btn:hover { transform: scale(1.02); }
</style>