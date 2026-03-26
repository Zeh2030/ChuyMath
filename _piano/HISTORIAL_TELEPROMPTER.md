# Historial de desarrollo del Piano Teleprompter

Documento de referencia con todos los enfoques probados, resultados y decisiones.

---

## Problema fundamental

abcjs renderiza notas con spacing basado en convenciones musicales, NO proporcional al tiempo:
- Notas cortas (semicorcheas): menos espacio del proporcional
- Notas largas (blancas, redondas): mas espacio del proporcional
- Barlines: agregan espacio que consume pixeles pero cero tiempo

Un scroll a velocidad constante (px/seg) se desincroniza porque los pixeles no corresponden linealmente al tiempo.

---

## Enfoque 1: Scroll constante + correccion por nota (original)

**Como funcionaba:**
- Scroll a velocidad constante (musicWidth / synth.duration)
- TimingCallbacks dispara evento por cada nota con su posicion real en el SVG
- Calcula error = posicion_real - posicion_esperada
- Absorbe correccion gradualmente (20% por frame)

**Resultado:** Funcionaba para una sola voz. Con multi-voz (grand staff), los eventos se duplicaban y la correccion se acumulaba, causando acelerones bruscos.

**Fix aplicado:** Cambiar `correctionRef += error` a `correctionRef = error` (no acumular). Mejoro pero seguia habiendo jitter en barlines.

---

## Enfoque 2: Strip barlines + scroll constante (sin correccion)

**Como funcionaba:**
- Quitar `|` del ABC antes de renderizar (preservar `|]`, `|:`, `:|`)
- Sin barlines, abcjs espacia notas mas uniformemente por duracion
- Agregar barlines como overlay visual (divs posicionados por tiempo)
- Eliminar sistema de correccion — scroll constante puro

**Resultado:** "Mucho mejor, casi perfecto" (palabras del usuario). Las negras sincronizaban bien. Las blancas sonaban ligeramente antes de llegar a la linea roja porque abcjs les da mas espacio del proporcional.

**Problema residual:** Con notas de diferentes duraciones (test con semicorcheas a redondas), el desfase se acumula. Corcheas/semicorcheas: audio despues. Blancas/redondas: audio antes.

---

## Enfoque 3: Reposicionamiento de notas en SVG

**Como funcionaba:**
- Despues de renderizar, obtener timestamps de TimingCallbacks
- Calcular posicion deseada: `(evento.ms / duracion_total) * musicWidth`
- Mover cada elemento SVG con `translate(deltaX, 0)`
- Scroll constante coincidiria perfecto con notas reposicionadas

### Iteracion 3a: Reposicionar con estimacion de duracion
- Duracion estimada = ultimo_evento.ms + 1 segundo (hack arbitrario)
- **Resultado:** Desfase significativo porque la estimacion no coincidia con synth.duration. Blancas/redondas desfasadas.

### Iteracion 3b: Reposicionar con synth.duration
- Esperar synth.prime() para obtener duracion precisa
- **Problema:** AudioContext bloqueado por Chrome (requiere gesto del usuario). Se quedaba en "Preparando partitura..." infinitamente.

### Iteracion 3c: Reposicionar inmediatamente, recalibrar despues
- Reposicionar con duracion estimada al renderizar (sincrono)
- Recalibrar scroll con synth.duration al dar Play
- **Problema:** Dos fuentes de verdad diferentes → desfase entre posiciones (estimada) y scroll (synth.duration).

### Iteracion 3d: Misma duracion para todo (calcDurationFromAbc)
- Calculo manual de beats desde el ABC
- Usar para AMBOS: reposicionamiento y scroll speed
- No recalibrar con synth.duration
- **Problema:** El calculo manual no coincide con lo que abcjs/synth realmente toca. Desfase "total" segun usuario.

### Iteracion 3e: Duracion desde TimingCallbacks (durationFromTimings)
- Derivar duracion del ultimo evento de noteTimings + gap estimado
- **Problema:** Notas blancas y redondas se empalmaron. Desfase persistio. La manipulacion de SVG con translate() resulto fragil e impredecible.

### Conclusion del Enfoque 3
**DESCARTADO.** Reposicionar elementos SVG despues de que abcjs los renderiza es fundamentalmente fragil:
- Multiples fuentes de duracion que no coinciden
- getBoundingClientRect afectado por scale, transforms previos
- Beams y ligaduras se distorsionan al mover notas individuales
- Notas se empalmaban al comprimir secciones de larga duracion

---

## Enfoque 4: Scroll interpolado por nota (ACTUAL — en implementacion)

**Como funciona:**
- Dejar notas donde abcjs las renderiza (cero manipulacion SVG)
- Construir mapa tiempo→posicion desde TimingCallbacks: `[{t: 0, x: 50}, {t: 750, x: 120}, ...]`
- En el animation loop, dado el tiempo transcurrido, interpolar linealmente entre las dos notas mas cercanas
- El scroll es suave y continuo (sin saltos)
- Cada nota llega al playhead exactamente cuando suena
- La velocidad varia ligeramente entre secciones (imperceptible en piezas reales)

**Ventajas:**
- Cero manipulacion de SVG
- Sync perfecto nota por nota (usa los mismos datos que el synth)
- Visualmente suave
- Simple (solo cambia el animation loop)
- Funciona con cualquier tipo de nota y combinacion

**Trade-off:**
- La velocidad del scroll no es 100% constante
- Para secciones con notas cortas (semicorcheas) va ligeramente mas rapido
- Para secciones con notas largas (redondas) va ligeramente mas lento
- La variacion es proporcional a la diferencia de spacing de abcjs

**Estimacion de variacion de velocidad:**
- Zapatillas Rojas (negras + corcheas): ~5% variacion — imperceptible
- Twinkle (negras + blancas): ~10% — apenas perceptible
- Test extremo (semicorcheas a redondas): ~20% — noticeable pero funcional

---

## Features que se mantienen en todos los enfoques

| Feature | Estado |
|---------|--------|
| Strip barlines (spacing mas uniforme) | ✅ Mantenido |
| Barline overlays visuales | ✅ Mantenido |
| scale=2 (notas grandes) | ✅ Mantenido |
| Auto-fullscreen al dar Play | ✅ Mantenido |
| Adaptive staffwidth (calcStaffWidth) | ✅ Mantenido |
| Audio sintetizado (FluidR3 SoundFont) | ✅ Mantenido |
| BPM ajustable | ✅ Mantenido |
| Fullscreen con fondo oscuro | ✅ Mantenido |

---

## Linea de tiempo de commits relevantes

| Commit | Cambio |
|--------|--------|
| 19dd544 | feat: add Ciencias module (no relacionado a piano) |
| aeaaaec | fix: smooth scroll correction for multi-voice (correctionRef = en vez de +=) |
| 4d80e32 | fix: uniform scroll by stripping barlines + visual overlay |
| 4efc4e6 | fix: reposition notes to time-proportional positions (inicio enfoque 3) |
| 337b0b9 | fix: prevent note overlap with MIN_SPACING (revertido) |
| fd6819c | revert: remove MIN_SPACING |
| c85fd5b | feat: adaptive staffwidth + auto-fullscreen |
| 301c0ee | fix: reposition immediately after render |
| 4650865 | fix: defer AudioContext to user gesture |
| e310a0c | fix: use same duration for scroll and repositioning |
| ad343fe | fix: derive duration from TimingCallbacks |
| PROXIMO | **Enfoque 4: scroll interpolado por nota** |
