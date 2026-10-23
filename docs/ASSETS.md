# Archivos de cada casete

Las carpetas `for-you`, `beginning`, `late-night`, `home`, `road` y `forever` dentro de `public/assets/cassettes/` conservan los seis diseños: cielo, noche, tipografía, flores, viaje y grafiti. Cada una contiene:

| Archivo | Uso |
| --- | --- |
| `spine.svg` | Lomo de la colección, con fondo y título |
| `label.svg` | Etiqueta, con ventana transparente para carretes y cinta |
| `reel.svg` | Imagen propia de los dos carretes principales |
| `guide-roller.svg` | Imagen propia del rodillo de apoyo |
| `hardware.json` | Colores que utiliza el generador de carretes y rodillos |

Las rutas están explícitas en `src/data/mixtapes.ts`:

```ts
artwork: {
  spine: 'assets/cassettes/for-you/spine.svg',
  label: 'assets/cassettes/for-you/label.svg'
},
hardware: {
  reel: 'assets/cassettes/for-you/reel.svg',
  guideRoller: 'assets/cassettes/for-you/guide-roller.svg'
}
```

Edita un SVG con un editor vectorial o reemplázalo por un PNG transparente y actualiza la ruta. Las rutas parten de `public/`, sin incluir ese prefijo ni una barra inicial. `resolveAsset()` respeta la base de Vite y también acepta URLs completas o datos embebidos.

## Cubiertas

- **Lomo:** conserva `viewBox="0 0 400 80"`. El diseño y el texto están dentro del SVG; el plástico y sus reflejos se superponen mediante CSS.
- **Etiqueta:** conserva `viewBox="0 0 1076 610"`, su silueta y la ventana transparente. Si exportas PNG, mantén esa proporción y transparencia.
- Los títulos impresos son elementos `<text>` editables. Para renombrar un casete, cambia `title` en el registro y el texto de sus dos cubiertas. El registro también proporciona el nombre accesible del botón.

## Colores de carretes y rodillos

Cada casete tiene dos colores independientes en `hardware.json`:

```json
{
  "reelColor": "#f3d8bf",
  "guideRollerColor": "#d391a5"
}
```

Después de editarlos, ejecuta:

```sh
node scripts/build-cassette-hardware.mjs
```

El script reconstruye los pares de SVG de cada carpeta con `hardware.json`. Usa `design/hardware/reel.png` y la versión reducida `design/hardware/guide-roller.display.png`; el original del rodillo se conserva en `design/hardware/guide-roller.png`. Cada SVG incorpora la imagen y aplica un tinte con `feFlood`, conservando textura y transparencia, sin depender de imágenes externas. Si sustituyes estos SVG manualmente, conserva el centro de giro y la proporción de su lienzo; el generador sobrescribe ambos archivos.

El rodillo se muestra a menos de 40 píxeles CSS. Su versión de pantalla mide 190 × 192 píxeles para mantener detalle en pantallas de alta densidad sin descargar y decodificar el original de 969 × 977 en cada casete. El SVG conserva su lienzo de 969 × 977 y ajusta la imagen a ese espacio, evitando que el redondeo del tamaño reducido cambie la proporción o el centro de giro.

Si reemplazas el original del rodillo, regenera la versión reducida con Python 3 y Pillow antes de ejecutar el generador de SVG:

```sh
python3 - <<'PY'
from pathlib import Path
from PIL import Image

source = Path('design/hardware/guide-roller.png')
with Image.open(source) as image:
    image.thumbnail((192, 192), Image.Resampling.LANCZOS)
    image.save(source.with_name('guide-roller.display.png'), optimize=True)
PY
node scripts/build-cassette-hardware.mjs
```

Incluye tanto la versión reducida como los SVG generados al guardar los cambios. Reconstruir los tintes normalmente solo requiere Node.js y utiliza la imagen reducida guardada en el repositorio.

## Capas compartidas y proporción

`public/assets/cassettes/shared/` contiene solo las capas físicas compartidas: `shell.png`, `glass.png` y `tape-wind.png`. Los originales de carretes y rodillos permanecen fuera de `public/`, en `design/hardware/`.

La carcasa usa como referencia **100.4 × 63.8 mm**, con proporción vertical `63.8 / 100.4` al girarla −90°, según las dimensiones descritas en [EP0557726A2](https://patents.google.com/patent/EP0557726A2/en). `src/styles/cassette.css` adapta el conjunto de capas y conserva sus centros; las etiquetas fuente siguen horizontales. Mantén carcasa, cristal, cinta, carretes y rodillo separados al crear nuevas imágenes.
