---
name: iPaletitas
description: Punto de venta e inventario para negocios de mostrador, pintado con el color de cada negocio.
colors:
  linea-negocio: "#295bdc"
  linea-negocio-hondo: "#1c48bb"
  linea-negocio-claro: "#f3f7ff"
  tinta: "#0f172a"
  tinta-suave: "#475569"
  anden: "#f8fafc"
  papel: "#ffffff"
  regla: "#e2e8f0"
  noche: "#0b0f17"
  noche-superficie: "#131a26"
  agotado: "#e11d48"
  por-acabarse: "#ea580c"
  oro-paleta: "#fcd34d"
typography:
  display:
    fontFamily: "'Unbounded Variable', 'Archivo Variable', ui-sans-serif, sans-serif"
    fontSize: "clamp(2.85rem, 16vw, 6rem)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "'Unbounded Variable', 'Archivo Variable', ui-sans-serif, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    letterSpacing: "-0.02em"
  title:
    fontFamily: "'Unbounded Variable', 'Archivo Variable', ui-sans-serif, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
  body:
    fontFamily: "'Archivo Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'Archivo Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    fontFeature: "'tnum'"
rounded:
  sm: "6px"
  md: "10px"
  lg: "12px"
  xl: "16px"
  picto: "28%"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.linea-negocio}"
    textColor: "{colors.papel}"
    rounded: "{rounded.lg}"
    height: "40px"
    padding: "0 16px"
  button-primary-hover:
    backgroundColor: "{colors.linea-negocio-hondo}"
  button-outline:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.lg}"
    height: "40px"
  button-punto-venta:
    backgroundColor: "{colors.linea-negocio}"
    textColor: "{colors.papel}"
    typography: "{typography.title}"
    rounded: "{rounded.xl}"
    height: "48px"
  input:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.md}"
    height: "44px"
    padding: "10px 14px"
  card:
    backgroundColor: "{colors.papel}"
    rounded: "{rounded.xl}"
  picto:
    backgroundColor: "{colors.linea-negocio}"
    textColor: "{colors.papel}"
    rounded: "{rounded.picto}"
    size: "36px"
---

# Design System: iPaletitas

## Overview

**Creative North Star: "La línea de tu negocio"**

iPaletitas toma la gramática del Metro de la Ciudad de México y de la identidad de México 68 de Lance Wyman: cada negocio es una línea con su propio color, cada sección del sistema es una estación con su pictograma, y el recorrido entre secciones se lee como un trayecto. El color de la línea no lo decide iPaletitas: sale del logo de quien contrata el sistema, y todo el panel lo adopta.

Es un sistema de trabajo diario para mostrador, así que la densidad es media-alta: tablas con reglas finas, cifras de ancho fijo y superficies planas que no compiten con los datos. La expresión vive en tres lugares: la tipografía Unbounded en títulos y cifras grandes, los pictogramas de estación y la línea de metro del menú. Todo lo demás es silencioso.

**Key Characteristics:**
- Un solo color de acento por pantalla: el de la línea del negocio, en su escala 50–950.
- Superficies planas; la profundidad solo aparece en lo que flota (ventanas emergentes, cajón del menú).
- Pictogramas de estación: ícono blanco sobre un cuadro redondeado del color de la línea.
- Cifras tabulares en todo lo que es dinero, existencias o conteos.
- Movimiento breve y con propósito; una sola pieza de autor por superficie.

## Colors

Un color de marca intercambiable sobre neutros pizarra fríos; el modo oscuro usa una noche azulada, nunca negro puro.

### Primary
- **Línea del negocio** (`linea-negocio`): botones principales, "Punto de venta", estación activa, pictogramas, barras de la gráfica del periodo actual, selección de texto, cursor y anillos de foco. Es una variable (`--marca-600`) que `lib/marca.ts` recalcula desde el logo del negocio; el valor del frontmatter es el azul de iPaletitas por omisión.
- **Línea honda** (`linea-negocio-hondo`): hover del botón principal y estado activo del Punto de venta.
- **Andén claro** (`linea-negocio-claro`): fondos de resaltado suave (hover de filas, avisos informativos).

### Neutral
- **Tinta** (`tinta`): texto principal y títulos.
- **Tinta suave** (`tinta-suave`): texto secundario y estaciones inactivas.
- **Andén** (`anden`): fondo general del panel.
- **Papel** (`papel`): tarjetas, menú, encabezado y ventanas.
- **Regla** (`regla`): bordes de tarjetas y separadores de una línea.
- **Noche / Noche superficie** (`noche`, `noche-superficie`): fondo y superficies del modo oscuro.

### Tertiary
- **Agotado** (`agotado`) y **Por acabarse** (`por-acabarse`): avisos de inventario. Nunca se sustituyen por el color de la línea, para que el significado sobreviva a cualquier marca.
- **Oro paleta** (`oro-paleta`): exclusivo del palito de `PaletaIcon` y de acentos de la mascota.

### Named Rules
**The Línea Ajena Rule.** Ningún componente nuevo escribe un azul en hexadecimal: el color de marca se usa siempre como `var(--marca-*)` o con las utilidades `blue-*`, que están remapeadas a la línea del negocio.

**The Escala Legible Rule.** El texto blanco solo va sobre el paso 600 o más oscuro (≥4.5:1 garantizado por la escalera de luminosidad OKLCH); el paso 500 se reserva para íconos y bordes.

## Typography

**Display Font:** Unbounded Variable (con Archivo de respaldo)
**Body Font:** Archivo Variable (con ui-sans-serif, system-ui)

