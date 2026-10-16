# Personalizar Loveline

## Audio y cubiertas

Añade tus archivos a `public/audio/`, crea entradas con `id`, `title`, `artist` y `src` en `SONGS`, y asigna sus IDs a `MIXTAPES[].songIds` en `src/data/mixtapes.ts`. Los controles de pistas aparecen cuando un casete contiene más de una canción.

Las imágenes se asignan con `artwork.spine`, `artwork.label`, `hardware.reel` y `hardware.guideRoller`. Cada casete tiene su propia carpeta; consulta [ASSETS.md](ASSETS.md) para editar las cubiertas, cambiar colores de los carretes o sustituir imágenes.

La PWA incluye los archivos locales al compilar. Si añades archivos de más de 5 MiB, ajusta `maximumFileSizeToCacheInBytes` en `vite.config.ts` para incluirlos en la caché sin conexión.

## Tema y proporciones

`src/styles/app.css` define `--text-primary`, `--text-secondary`, `--surface-page`, `--surface-panel`, `--border-subtle` y `--color-loveline`. Escritorio y móvil usan el mismo tema oscuro; las portadas mantienen sus colores.

`src/styles/cassette.css` gira el conjunto físico −90° y usa una proporción vertical `63.8 / 100.4`. Las capas se ajustan como un solo conjunto, conservando alineación y centros de giro. El mecanismo vacío es `public/assets/background.png`; `.deck-bay` dimensiona la casetera y `.cassette-insertion` coloca el casete encima.

## Inserción y expulsión

`useCassetteTransport.ts` carga y decodifica las imágenes antes de mostrarlas. Sus estados son `empty → loading → inserting → ready → ejecting → empty`. Al cambiar de casete, conserva el anterior hasta completar su expulsión y luego introduce el nuevo. Los controles quedan bloqueados durante la carga y el movimiento.

Las trayectorias y duraciones están centralizadas en `src/config/cassetteMotion.ts`: inserción **1.18 s**, expulsión **1.45 s**. El transporte avanza mediante `onAnimationComplete`, sin temporizadores paralelos. Los sonidos usan esas mismas duraciones. La preferencia de movimiento reducido activa trayectos mínimos y mantiene los carretes inmóviles.

La música empieza con **PLAY**; **STOP** conserva el tiempo y **EJECT** lo reinicia. El audio y las transiciones físicas se controlan por separado.

## Teclas y sonidos

`.transport-key` y `.key-face` en `app.css` definen los materiales, las sombras y el recorrido al pulsar. `.is-latched` mantiene PLAY hundida durante la reproducción.

`src/utils/mechanicalAudio.ts` sintetiza impactos y roces con Web Audio. Ajusta `output.gain.value` para cambiar su volumen; conserva `playMechanicalSound(kind)` si sustituyes la síntesis por grabaciones locales.
