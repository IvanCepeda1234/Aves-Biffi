# Aves Biffi — Avistamientos del Colegio Biffi La Salle

Página web para gestionar los avistamientos de aves del Colegio Biffi La Salle (Barranquilla).
Muestra datos de ejemplo de **eBird** e **iNaturalist**, un mapa y un formulario de registro.

Desarrollado por **Iván Cepeda** · Trabajo final IV periodo.

## Estructura

```
aves-biffi/
├── index.html            Página principal (header con logo, listado, mapa, formulario, créditos)
├── css/styles.css        Estilos (modo claro/oscuro, responsive)
├── js/
│   ├── config.js         Coordenadas del colegio, radio y límites
│   ├── api.js            Conexión a eBird (vía /api) e iNaturalist
│   ├── store.js          Registros propios (localStorage por ahora)
│   ├── ui.js             Tarjetas, estadísticas y mapa (Leaflet)
│   └── app.js            Arranque, filtros y formulario
├── api/ebird.js          Función serverless de Vercel (oculta la API key de eBird)
├── assets/
│   ├── logo-colegio.png  ← AGREGAR el logo oficial aquí
│   └── logo-placeholder.svg
├── vercel.json
└── .env.example
```

## Antes de desplegar

1. **Logo:** guarda el logo oficial como `assets/logo-colegio.png` (mientras no exista, se muestra el placeholder).
2. **Ubicación:** ajusta `centro` en `js/config.js` con las coordenadas exactas del colegio.
3. **eBird API key:** pídela gratis en https://ebird.org/api/keygen.
   Sin key la página funciona igual con iNaturalist.

## Desplegar en Vercel

1. Sube la carpeta a un repositorio de GitHub.
2. En https://vercel.com/new importa el repositorio (Framework Preset: **Other**, sin build command).
3. En *Settings → Environment Variables* agrega `EBIRD_API_KEY` con tu key.
4. Deploy. El enlace queda como `https://<proyecto>.vercel.app`.

## Desarrollo local

```bash
npm i -g vercel
vercel dev          # sirve la página y la función /api/ebird
```

## Próximos pasos

- Base de datos real para los registros del colegio (Supabase o Vercel Postgres).
- Subida de fotos de los avistamientos.
- Inicio de sesión para docentes/moderadores.
