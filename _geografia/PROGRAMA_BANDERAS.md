# Programa de Banderas — sub-sección de Geografía

> Planeado 2026-10-23. Fase 0 y Fase 1 en construcción (2026-10-23). Estado vivo en
> `PLAN_MAESTRO.md` §8. Motivo: el hijo (2º de primaria) está emocionado con las banderas.

## Decisiones del papá (2026-10-23)

- Sub-sección **dentro de Geografía**. **Álbum coleccionable: sí** (Fase 3; desde la
  Fase 1 cada reto lleva `bandera` o `bandera_id` para poder contarlo).
- **Mundial 2026** (48 selecciones, lista verificada) y **banderas históricas**: es muy
  bueno con ellas (Imperio Mexicano, Prusia, Imperio Alemán, Ruso, Japonés…), sobre todo
  Europa, América Latina, estados de EE.UU., Japón y China → track **GBH** desde ya.
- **Banderas polémicas sí entran** (Alemania 1935-45, Confederación, URSS, sol naciente):
  descripción neutral y breve; nada racista; no se profundiza.
- **Historia de países dentro de Banderas** por ahora (mini-historias por imperio/país);
  si crece, se separa como frente propio.
- Mapa 110m: no tiene países chicos (Singapur, Mónaco, Malta, casi todo el Caribe chico):
  "bandera → mapa" solo con países que existen ahí; los demás en image-picker.

---

## 1. Decisión de estructura

**Sub-sección dentro de Geografía, no materia nueva** (mismo criterio que el
Observatorio dentro de Ciencias): una sub-sección solo cuesta una tarjeta en Bóveda;
una materia nueva cuesta MateriaToggle + colección + reglas de Firestore + Dashboard.

- Documentos con `"tipo": "banderas"`, `"materia": "geografia"`, nivel `GB…`.
- Carpeta `_geografia/banderas/`. Colección `geografia` (la de siempre).
- Tarjeta en `src/data/tiposJuegos.js`: `{ id: 'geografia-banderas', emoji: '🏳️', nombre: 'Banderas', tipo: 'banderas', materia: 'geografia' }`.
  `Dashboard.detectMateria` ya lo resuelve por el prefijo `geografia-`.
- Las misiones dentro de cada documento son de los motores normales (image-picker,
  explorador-mapa, mini-story…), igual que las expediciones.
