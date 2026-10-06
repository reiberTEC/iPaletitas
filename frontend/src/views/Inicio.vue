<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const pedidos = [
  { numero: '', cliente: '', descripcion: '', estado: '' },
  { numero: '', cliente: '', descripcion: '', estado: '' },
  { numero: '', cliente: '', descripcion: '', estado: '' },
  { numero: '', cliente: '', descripcion: '', estado: '' },
  { numero: '', cliente: '', descripcion: '', estado: '' }
]

const nuevoPedido = () => {
  console.log('Nuevo pedido')
}

const cerrarSesion = () => {
  localStorage.removeItem('token')
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="pagina">
    <!-- NAVBAR -->
    <header class="navbar">
      <div class="logo">
        <div class="logo-icon">🍭</div>
        <span>IPALETITAS</span>
      </div>

      <nav class="menu">
        <a class="activo" href="#">Inicio</a>
        <a href="#">Ventas</a>
        <a href="#">Empleados</a>
        <a href="#">Productos</a>
      </nav>

      <div class="usuario">
        <button class="buscar">🔍</button>
        <div class="avatar">👤</div>
        <div class="datos-usuario">
          <span class="bienvenida">¡Bienvenido,</span>
          <strong>Nombre_Usuario!</strong>
        </div>
        <button class="btn-logout" @click="cerrarSesion" title="Cerrar sesión">⎋</button>
      </div>
    </header>

    <!-- CONTENEDOR TABLA -->
    <main class="contenido">
      <section class="tabla-contenedor">
        <table>
          <thead>
            <tr>
              <th class="col-numero">N° pedido</th>
              <th class="col-cliente">Nombre cliente</th>
              <th class="col-descripcion">Descripcion</th>
              <th class="col-estado">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(pedido, index) in pedidos" :key="index">
              <td>{{ pedido.numero }}</td>
              <td>{{ pedido.cliente }}</td>
              <td>{{ pedido.descripcion }}</td>
              <td>{{ pedido.estado }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="acciones">
        <button v-for="n in 4" :key="n" class="btn-nuevo" @click="nuevoPedido">
          Nuevo pedido
        </button>
      </section>
    </main>
  </div>
</template>

<style scoped>
.pagina {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow-y: auto;

  background: linear-gradient(
    to bottom,
    #1f62e7 0%,
    #5384ed 43%,
    #dce6fa 100%
  );

  padding: 45px 40px 40px;
  font-family: Arial, Helvetica, sans-serif;
  box-sizing: border-box;
}

/* ============================= */
/* NAVBAR */
/* ============================= */

.navbar {
  height: 74px;
  background: #ffffff;
  border-radius: 40px;
  display: flex;
  align-items: center;
  padding: 0 32px;
  max-width: 1180px;
  margin: 0 auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 190px;
  font-size: 17px;
  font-weight: 700;
  color: #1f2937;
}

.logo-icon {
  font-size: 32px;
}

.menu {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 22px;
}

.menu a {
  text-decoration: none;
  color: #929292;
  min-width: 110px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 500;
  border-radius: 25px;
  transition: 0.2s;
}

.menu a:hover {
  background: #e8efff;
  color: #1f62e7;
}

.menu .activo {
  color: white;
  background: linear-gradient(to bottom, #1269da, #3d96ef);
  box-shadow: 0px 4px 10px rgba(18, 105, 218, 0.35);
}

.usuario {
  display: flex;
  align-items: center;
  gap: 14px;
}

.buscar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: none;
  background: #1f78e4;
  color: white;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, box-shadow 0.2s;
}

.buscar:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(31, 120, 228, 0.4);
}

.avatar {
  font-size: 30px;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #eef2ff;
  display: flex;
  justify-content: center;
  align-items: center;
}

.datos-usuario {
  display: flex;
  flex-direction: column;
  font-size: 14px;
  line-height: 18px;
  min-width: 130px;
}

.bienvenida {
  color: #999999;
}

.datos-usuario strong {
  font-size: 15px;
  color: #151515;
}

.btn-logout {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 22px;
  margin-left: 6px;
  color: #666;
  transition: color 0.2s, transform 0.2s;
}

.btn-logout:hover {
  color: #e11d48;
  transform: scale(1.15);
}

/* ============================= */
/* CONTENIDO */
/* ============================= */

.contenido {
  max-width: 1180px;
  margin: 40px auto 0;
}

/* ============================= */
/* TABLA */
/* ============================= */

.tabla-contenedor {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 30px 26px 20px;
  min-height: 460px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

table {
  width: 100%;
  border-collapse: collapse;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  overflow: hidden;
}

th,
td {
  border: 2px solid #272727;
  height: 66px;
  padding: 14px 20px;
  font-size: 17px;
  font-weight: normal;
}

th {
  text-align: left;
  font-size: 17px;
  font-weight: 600;
  background: rgba(219, 232, 255, 0.6);
}

.col-numero {
  width: 130px;
  font-size: 16px;
  color: #666;
}

.col-cliente {
  width: 280px;
  font-size: 17px;
  color: #666;
}

.col-descripcion {
  text-align: center;
}

.col-estado {
  width: 150px;
  text-align: center;
}

/* ============================= */
/* BOTONES */
/* ============================= */

.acciones {
  margin-top: 60px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}

.btn-nuevo {
  border: none;
  background: linear-gradient(to bottom, #0864df, #277ff0);
  color: white;
  height: 62px;
  flex: 1;
  max-width: 260px;
  border-radius: 32px;
  font-size: 18px;
  font-weight: 500;
  letter-spacing: 0.3px;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 6px 16px rgba(8, 100, 223, 0.3);
}

.btn-nuevo:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(8, 100, 223, 0.45);
}

.btn-nuevo:active {
  transform: translateY(-1px);
}

/* ============================= */
/* RESPONSIVE */
/* ============================= */

@media (max-width: 900px) {
  .pagina {
    padding: 24px 18px;
  }

  .navbar {
    height: auto;
    padding: 18px;
    flex-wrap: wrap;
    gap: 16px;
    border-radius: 24px;
  }

  .logo {
    width: auto;
    font-size: 15px;
  }

  .logo-icon {
    font-size: 26px;
  }

  .menu {
    order: 3;
    width: 100%;
    justify-content: space-between;
    gap: 8px;
  }

  .menu a {
    min-width: 70px;
    font-size: 13px;
    height: 36px;
  }

  .usuario {
    margin-left: auto;
    gap: 10px;
  }

  .datos-usuario {
    display: none;
  }

  .contenido {
    margin-top: 26px;
  }

  .tabla-contenedor {
    padding: 20px 14px 14px;
    min-height: auto;
    overflow-x: auto;
  }

  table {
    min-width: 780px;
  }

  th,
  td {
    height: 56px;
    font-size: 15px;
    padding: 10px 14px;
  }

  .acciones {
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 36px;
  }

  .btn-nuevo {
    max-width: none;
    width: 100%;
    height: 54px;
    font-size: 16px;
  }
}
</style>