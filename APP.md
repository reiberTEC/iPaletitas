# iPaletitas como aplicación

No es un sitio web para “visitar”. Es la **app del mostrador**: se instala en el dispositivo y se abre a pantalla completa en escritorio, tableta o celular.

## Cómo descargarla hoy (PWA)

Con la app publicada (o en `npm run build` + `npm run preview` en HTTPS/localhost):

| Dispositivo | Cómo instalarla |
|-------------|-----------------|
| **Windows / Mac** (Chrome o Edge) | Botón **Instalar aplicación** en la sección Descargar, o menú ⋮ → Instalar iPaletitas / ícono ⊕ en la barra. Queda en el menú Inicio / Applications. |
| **Android** (Chrome) | Igual: Instalar o “Añadir a la pantalla de inicio”. Aparece como ícono de app. |
| **iPhone / iPad** (Safari) | Compartir → **Añadir a pantalla de inicio** → Añadir. |

Eso es una **PWA** (aplicación web progresiva): mismo código Vue, empaquetado como app instalable. No pasa por Play Store ni Microsoft Store todavía, pero el dueño ya la “descarga” en su caja o tablet.

## Idea de descarga a futuro (tiendas)

Cuando haya backend + PostgreSQL estables:

1. **Android (Play Store)** — empaquetar con **Capacitor** → APK / AAB.
2. **Windows (.exe / Microsoft Store)** — **Tauri** o Electron sobre el mismo frontend.
3. **iOS (App Store)** — Capacitor + cuenta de desarrollador Apple (requiere Mac).

Misma interfaz; cada tienda reparte el instalador. La landing seguiría siendo solo el escaparate para crear cuenta y el enlace “Descargar”.

## Qué ya quedó en el código

- Manifest + service worker (`vite-plugin-pwa`)
- Iconos en `frontend/public/icons/`
- Meta de app (Apple / Android)
- Sección **Descargar** en la portada con botón de instalar
- Clase `app-instalada` cuando corre en modo standalone (sin barra del navegador)

## Orden recomendado

1. ~~PostgreSQL + API~~ (datos compartidos entre dispositivos).
2. **Publicar en HTTPS** — ver [`DEPLOY.md`](DEPLOY.md) (Render + Postgres en la nube). Ahí los clientes instalan la PWA.
3. Más adelante: APK / instalador de Windows si quieres aparecer en tiendas.

## Producción (mismo origen)

En producción el backend sirve el build del panel (`frontend/dist`) y la API bajo `/api`. Un solo dominio HTTPS = PWA instalable sin líos de CORS.