- `ExploradorMapa` hoy trata la bandera como *premio* ("preguntar por ella enseña
  banderas, no geografía"). Eso sigue valiendo en geografía normal; en este módulo la
  bandera **es** el tema, así que aquí sí se pregunta por ella.

---

## 2. Qué dice la investigación (y cómo se traduce al diseño)

| Hallazgo | Diseño |
|----------|--------|
| **Practicar recordando** (contestar sin ver) y **espaciar** el repaso funciona en primaria; con material difícil hacen falta repeticiones antes de espaciar. | Sesiones cortas (6-10 banderas), mezclar nuevas con ya vistas, y un **"repasar las que fallé"** (como el modo *review* de Seterra). |
| Seterra (el referente de geografía) tiene 3 modos: **señalar en el mapa**, **escribir el nombre** y **colocar etiquetas**; y deja elegir *qué* países practicar. | Banderas por **región o familia**, nunca las 195 de golpe. Modos: bandera→nombre, nombre→bandera, bandera→mapa, mapa→bandera. |
| Las banderas se confunden por **familias** (colores pan-árabes, pan-africanos, pan-eslavos; azul-blanco-azul de Centroamérica por la antigua Federación) y por **gemelas** (Chad/Rumania, Indonesia/Mónaco, Irlanda/Costa de Marfil, Australia/Nueva Zelanda). | Enseñar las familias como **historias** ("¿por qué se parecen?") y las gemelas como **juego de detective** ("¿en qué se distinguen?"). Discriminar lo parecido es justo lo que el niño necesita para no confundirlas. |
| Flagle: la bandera se **revela por partes**; menos pistas = mejor puntaje. | Juego "bandera escondida": se destapa por cuadritos; acertar con pocos cuadros da más estrellas. |
| NAVA, *Good Flag, Bad Flag*: 5 principios. El primero: **tan simple que un niño la pueda dibujar de memoria**; 2-3 colores; sin letras ni sellos; simbolismo con significado; distinta o emparentada a propósito. | Taller **"Diseña tu bandera"** con esas 5 reglas como checklist para niños. Y la regla 1 justifica "dibuja la bandera de memoria" como ejercicio. |
| México: **24 de febrero, Día de la Bandera** (fecha solemne por la Ley sobre el Escudo, la Bandera y el Himno); colores verde-esperanza, blanco-unidad, rojo-sangre de los héroes; el escudo cuenta la fundación de Tenochtitlan. | Unidad México a fondo, con el próximo 24 de febrero (2027) como meta. Conecta con los honores a la bandera de la escuela. |

**Coleccionar motiva** (en México el álbum del Mundial es cultura): un **álbum de
banderas** donde cada bandera dominada se pega como estampa.

---

## 3. Catálogo de actividades

Costo: **0** = solo contenido · **S** = cambio chico en motor existente · **M** = cambio
moderado · **N** = motor nuevo.

| # | Actividad | Motor | Costo |
|---|-----------|-------|-------|
| 1 | **¿De qué país es?** bandera → 4 nombres | image-picker (`imagen_url`) | 0 |
| 2 | **¿Cuál es la bandera de…?** nombre → 4 banderas | image-picker (opciones con `imagen`) | 0 + CSS (`contain` para no recortar Nepal, Qatar, Suiza) |
| 3 | **Bandera → tócala en el mapa/globo** | explorador-mapa, campo `pregunta_bandera` | S |
| 4 | **País resaltado en el mapa → elige su bandera** | explorador-mapa, modo `elige-bandera` | M |
| 5 | **Parejas** bandera ↔ país | tap-the-pairs con `es_img`/`en_img` | S |
| 6 | **Memorama** bandera ↔ país (y bandera ↔ bandera para la hija) | memoria con imágenes y pares distintos | M |
| 7 | **Gemelas**: "¿cuál es Chad y cuál Rumania?" con explicación de la diferencia | image-picker | 0 |
| 8 | **Familias de banderas** (nórdica, pan-africana, pan-árabe, pan-eslava, Centroamérica, Gran Colombia, Cruz del Sur, Union Jack) | mini-story + tap-the-pairs | 0 |
| 9 | **¿Qué significa?** México a fondo; Japón (sol), Canadá (hoja de arce), Brasil (el cielo de Río), Líbano (cedro), Chipre (su mapa), Nepal (forma única) | mini-story + true-or-false | 0 |
| 10 | **Colorea la bandera** (libre, con su paleta) | colorear + SVG propio de contorno | 0 (SVGs propios) |
| 11 | **Pinta la bandera correcta** (se comprueba: orden y dirección de franjas) | **pinta-bandera** | N |
| 12 | **Bandera escondida** (se destapa por cuadros) | **bandera-escondida** o variante de image-picker | S-N |
| 13 | **Diseña tu bandera** con las 5 reglas de NAVA | **taller-banderas** (reusa las plantillas de #11) | N |
| 14 | **Álbum de banderas** + "repasar las que me cuestan" | perfil + página de álbum | M-N |
| 15 | **Banderas del Mundial** (tema que engancha) | cualquiera de las anteriores | 0 — **la lista de selecciones se verifica antes de escribirla** |
| 16 | **Historia de la bandera de México** (Tres Garantías, estandarte de Hidalgo, escudos) | mini-story + image-picker (Wikimedia) | 0 |

### Motores nuevos, en detalle

**pinta-bandera (#11).** Plantillas paramétricas, no un SVG dibujado por bandera:
`tricolor-vertical`, `tricolor-horizontal`, `bicolor-h`, `bicolor-v`, `cruz-nordica`,
`triangulo-izquierdo`, `circulo-centro`, `canton` (cuadro arriba a la izquierda). El
JSON dice la plantilla y los colores correctos; el niño elige color y toca la franja.
Al terminar se compara región por región ("el verde va del lado del asta").
Emblemas complejos (el escudo de México) van como imagen fija encima, no se pintan.
Con 8 plantillas sale la mayoría de las banderas sencillas de memoria (Francia, Italia,
Alemania, Colombia, Perú, Japón, Suecia, Rusia, Nigeria…).

**bandera-escondida (#12).** La bandera tapada por una cuadrícula 4×3; cada error o
"pista" destapa un cuadro; 4 opciones de nombre. Estrellas según cuadros destapados.

**taller-banderas (#13).** Mismas plantillas + paleta + símbolos sencillos (estrella,
sol, luna, hoja, círculo). Checklist en vivo de las reglas de NAVA: "✅ 3 colores o menos",
"✅ sin letras", "¿la podrías dibujar de memoria?". Guarda el diseño como los dibujos
(localStorage hoy; Firebase Storage cuando exista la galería "Mis Dibujos", §9 del plan).

**Álbum (#14).** Campo nuevo en el perfil: `banderasColeccion: { mx: { aciertos, fallos, ultima } }`
(misma técnica de ruta con punto que `aventurasProgreso`). Los motores necesitan avisar
cada acierto: callback `onAcierto({ bandera: 'mx' })` además del `onCompletar()` actual.
Una bandera se "pega" en el álbum al acertarla 3 veces en días distintos (espaciado);
las que más falla alimentan "Repasar las que me cuestan".

---

## 4. Niveles

| Nivel | Para | Contenido |
|-------|------|-----------|
| **GB0** | Hija (4 años), papá lee | Bandera de México (colores, escudo, colorear), memorama de banderas iguales, "encuentra la de México" entre 3 |
| **GB1** | Hijo (ahora) | México a fondo + Día de la Bandera; vecinos y Latinoamérica; las banderas más famosas; familias de América (Centroamérica, Gran Colombia); Mundial |
| **GB2** | Hijo, después | Europa y Asia; familias nórdica, pan-eslava, pan-árabe; gemelas; significados |
| **GB3** | Largo plazo | África y Oceanía (pan-africana, Cruz del Sur, Union Jack); todas mezcladas; banderas difíciles |

Convención de archivos: `_geografia/banderas/GB1-01_bandera-de-mexico.json`.

---

## 5. Base compartida: tabla de países (resuelve también el pendiente del tooltip)

Hoy no existe en la app ninguna tabla de países: los nombres viven en cada JSON y el
mapa (world-atlas) solo trae nombres en inglés y códigos ISO **numéricos**, mientras
que las banderas (flagcdn) usan códigos **alfa-2**.

**`chuy-react-app/src/data/paises.js`**, generado una vez y revisado a mano:

```js
// numérico ISO 3166-1 → { a2, es }
export const PAISES = { '484': { a2: 'mx', es: 'México' }, '392': { a2: 'jp', es: 'Japón' }, … };
export const banderaUrl = (a2, ancho = 160) => `https://flagcdn.com/w${ancho}/${a2}.png`;
```

- Nombres: `Intl.DisplayNames(['es-MX'], { type: 'region' })` da casi todos bien
  (probado: México, Países Bajos, Corea del Sur, Emiratos Árabes Unidos…). Correcciones
  a mano: Côte d'Ivoire → **Costa de Marfil**; Territorios Palestinos → **Palestina**;
  Myanmar (Birmania) → **Birmania (Myanmar)**; revisar Chequia, Eswatini, Timor Oriental.
- world-atlas tiene 3 países **sin código**: Kosovo, Chipre del Norte, Somalilandia
  (además los tres comparten la misma clave vacía: tocar uno "es" tocar los tres). Se
  les asigna un id propio en el mapa.
- El validador comprueba que **cada país del mapa** tenga entrada en la tabla.

### El pendiente: nombres en español al tocar un país (modo explorar)

1. `getCountryName` de `ExploradorMapa` usa `PAISES[id].es` en los mapas de mundo/globo.
2. `mexico-estados`: corregir los nombres viejos del GeoJSON ("Distrito Federal" →
   Ciudad de México; "México" → Estado de México; revisar acentos).
3. `usa-estados`: exónimos en español donde se usan en México (Nueva York, Nuevo México,
   Carolina del Norte/Sur, Dakota del Norte/Sur, Virginia Occidental, Pensilvania,
   Hawái, Luisiana); el resto igual.
4. Verificar: explorar en G0-01b y un par de mapas con capturas; validador sin errores.

Costo: S. Va primero porque la tabla es la base de todo el módulo.

---

## 6. Fases

| Fase | Qué | Costo | Resultado para el niño |
|------|-----|-------|------------------------|
| **0** | Tabla `paises.js` + tooltip en español + `banderaUrl` + CSS `contain` en opciones con bandera + reglas del validador para `tipo: banderas` y códigos alfa-2 | S | Nombres en español en el mapa |
| **1** | Tarjeta "Banderas" + GB1-01 México a fondo (significado, colorear, 24 de febrero) + GB1-02 Latinoamérica en ambos sentidos + GB1-03 familias de América + GB1-04 famosas del mundo. Motores: parejas con imagen (#5) y bandera→mapa (#3) | 0 + S | Ya puede jugar banderas con 4-5 tipos de juego |
| **2** | pinta-bandera (#11), memorama con imágenes (#6), mapa→bandera (#4), bandera escondida (#12); GB0 para la hija; GB2 Europa/gemelas | N + M | Juegos de "hacer", no solo de elegir |
| **3** | Álbum + repaso de las falladas (#14), taller "Diseña tu bandera" (#13) | M-N | Colección que motiva volver |

Validación como siempre: `node _geografia/_valida.mjs`, recorrido en pantalla con
`qa-navegador/chuymath-geo-recorrido.mjs` (computadora y celular) y migración desde
`/admin/migracion`.

---

## 7. Decisiones pendientes del papá

1. ¿Sub-sección de Geografía (recomendado) o materia propia?
2. ¿Álbum coleccionable? Es lo que más motiva, pero toca el perfil (campo nuevo).
3. Tema Mundial: ¿qué selecciones le interesan? (Verificar la lista de 2026 antes de escribirla.)
4. ¿Empezar por Fase 0 + 1?

## Fuentes

- NAVA, *Good Flag, Bad Flag*: https://nava.org/good-flag-bad-flag
- Seterra (modos de juego, repaso de falladas): https://www.seterra.net · https://freetech4teach.teachermade.com/?p=8335
- Flagle (revelar por partes): https://github.com/amckenna41/flagle
- Familias de banderas (FOTW FAQ): https://fotw.info/flags/faq2.html
- Banderas parecidas: https://www.worldatlas.com/articles/country-flags-that-resemble-one-another.html
- Práctica de recuperación y espaciado en primaria: https://www.learningscientists.org/blog/2017/7/20-1
- Día de la Bandera (México): https://politica.expansion.mx/sociedad/2024/02/19/dia-de-la-bandera-mexico-por-que-se-celebra-24-febrero · https://www.personal.unam.mx/Docs/Cendi/dia-bandera.pdf
- flagcdn / Flagpedia (dominio público, pide enlace): https://flagpedia.net/download
- flag-icons (SVG, MIT): https://flagicons.lipis.dev
