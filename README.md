# LOVELINE — Cassette Player

Una colección de seis mixtapes y una casetera en grafito: mecanismo vacío, casetes por capas, inserción y expulsión animadas, carretes que siguen la música y teclas con profundidad y sonido mecánico.

React 19 + TypeScript + Vite + Tailwind CSS 4 + Motion. Funciona en el navegador y se puede instalar como PWA, sin cuentas ni servicios externos.

## Desarrollo

```sh
npm install
npm run dev
npm run typecheck
npm run lint
npm run test:transport
```

En escritorio, la colección queda junto a la casetera. En móvil, el menú o **INSERT TAPE** abre la colección.

## Experiencia y movimiento

Loveline prioriza disfrutar una colección pequeña de canciones con el ritual de una casetera física. La tecla responde al momento; el casete se acerca, se alinea y se asienta con un movimiento continuo de **1,4 s**. **EJECT** lo levanta en **0,85 s** y lo deja apoyado sobre el mecanismo. Volver a presionarlo lo asienta en **0,9 s**; retirarlo toma **1,1 s**. Los sonidos acompañan los puntos de contacto y la música espera a **PLAY**.

Las imágenes se preparan de antemano para que la carga no marque ese ritmo. Con movimiento reducido, cada transición dura **0,08 s**. Las instrucciones para asistentes de IA están en [AGENTS.md](AGENTS.md); las trayectorias, duraciones y puntos de contacto compartidos con el audio están en `src/config/cassetteMotion.ts`.

El botón **RITMO**, junto al reloj, alterna entre **Lenta**, **Normal** y **Rápida**. La elección se guarda en ese navegador y dispositivo y se restaura al abrir la aplicación. Ajusta la entrada, expulsión, reinserción, retirada y lanzamiento del casete, con sus sonidos sincronizados. La velocidad de la música se conserva. El botón espera a que termine el movimiento actual; la preferencia de movimiento reducido tiene prioridad.

## Uso

1. La casetera comienza vacía. Elegir un casete lo introduce; la música espera a **PLAY**.
2. **PLAY** reproduce y mueve los carretes; la tecla permanece hundida.
3. **STOP** detiene el audio y conserva la posición.
4. **EJECT** pausa la música y deja el casete levantado, conservando la posición de la canción.
5. Presiona el casete levantado o la tecla **INSERT** para volver a asentarlo. La reproducción espera a **PLAY**.
6. Presiona fuera del casete, **RETIRAR** o **Escape** para sacarlo de la pantalla y reiniciar su posición. Elegir otro casete retira el anterior y después introduce el nuevo.
7. Con el casete levantado, arrástralo con el dedo o el ratón y suéltalo para lanzarlo en esa dirección. Un movimiento corto vuelve suavemente al mecanismo; un toque sigue insertando el casete. Con movimiento reducido, retirarlo usa un fundido breve.

La barra permite buscar en la canción; el corazón guarda favoritos por canción en el navegador. Cada casete empieza con una canción y admite varias: en ese caso aparecen controles anterior/siguiente. Al terminar una canción, la reproducción se detiene. Se respeta la preferencia de movimiento reducido.

Los tres clips instrumentales incluidos son demostraciones reutilizadas entre los seis casetes. Las portadas no implican grabaciones comerciales.

## Instalar y usar sin conexión

Prueba la versión de producción:

```sh
npm run build
npm run preview
```

Abre la dirección local y mantén la primera visita conectada hasta que el service worker termine de instalarse: guarda la aplicación, las imágenes y los cinco MP3, unos **41 MiB** en total. Después puedes abrir y reproducir la colección sin conexión. El modo de desarrollo no registra el service worker.

La instalación requiere HTTPS o localhost. Usa la opción **Instalar** del navegador; en Safari de iPhone, **Compartir → Añadir a pantalla de inicio**. Las actualizaciones esperan a que cierres todas las ventanas de Loveline y no recargan una reproducción en curso.

## Publicar en GitHub Pages

En el repositorio `Andy-Fernandez/nuestro-playlist`, abre **Settings → Pages** y selecciona **GitHub Actions** como Source. El workflow `.github/workflows/deploy.yml` instala las dependencias, compila la aplicación y publica `dist/` con cada push a `main`. También se puede ejecutar desde **Actions → Deploy to GitHub Pages → Run workflow**.

La dirección publicada es https://andy-fernandez.github.io/nuestro-playlist/. `vite.config.ts` configura `base: '/nuestro-playlist/'` para que scripts, imágenes, audio y service worker se carguen desde esa carpeta. Si cambia el nombre del repositorio, actualiza esa ruta.

## Personalización y archivos

Añade canciones en `public/audio/` y regístralas en `src/data/mixtapes.ts`. Asigna sus IDs en `songIds`; por ejemplo, `['s1', 's2']` crea un casete con dos pistas.

Cada casete tiene sus propios archivos de lomo, etiqueta, carrete y rodillo dentro de `public/assets/cassettes/<id>/`. Los seis diseños son editables y las capas físicas permanecen separadas. Consulta [archivos y cubiertas](docs/ASSETS.md) y [personalización](docs/MAKE-IT-YOURS.md).

| Cambiar | Archivo |
| --- | --- |
| Canciones, casetes y rutas de imágenes | `src/data/mixtapes.ts` |
| Carga y cambios de casete | `src/hooks/useCassetteTransport.ts` |
| Trayectorias y duraciones | `src/config/cassetteMotion.ts` |
| Casetera / casete físico / colección | `src/components/PlayerScreen.tsx` / `PhysicalCassette.tsx` / `Library.tsx` |
| Materiales, proporciones y tema | `src/styles/app.css` / `cassette.css` / `collection.css` |
| Sonidos / reproducción de música | `src/utils/mechanicalAudio.ts` / `src/hooks/useAudioEngine.ts` |
| PWA y caché sin conexión | `vite.config.ts` / `src/sw.ts` / `src/pwa.ts` |
| Mecanismo vacío proporcionado | `public/assets/background.png` |
