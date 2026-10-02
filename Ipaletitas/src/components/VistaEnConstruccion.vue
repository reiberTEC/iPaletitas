<script setup lang="ts">
defineProps<{ titulo: string }>()
</script>

<template>
  <div class="en-construccion">
    <span class="icono">🚧</span>
    <h1 class="titulo">{{ titulo }}</h1>
    <p class="texto">Estamos trabajando en esta sección. Muy pronto estará disponible.</p>
  </div>
</template>

<style scoped>
.en-construccion {
  max-width: 560px;
  margin: 4rem auto;
  padding: 3rem 2rem;
  text-align: center;
  background: white;
  border-radius: 24px;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.06);
}

.icono {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: #eff6ff;
  font-size: 2.2rem;
  margin-bottom: 1.2rem;
}

.titulo {
  font-size: 2.2rem;
  font-weight: 900;
  color: #0f172a;
  margin-bottom: 0.6rem;
}

.texto {
  color: #64748b;
  line-height: 1.6;
}
</style>