**Character:** Unbounded aporta la geometría ancha y redonda de la señalética del 68; Archivo es una sans de trabajo, compacta y legible a 16px en mostrador.

### Hierarchy
- **Display** (600, clamp(2.85rem, 16vw, 6rem), 1): titular de la portada pública, máximo dos líneas.
- **Headline** (600, 1.75rem): títulos de sección del panel (`Encabezado`).
- **Title** (600, 1–1.125rem): título del encabezado del panel, títulos de ventanas, botón Punto de venta.
- **Body** (400, 1rem, 1.5): texto corrido; descripciones limitadas a 65ch.
- **Label** (600, 0.875rem, cifras tabulares): etiquetas de campo, encabezados de tabla, insignias.

### Named Rules
**The Dos Voces Rule.** Solo Unbounded y Archivo. Nada de monoespaciadas ni etiquetas diminutas en mayúsculas con espaciado.

**The Cifra Fija Rule.** Todo número que se compara (dinero, piezas, días) usa cifras tabulares.

## Layout

El panel es una aplicación de dos zonas: un riel fijo de 18rem (288px) a partir de 1024px, y un cajón deslizable por debajo de ese ancho. El contenido se centra en un máximo de 80rem con márgenes de 16px en celular y 32px desde 640px. El alto de la app usa `100dvh`; encabezado, cajón y contenido respetan las zonas seguras del dispositivo. La portada pública usa márgenes `clamp(1.25rem, 3vw, 2.5rem)` y héroes en `svh`.

## Elevation & Depth

El sistema es plano. Las tarjetas, el menú y el encabezado se separan por tono (andén contra papel) y por una regla de 1px, nunca por sombra en reposo. La sombra solo aparece en lo que flota sobre la página.

### Shadow Vocabulary
- **Flotante** (`box-shadow: 0 24px 48px -12px rgb(15 23 42 / 0.28), 0 2px 6px rgb(15 23 42 / 0.08)`): ventanas emergentes.
- **Cajón** (`box-shadow: 0 24px 48px -12px rgb(15 23 42 / 0.25)`): menú abierto en celular.

### Named Rules
**The Plano en Reposo Rule.** Sin degradados, sin brillos, sin vidrio ni desenfoque. Si algo no flota, no lleva sombra.

## Shapes

Esquinas suaves y consistentes: 6px en insignias, 10px en campos, 12px en botones, 16px en tarjetas y ventanas. Los pictogramas de estación son cuadros con esquina del 28%, la forma de las señales del Metro. La línea del menú es un trazo de 3px con extremos redondeados.

## Components

### Buttons
- **Shape:** esquinas suaves (12px).
- **Primary:** línea del negocio con texto blanco, 40px de alto, 16px de relleno horizontal.
- **Hover / Focus:** pasa a línea honda en 150ms; el hover solo existe con puntero fino. Foco con contorno de 2px en el paso 500 y 2px de separación.
- **Press:** cede a `scale(0.97)` en 160ms con `cubic-bezier(0.23, 1, 0.32, 1)`.
- **Outline / Ghost / Secondary:** papel con anillo interior de regla; transparente con hover pizarra; oro para acciones de licencia.

### Cards / Containers
- **Corner Style:** 16px.
- **Background:** papel.
- **Shadow Strategy:** ninguna (ver Elevation & Depth).
- **Border:** 1px de regla.

### Inputs / Fields
- **Style:** papel, borde de 1px, 10px de radio, 44px de alto mínimo; 16px de texto en pantallas táctiles.
- **Focus:** borde en el paso 500 y halo de 3px al 22% del mismo color.
- **Disabled:** fondo gris claro y texto tinta suave.

### Navigation
La línea de metro: cada sección es una estación con su pictograma de 32px (contorno de 2px en el paso 300, ícono en el 700). La estación activa es un cuadro lleno del color de la línea que se desliza por el trazo hasta la sección elegida (`translateY`, 200ms, `cubic-bezier(0.77, 0, 0.175, 1)`); con movimiento reducido solo aparece. Los grupos (Operación, Administración, iPaletitas) son tramos de la misma línea.

### Pictograma de estación
Cuadro de 36px con esquina del 28%, color de la línea y ícono blanco. Acompaña el título de la sección en el encabezado.

### Mi marca
El negocio sube su logo; el sistema propone hasta cinco colores del logo, muestra la escala completa y una vista previa del panel con su color antes de aplicarlo.

## Do's and Don'ts

### Do:
- **Do** usar `var(--marca-*)` o utilidades `blue-*` para todo lo que sea color de marca.
- **Do** usar Unbounded para títulos y cifras grandes, y Archivo con cifras tabulares para datos.
- **Do** animar solo `transform` y `opacity`, con duraciones de 150–250ms y las curvas `--ease-out`, `--ease-in-out` y `--ease-drawer`.
- **Do** dar a cada control táctil al menos 44px y retroalimentación al presionarlo.
- **Do** usar rosa y naranja para avisos de inventario, nunca el color de la línea.

### Don't:
- **Don't** usar degradados, texto con degradado, brillos, vidrio o desenfoque decorativo.
- **Don't** poner etiquetas encima de los títulos ni numerar secciones (01, 02, 03).
- **Don't** dejar animaciones en bucle infinito ni usar curvas con rebote en la interfaz.
- **Don't** escribir hexadecimales azules en componentes nuevos.
- **Don't** poner texto blanco sobre pasos de la línea más claros que el 600.
