import React, { useState, useEffect, useRef, useCallback } from 'react';
import abcjs from 'abcjs';
import './MusicPrompter.css';
import Teclado from '../../piano/Teclado';
import { rangoTeclado, pulsosMetronomo, cuentaDeEntrada, dedosPorNota } from '../../../utils/musica';

/**
 * Estima el número de compases contando barras `|` en las líneas de notas.
 * En multi-voz cuenta solo la primera voz (las voces tienen los mismos compases;
 * la mano izquierda sola empieza en V:2 o V:3).
 * Nota: las barras YA NO se eliminan del ABC — eso era necesario con el motor
 * viejo de velocidad constante; el mapa tiempo→posición absorbe su espacio.
 */
const estimarCompases = (abc) => {
  const lines = abc.split('\n');
  let voz = null;
  let primera = null;
  let compases = 0;
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('%%')) continue;
    const vm = line.match(/^V:\s*(\d+)/);
    if (vm) { voz = vm[1]; primera = primera ?? voz; continue; }
    if (/^[A-Z]:/.test(line)) continue; // encabezados X:/T:/M:/L:/K:
    if (voz === null || voz === primera) {
      compases += (line.match(/\|/g) || []).length;
    }
  }
  return Math.max(1, compases);
};

// Niveles de volumen del synth (multiplicador del soundfont).
const VOL_NORMAL = 1;
const VOL_BAJITO = 0.4;

// Metrónomo: cuánto se agenda por delante. El Web Audio necesita lookahead
// (agendar en el futuro con `currentTime` exacto); rAF solo decide QUÉ agendar,
// nunca CUÁNDO suena — por eso el click no tiembla aunque el frame llegue tarde.
const METRO_LOOKAHEAD_MS = 250;
const METRO_ACENTO_HZ = 1600;   // primer tiempo del compás
const METRO_NORMAL_HZ = 1100;
// Un click que el bucle de animación encuentra más atrasado que esto se salta.
const METRO_TARDE_MS = 80;

// Ajuste vertical de la partitura (ver medirContenido / ajustarVertical).
const MARGEN_PARTITURA = 14;       // px libres arriba y abajo de las notas
const ESCALA_MIN_PARTITURA = 0.5;  // no achicar más que esto aunque no quepa

// Escalera de tempo: porcentajes del tempo original de la pieza. Practicar
// lento y subir escalón a escalón es LA mecánica de estudio; con ±5 BPM había
// que apretar ocho veces para bajar al 70%.
const ESCALONES = [50, 60, 70, 80, 90, 100];

const fmtTiempo = (ms) => {
  const s = Math.max(0, Math.round((ms || 0) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/**
 * Cuenta las notas de la voz más densa (un acorde cuenta como una).
 * Sirve para dar más ancho a piezas con muchas notas por compás (6/8, 9/8,
 * pasajes de semicorcheas), donde contar compases se queda corto.
 */
const contarNotas = (abc) => {
  const porVoz = {};
  let voz = '1';
  for (const raw of abc.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('%')) continue;
    const vm = line.match(/^V:\s*(\d+)/);
    if (vm) { voz = vm[1]; continue; }
    if (/^[A-Z]:/.test(line)) continue;
    const limpia = line
      .replace(/"[^"]*"/g, '')       // anotaciones de texto
      .replace(/![^!]*!/g, '')       // decoraciones (!mp!, !fermata!)
      .replace(/\[[^\]]*\]/g, 'C');  // acordes: una sola posición
    porVoz[voz] = (porVoz[voz] || 0) + (limpia.match(/[A-Ga-gz]/g) || []).length;
  }
  const valores = Object.values(porVoz);
  return valores.length ? Math.max(...valores) : 1;
};

/**
 * Ancho del pentagrama PROPORCIONAL al contenido, para que piezas largas no se
 * compriman. Toma el mayor entre "por compás" y "por nota": así nunca queda más
 * estrecho que antes y los compases densos (9/8, semicorcheas) reciben más aire.
 * Tope de seguridad para no generar SVGs absurdamente anchos.
 */
const calcStaffwidth = (abc, multiVoice) => {
  const porCompas = (multiVoice ? 1100 : 500) * estimarCompases(abc);
  const porNota = (multiVoice ? 150 : 130) * contarNotas(abc);
  return Math.min(Math.max(1500, porCompas, porNota), 60000);
};

/**
 * Motor de scroll (Enfoque 4 del HISTORIAL_TELEPROMPTER): mapa tiempo→posición.
 *
 * En vez de scroll a velocidad constante + corrección reactiva por nota (que
 * corregía DESPUÉS de que la nota sonara y se desfasaba con duraciones mixtas),
 * precalculamos con visualObj.setTiming() el instante exacto (ms) y la posición
 * exacta (px) de CADA nota antes de reproducir. Durante la animación, la posición
 * del scroll es una función pura x(t): interpolación lineal entre los dos puntos
 * que rodean al tiempo transcurrido. Por construcción, cada nota cruza el playhead
 * exactamente cuando suena — sin importar si es semicorchea, redonda o multi-voz.
 * El reloj es el del AudioContext (el mismo que usa el sintetizador), así que no
 * hay deriva entre audio y animación.
 */
const MusicPrompter = ({ abcNotation, bpm, titulo, autor, onTerminar, multiVoice = false, mano = 'ambas' }) => {
  const [estado, setEstado] = useState('parado');
  const [bpmActual, setBpmActual] = useState(bpm || 80);
  // Volumen del synth: normal (escuchar la pieza), bajito (guía suave para
  // tocar encima) y mudo. Son multiplicadores del soundfont.
  const [volumen, setVolumen] = useState(VOL_NORMAL);
  const [progreso, setProgreso] = useState(0);   // 0..1
  const [duracionMs, setDuracionMs] = useState(0);
  // Teclado iluminado: visible por default; preferencia persistida.
  const [conTeclado, setConTeclado] = useState(() => {
    try { return localStorage.getItem('chuy_teclado_visible') !== 'no'; } catch { return true; }
  });
  const [rangoT, setRangoT] = useState(null);    // {min, max} MIDI de la pieza
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cargando, setCargando] = useState(false);
  // Metrónomo: preferencia persistida. Encendido implica cuenta de entrada al Play.
  const [metronomo, setMetronomo] = useState(() => {
    try { return localStorage.getItem('chuy_metronomo') === 'si'; } catch { return false; }
  });
  const [cuenta, setCuenta] = useState(0);       // tiempos que faltan de la cuenta de entrada
  // Bucle A-B, en ms de la pieza. null = sin marcar.
  const [loopA, setLoopA] = useState(null);
  const [loopB, setLoopB] = useState(null);

  const containerRef = useRef(null);
  const abcTargetRef = useRef(null);
  const translateXRef = useRef(0);
  const rafIdRef = useRef(null);
  const viewportWidthRef = useRef(600);
  const playheadOffsetRef = useRef(150);
  const firstNoteOffsetRef = useRef(0);
  const musicWidthRef = useRef(0);
  // Ajuste vertical: dónde están las notas dentro del SVG (a escala 1, relativo
  // a su borde superior) y la escala CSS aplicada para que quepan en el viewport.
  const cajaContenidoRef = useRef(null); // { top, alto } relativo al borde superior del viewport
  const escalaRef = useRef(1);
  const ajusteRef = useRef({ k: 1, ty: 0 }); // lo compone applyTransform con el scroll

  // Mapa tiempo→posición: [{t: ms, x: px desde la primera nota}], ordenado por t.
  // El último punto es el final de la pieza (recalibrado con synth.duration).
  const puntosRef = useRef([]);
  const finMsRef = useRef(0);
  const segIdxRef = useRef(0);       // segmento actual del mapa (avanza monotónico)
  const clockStartRef = useRef(0);   // ancla del reloj al iniciar/reanudar (ms)
  const elapsedPrevRef = useRef(0);  // ms acumulados antes de la última pausa
  const ultimoProgresoRef = useRef(0);
  const barraRef = useRef(null);
  const arrastrandoRef = useRef(false);

  // Teclado iluminado (todo en refs: cero estado de React en el camino caliente)
  const tecladoRef = useRef(null);
  const notasTecladoRef = useRef([]);   // [{t, fin, midi, mano}] ordenado por t
  const notaIdxRef = useRef(0);         // primera nota que aún no empieza
  const activasTecladoRef = useRef([]); // notas sonando (se compacta in-place)
  const tecladoElapsedRef = useRef(-1); // último elapsed visto (detecta saltos atrás)
  const tecladoRotoRef = useRef(false); // autodesactivación si algo falla

  // Metrónomo y bucle: todo en refs porque los lee el bucle de animación.
  const pulsoMsRef = useRef(0);         // separación entre clicks
  const pulsosPorCompasRef = useRef(4); // clicks en un compás completo
  const pulsosRef = useRef([]);         // [{t, acento}] sobre los compases reales
  const metroIdxRef = useRef(0);        // próximo click por agendar
  const metroFuentesRef = useRef([]);   // osciladores agendados (para poder cancelarlos)
  const metronomoRef = useRef(metronomo);
  const loopRef = useRef({ a: null, b: null });
  const cuentaRafRef = useRef(null);
  const cuentaCanceladaRef = useRef(false);
  const cuentaUltimaRef = useRef(-1);
  const bpmPrevRef = useRef(bpm || 80);
  // Turno del cambio de tempo en curso: un cambio nuevo, Pausa o Reset invalidan
  // la reanudación pendiente del anterior.
  const cambioTempoRef = useRef(0);

  const synthRef = useRef(null);
  const visualObjRef = useRef(null);
  const audioContextRef = useRef(null);
  const estadoRef = useRef('parado');

  useEffect(() => { estadoRef.current = estado; }, [estado]);
  useEffect(() => { metronomoRef.current = metronomo; }, [metronomo]);
  useEffect(() => { loopRef.current = { a: loopA, b: loopB }; }, [loopA, loopB]);

  // Mismo reloj que el sintetizador; respaldo a performance.now() si no hay audio.
  const clockNow = useCallback(() => (
    audioContextRef.current ? audioContextRef.current.currentTime * 1000 : performance.now()
  ), []);

  const asegurarAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioContextRef.current = new AC();
    }
    return audioContextRef.current;
  }, []);

  // ─── Metrónomo ───
  // Click sintetizado por nosotros (no por el synth de abcjs) para que suene
  // aunque la pieza esté muda: practicar con click y sin guía es lo normal.
  const clickMetronomo = useCallback((tSeg, acento) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = acento ? METRO_ACENTO_HZ : METRO_NORMAL_HZ;
      // Envolvente corta y percusiva; exponencial no admite 0, de ahí el 0.0001.
      gain.gain.setValueAtTime(0.0001, tSeg);
      gain.gain.exponentialRampToValueAtTime(acento ? 0.3 : 0.17, tSeg + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, tSeg + 0.045);
      osc.connect(gain).connect(ctx.destination);
      osc.start(tSeg);
      osc.stop(tSeg + 0.06);
      metroFuentesRef.current.push(osc);
      osc.onended = () => {
        const arr = metroFuentesRef.current;
        const i = arr.indexOf(osc);
        if (i >= 0) arr.splice(i, 1);
      };
    } catch { /* sin audio */ }
  }, []);

  // Cancela los clicks ya agendados que todavía no sonaron (pausa, seek, bucle).
  const limpiarMetronomo = useCallback(() => {
    const fuentes = metroFuentesRef.current;
    metroFuentesRef.current = [];
    for (const osc of fuentes) { try { osc.stop(); } catch { /* ya paró */ } }
  }, []);

  // Agenda los clicks que caen dentro de la ventana de lookahead.
  // `elapsed` (ms de la pieza) → tiempo del AudioContext: es el mismo reloj,
  // así que la conversión es exacta y el click no deriva del audio.
  // Los clicks salen de `pulsosRef` (alineados a los compases reales, ver
  // pulsosMetronomo), no de una rejilla desde 0: así el acento cae bien aunque
  // la pieza empiece con anacrusa.
  const programarMetronomo = useCallback((elapsed) => {
    if (!metronomoRef.current || !audioContextRef.current) return;
    const pulsos = pulsosRef.current;
    const limite = elapsed + METRO_LOOKAHEAD_MS;
    let i = metroIdxRef.current;
    while (i < pulsos.length && pulsos[i].t < limite) {
      const p = pulsos[i];
      // El primer frame llega ~16 ms tarde: ese click aún se toca (sonaría apenas
      // tarde). Uno muy atrasado (pestaña congelada) se salta: sonaría fuera de lugar.
      if (p.t >= elapsed - METRO_TARDE_MS) {
        clickMetronomo((clockStartRef.current + (p.t - elapsedPrevRef.current)) / 1000, p.acento);
      }
      i++;
    }
    metroIdxRef.current = i;
  }, [clickMetronomo]);

  // Recoloca el cursor del metrónomo tras un salto (barra de avance, bucle, Play).
  const recolocarMetronomo = useCallback((ms) => {
    const pulsos = pulsosRef.current;
    let i = 0;
    while (i < pulsos.length && pulsos[i].t < ms - 1) i++;
    metroIdxRef.current = i;
    limpiarMetronomo();
  }, [limpiarMetronomo]);

  const measureViewport = useCallback(() => {
    if (containerRef.current) {
      viewportWidthRef.current = containerRef.current.clientWidth;
      playheadOffsetRef.current = viewportWidthRef.current * 0.25;
    }
  }, []);

  // ─── Apply CSS transform ───
  // El scroll horizontal y el ajuste vertical van juntos en el CONTENEDOR (.mp-sheet).
  // Nunca en el <svg>: abcjs implementa su propia escala (scale: 2) con un
  // transform sobre el svg, y escribir ahí la borraba (partitura a la mitad).
  // translate va antes que scale: el desplazamiento queda en px de pantalla.
  const applyTransform = useCallback(() => {
    const offset = playheadOffsetRef.current - firstNoteOffsetRef.current - translateXRef.current;
    if (abcTargetRef.current) {
      const { k, ty } = ajusteRef.current;
      abcTargetRef.current.style.transformOrigin = '0 0';
      abcTargetRef.current.style.transform = `translate(${offset}px, ${ty}px) scale(${k})`;
    }
  }, []);

  // ─── Ajuste vertical de la partitura ───
  // abcjs dibuja un SVG ~2.5 veces más alto que las notas: arriba la fila del
  // título (centrado sobre miles de px de pentagrama, así que ni se ve) y abajo
  // espacio vacío. Pegado arriba, en pantallas bajas —o con los controles en
  // dos renglones— la mano izquierda quedaba cortada. Se mide dónde están las
  // notas de verdad (grupos `.abcjs-staff-wrapper`, ~0 ms) y se centran; si no
  // caben, se reducen. Es transform CSS: no se vuelve a dibujar ni toca el audio.
  const medirContenido = useCallback(() => {
    const svg = abcTargetRef.current?.querySelector('svg');
    const vp = containerRef.current;
    if (!svg || !vp) return;
    // Medir sin ajuste (escala 1, sin desplazamiento vertical).
    ajusteRef.current = { k: 1, ty: 0 };
    applyTransform();
    // El contenedor está en top:0 del viewport, así que la escala (origen
    // arriba-izquierda) se mide desde el borde interior superior del viewport.
    const origen = vp.getBoundingClientRect().top + vp.clientTop;
    let arriba = Infinity;
    let abajo = -Infinity;
    svg.querySelectorAll('.abcjs-staff-wrapper').forEach((g) => {
      const c = g.getBoundingClientRect();
      if (c.height > 0) { arriba = Math.min(arriba, c.top); abajo = Math.max(abajo, c.bottom); }
    });
    if (!Number.isFinite(arriba)) {
      const rr = svg.getBoundingClientRect();
      arriba = rr.top;
      abajo = rr.bottom;
    }
    cajaContenidoRef.current = { top: arriba - origen, alto: abajo - arriba };
  }, [applyTransform]);

  // Escala y centra las notas en el viewport. Devuelve la escala aplicada.
  const ajustarVertical = useCallback(() => {
    const vp = containerRef.current;
    const caja = cajaContenidoRef.current;
    if (!vp || !caja || caja.alto <= 0) return escalaRef.current;
    const alto = vp.clientHeight;
    const k = Math.max(ESCALA_MIN_PARTITURA, Math.min(1, (alto - 2 * MARGEN_PARTITURA) / caja.alto));
    // Centro de las notas = centro del viewport.
    const ty = (alto - caja.alto * k) / 2 - caja.top * k;
    ajusteRef.current = { k, ty };
    applyTransform();
    return k;
  }, [applyTransform]);

  const reiniciarTeclado = useCallback(() => {
    notaIdxRef.current = 0;
    activasTecladoRef.current = [];
    tecladoElapsedRef.current = -1;
    tecladoRef.current?.limpiar();
  }, []);

  // ─── Medir la partitura y construir el mapa tiempo→posición ───
  // Las posiciones se miden con getBoundingClientRect relativo al SVG (invariante
  // al transform del scroll y a la escala), UNA sola vez — no durante la animación.
  const medirYMapear = useCallback((qpm) => {
    const svg = abcTargetRef.current?.querySelector('svg');
    const visualObj = visualObjRef.current;
    if (!svg || !visualObj) return;

    // Primero el alto y la escala; recién después se miden las x, así todas las
    // posiciones quedan en px de pantalla con la escala aplicada. El viewport se
    // dimensiona por las NOTAS, no por el SVG (que trae título y vacío); en
    // pantalla completa manda el flex y la escala hace que quepan.
    medirContenido();
    if (containerRef.current && cajaContenidoRef.current) {
      // + bordes del viewport: si no, cabía 4 px justo y la escala quedaba en 0.99.
      const bordes = containerRef.current.offsetHeight - containerRef.current.clientHeight;
      const alto = Math.max(200, Math.ceil(cajaContenidoRef.current.alto + 2 * MARGEN_PARTITURA + bordes));
      containerRef.current.style.setProperty('--mp-alto', `${alto}px`);
    }
    escalaRef.current = ajustarVertical();

    const svgRect = svg.getBoundingClientRect();
    // Extremos de la música sobre TODAS las voces. No sirven el primer y último
    // elemento del DOM: abcjs dibuja voz por voz, y con dos voces en un pentagrama
    // el último del DOM es la última nota de la voz de abajo, que puede estar a
    // media pieza (el mapa terminaba antes y la partitura saltaba hacia atrás).
    const rects = [...svg.querySelectorAll('.abcjs-note, .abcjs-rest')]
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width > 0);
    if (rects.length > 0) {
      const izquierda = rects.reduce((m, r) => Math.min(m, r.left), Infinity);
      const derecha = rects.reduce((m, r) => Math.max(m, r.right), -Infinity);
      firstNoteOffsetRef.current = izquierda - svgRect.left;
      musicWidthRef.current = (derecha - izquierda) + 100;
    } else {
      firstNoteOffsetRef.current = 0;
      musicWidthRef.current = svgRect.width;
    }

    // ─── Pulso para el metrónomo ───
    // `qpm` cuenta tiempos-de-getBeatLength por minuto, así que UN tiempo dura
    // siempre 60000/qpm ms sea cual sea el compás. Los tiempos por compás salen
    // del numerador/denominador contra esa unidad (4/4 → 4; 3/4 → 3; 6/8 → 2;
    // 9/8 → 3, verificado al oído).
    const beatMs = 60000 / (qpm || 80);
    let porCompas = 4;
    let pulsoMs = beatMs;
    try {
      const beatLen = visualObj.getBeatLength() || 0.25;
      const m = visualObj.getMeter?.()?.value?.[0];
      const num = parseInt(m?.num, 10);
      const den = parseInt(m?.den, 10);
      const bc = num && den ? Math.round(num / (den * beatLen)) : 4;
      porCompas = bc > 0 && bc <= 24 ? bc : 4;
      // abcjs cuenta 3/8 como UN pulso por compás (negra con puntillo): un click
      // cada compás no da nada que contar, y a tempo lento sería uno cada ~3 s.
      // Con un solo pulso se subdivide en las figuras del numerador (3 corcheas).
      if (porCompas === 1 && num > 1) {
        pulsoMs = beatMs / num;
        porCompas = num;
      }
    } catch { porCompas = 4; pulsoMs = beatMs; }
    pulsoMsRef.current = pulsoMs;
    pulsosPorCompasRef.current = porCompas;

    const puntos = [];
    const iniciosCompas = [];
    let finMs = 0;
    try {
      visualObj.setTiming(qpm, 0);
      (visualObj.noteTimings || []).forEach((ev) => {
        if (ev.type === 'end') {
          finMs = Math.max(finMs, ev.milliseconds || 0);
          return;
        }
        if (ev.type !== 'event') return;
        // Antes de descartar eventos sin elemento: abcjs marca así el inicio de
        // un compás cuando una ligadura cruza la barra.
        if (ev.measureStart) iniciosCompas.push(ev.milliseconds || 0);
        // Columna de tiempo: con dos manos `elements` trae una entrada por voz. Se
        // toma la MÁS A LA IZQUIERDA. Antes era siempre la primera voz, y un
        // silencio de compás completo se dibuja centrado: en la intro del Canon
        // (derecha callada, izquierda tocando) cada inicio de compás quedaba media
        // barra adelantado y la partitura se detenía y saltaba hacia atrás.
        const primeros = (ev.elements || []).map((e) => e?.[0]).filter(Boolean);
        if (!primeros.length) return;
        const izquierda = Math.min(...primeros.map((e) => e.getBoundingClientRect().left));
        const x = izquierda - svgRect.left - firstNoteOffsetRef.current;
        const t = ev.milliseconds || 0;
        const prev = puntos[puntos.length - 1];
        if (prev && Math.abs(prev.t - t) < 1) {
          // Notas simultáneas (acorde / dos manos): comparten columna de tiempo.
          prev.x = Math.min(prev.x, x);
        } else {
          puntos.push({ t, x });
        }
      });
    } catch (e) {
      console.warn('No se pudieron calcular los timings de la partitura:', e);
    }

    puntos.sort((a, b) => a.t - b.t);
    // Garantiza arranque en (0, 0): scroll quieto hasta la primera nota.
    if (!puntos.length || puntos[0].t > 1) puntos.unshift({ t: 0, x: 0 });
    // Punto final: si abcjs no dio evento 'end', estima una cola corta.
    if (!finMs) finMs = puntos[puntos.length - 1].t + 1500;
    puntos.push({ t: finMs, x: musicWidthRef.current });

    puntosRef.current = puntos;
    finMsRef.current = finMs;
    segIdxRef.current = 0;
    setDuracionMs(finMs);

    // Clicks del metrónomo sobre los compases reales (anacrusa incluida).
    pulsosRef.current = pulsosMetronomo(iniciosCompas, finMs, pulsoMs, porCompas);
    metroIdxRef.current = 0;

    // ─── Línea de tiempo del TECLADO (cálculo aparte; el mapa de arriba no se toca) ───
    // setUpAudio entrega una pista por VOZ, en orden de pentagrama, con pitch MIDI
    // y tiempos en redondas. Es transformación pura, sin audio.
    // (noteTimings no sirve aquí: en abcjs 6.6.2 no trae midiPitches en nuestro
    // orden de llamadas, y fusiona las voces que coinciden en el tiempo.)
    try {
      const audio = visualObj.setUpAudio({ qpm });
      const beatLen = visualObj.getBeatLength() || 0.25;
      const factorMs = 60000 / qpm / beatLen; // redondas → ms
      const tracks = (audio && audio.tracks) || [];
      // Cada pentagrama es una mano y puede traer una o dos voces (bajo sostenido
      // + arpegio): las pistas del primer pentagrama son de la derecha.
      const vocesDerecha = visualObj.lines?.find((l) => l.staff)?.staff?.[0]?.voices?.length || 1;
      // Digitación (Fase 2): dedo de cada nota que suena, si la partitura lo trae.
      const dedos = dedosPorNota(visualObj, tracks);
      const linea = [];
      const midis = [];
      for (let v = 0; v < tracks.length; v++) {
        const manoVoz = mano !== 'ambas' ? mano : (v < vocesDerecha ? 'derecha' : 'izquierda');
        for (const item of tracks[v]) {
          if (item.cmd !== 'note' || typeof item.pitch !== 'number') continue;
          const t = item.start * factorMs;
          const dur = item.duration * factorMs;
          // fin un poco antes del valor real para que las notas repetidas
          // parpadeen; suelo de 60ms para que las semicorcheas se alcancen a ver.
          linea.push({ t, fin: t + Math.max(60, dur - 40), midi: item.pitch, mano: manoVoz, dedo: dedos.get(item) || null });
          midis.push(item.pitch);
        }
      }
      linea.sort((a, b) => a.t - b.t);
      notasTecladoRef.current = linea;
      setRangoT(midis.length ? rangoTeclado(midis) : null);
    } catch (e) {
      console.warn('No se pudo armar la línea del teclado:', e);
      notasTecladoRef.current = [];
      setRangoT(null);
    }
    reiniciarTeclado();
  }, [mano, reiniciarTeclado, medirContenido, ajustarVertical]);

  // x(t): posición del scroll para un tiempo dado, interpolando en el mapa.
  // Pura salvo por segIdxRef (cursor monotónico que acelera el caso común).
  const posEn = useCallback((elapsed) => {
    const puntos = puntosRef.current;
    if (!puntos.length) return 0;
    let i = segIdxRef.current;
    if (i >= puntos.length || puntos[i].t > elapsed) i = 0; // tras un salto atrás
    while (i < puntos.length - 1 && elapsed >= puntos[i + 1].t) i++;
    segIdxRef.current = i;

    const a = puntos[i];
    const b = puntos[Math.min(i + 1, puntos.length - 1)];
    if (b.t <= a.t) return b.x;
    // Repetición (|: :|): la música salta hacia atrás. Mantener posición y
    // saltar de golpe al cambiar de segmento, no interpolar en reversa.
    if (b.x < a.x) return a.x;
    const f = Math.max(0, Math.min(1, (elapsed - a.t) / (b.t - a.t)));
    return a.x + (b.x - a.x) * f;
  }, []);

  // ─── Render ABC → SVG + mapa ───
  useEffect(() => {
    if (!abcTargetRef.current || !abcNotation) return;

    abcTargetRef.current.innerHTML = '';

    const visualObj = abcjs.renderAbc(abcTargetRef.current, abcNotation, {
      staffwidth: calcStaffwidth(abcNotation, multiVoice),
      scale: 2,
      wrap: null,
      add_classes: true,
      selectTypes: false, // sin seleccion de notas al tocar (el rojo de abcjs)
      paddingtop: 0,
      paddingbottom: 0,
      paddingleft: 20,
    });

    visualObjRef.current = visualObj[0];

    requestAnimationFrame(() => {
      measureViewport();
      medirYMapear(bpmActual);
      translateXRef.current = 0;
      applyTransform();
    });

    return () => { cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abcNotation]);

  const cleanup = () => {
    if (rafIdRef.current) { cancelAnimationFrame(rafIdRef.current); rafIdRef.current = null; }
    if (synthRef.current) { try { synthRef.current.stop(); } catch { /* ya parado */ } }
    const fuentes = metroFuentesRef.current;
    metroFuentesRef.current = [];
    for (const osc of fuentes) { try { osc.stop(); } catch { /* ya paró */ } }
  };

  // ─── Prepare synth (called on Play — requires user gesture) ───
  const prepareSynth = async (qpm) => {
    if (synthRef.current) return;

    setCargando(true);
    try {
      if (!visualObjRef.current) return;

      asegurarAudioContext();
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const synth = new abcjs.synth.CreateSynth();
      await synth.init({
        visualObj: visualObjRef.current,
        audioContext: audioContextRef.current,
        options: {
          qpm: qpm,
          soundFontUrl: 'https://paulrosen.github.io/midi-js-soundfonts/FluidR3_GM/',
          program: 0,
          soundFontVolumeMultiplier: volumen,
        },
      });
      await synth.prime();
      synthRef.current = synth;

      // Recalibra el punto final del mapa con la duración real del audio, para
      // que el scroll y el sonido terminen juntos.
      const realMs = (synth.duration || 0) * 1000;
      const puntos = puntosRef.current;
      if (realMs > 0 && puntos.length >= 2) {
        const penultimo = puntos[puntos.length - 2];
        const finReal = Math.max(realMs, penultimo.t + 1);
        puntos[puntos.length - 1].t = finReal;
        finMsRef.current = finReal;
        setDuracionMs(finReal);
      }
    } catch (err) {
      console.warn('Error preparando audio:', err);
    }
    setCargando(false);
  };

  // ─── Teclado: enciende/apaga teclas según la línea de tiempo ───
  // Solo LEE el tiempo; todo su estado vive en refs (identidad estable, no
  // perturba el rAF). Escritura pura al DOM: jamás lee layout. Si algo falla,
  // se autodesactiva para siempre — nunca puede tirar el bucle de animación.
  const actualizarTeclado = useCallback((elapsed) => {
    if (tecladoRotoRef.current || !tecladoRef.current) return;
    try {
      const notas = notasTecladoRef.current;
      if (!notas.length) return;
      const activas = activasTecladoRef.current;
      let cambio = false;

      // Salto hacia atrás (barra de avance / replay): re-sembrar desde cero.
      if (elapsed < tecladoElapsedRef.current) {
        notaIdxRef.current = 0;
        activas.length = 0;
        cambio = true;
      }
      tecladoElapsedRef.current = elapsed;

      // Encender: cursor monotónico sobre los inicios de nota.
      let i = notaIdxRef.current;
      while (i < notas.length && notas[i].t <= elapsed) {
        if (notas[i].fin > elapsed) { activas.push(notas[i]); cambio = true; }
        i++;
      }
      notaIdxRef.current = i;

      // Apagar: compactación in-place (sin allocations por frame).
      let w = 0;
      for (let k = 0; k < activas.length; k++) {
        if (activas[k].fin > elapsed) activas[w++] = activas[k];
      }
      if (w !== activas.length) { activas.length = w; cambio = true; }

      if (!cambio) return;
      const der = [];
      const izq = [];
      const dedos = new Map();
      for (const n of activas) {
        (n.mano === 'izquierda' ? izq : der).push(n.midi);
        if (n.dedo) {
          // La misma tecla con dos dedos distintos (dos manos): se muestran ambos.
          const previo = dedos.get(n.midi);
          dedos.set(n.midi, previo && previo !== n.dedo ? `${previo}·${n.dedo}` : n.dedo);
        }
      }
      tecladoRef.current.setActivas(der, izq, dedos);
    } catch {
      tecladoRotoRef.current = true;
      try { tecladoRef.current?.limpiar(); } catch { /* nada */ }
    }
  }, []);

  // Al re-mostrar el teclado, forzar un re-sembrado en el siguiente frame para
  // que las notas ya sonando se pinten sin esperar al próximo cambio.
  useEffect(() => {
    if (conTeclado) tecladoElapsedRef.current = Infinity;
  }, [conTeclado]);

  // ─── Ir a un punto de la pieza (barra de avance, bucle A-B) ───
  // conAudio=false mientras se arrastra (solo mueve la partitura); al soltar se
  // salta el audio, así no se corta en cada micro-movimiento.
  const irA = useCallback((ms, conAudio = true) => {
    const fin = finMsRef.current || 0;
    const target = Math.max(0, Math.min(ms, fin));

    elapsedPrevRef.current = target;
    clockStartRef.current = clockNow();
    ultimoProgresoRef.current = target;

    translateXRef.current = posEn(target);
    applyTransform();
    setProgreso(fin ? target / fin : 0);
    // También el teclado (con el rAF detenido nadie más lo llamaría en pausa).
    actualizarTeclado(target);
    // El metrónomo se reancla al nuevo punto y suelta lo que tenía agendado.
    recolocarMetronomo(target);

    if (conAudio && synthRef.current) {
      // seek en segundos: si está sonando reengancha el audio ahí; si está
      // parado/pausado deja la posición lista para el siguiente start().
      try { synthRef.current.seek(target / 1000, 'seconds'); } catch { /* sin audio */ }
    }
  }, [applyTransform, clockNow, posEn, actualizarTeclado, recolocarMetronomo]);

  // ─── Animación: x(t) por interpolación sobre el mapa ───
  const animate = useCallback(() => {
    if (!puntosRef.current.length) return;

    const elapsed = elapsedPrevRef.current + (clockNow() - clockStartRef.current);

    // Bucle A-B: al pasar B se regresa a A por el mismo camino que la barra de
    // avance (reancla reloj, audio, teclado y metrónomo). Va ANTES del final de
    // pieza para que un bucle que termina en el último compás siga dando vueltas.
    const { a, b } = loopRef.current;
    if (a != null && b != null && elapsed >= b) {
      irA(a, true);
      rafIdRef.current = requestAnimationFrame(animate);
      return;
    }

    translateXRef.current = posEn(elapsed);
    applyTransform();

    // El teclado va DESPUÉS del scroll: la partitura se compromete primero.
    actualizarTeclado(elapsed);
    programarMetronomo(elapsed);

    // Barra de avance: se actualiza ~10 veces por segundo, no cada frame.
    const fin = finMsRef.current || 1;
    if (Math.abs(elapsed - ultimoProgresoRef.current) > 100) {
      ultimoProgresoRef.current = elapsed;
      setProgreso(Math.max(0, Math.min(1, elapsed / fin)));
    }

    if (elapsed >= finMsRef.current) {
      setProgreso(1);
      if (estadoRef.current === 'tocando') {
        setEstado('parado');
        if (onTerminar) onTerminar();
      }
      return;
    }
    rafIdRef.current = requestAnimationFrame(animate);
  }, [applyTransform, clockNow, onTerminar, posEn, actualizarTeclado, programarMetronomo, irA]);

  const msDesdeEvento = (e) => {
    const el = barraRef.current;
    if (!el || !finMsRef.current) return 0;
    const rect = el.getBoundingClientRect();
    const f = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    return f * finMsRef.current;
  };

  const onBarraDown = (e) => {
    if (!finMsRef.current) return;
    arrastrandoRef.current = true;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* sin capture */ }
    irA(msDesdeEvento(e), false);
  };
  const onBarraMove = (e) => {
    if (arrastrandoRef.current) irA(msDesdeEvento(e), false);
  };
  const onBarraUp = (e) => {
    if (!arrastrandoRef.current) return;
    arrastrandoRef.current = false;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* sin capture */ }
    irA(msDesdeEvento(e), true);
  };

  // ─── Animation state control ───
  useEffect(() => {
    if (estado === 'tocando') {
      rafIdRef.current = requestAnimationFrame(animate);
    }
    return () => { if (rafIdRef.current) { cancelAnimationFrame(rafIdRef.current); rafIdRef.current = null; } };
  }, [estado, animate]);

  // ─── Cambio de BPM: rehacer el mapa y, si se estaba tocando, SEGUIR tocando ───
  useEffect(() => {
    if (!visualObjRef.current || !abcTargetRef.current) return;

    // Posición ANTES de tirar el motor. Si estaba sonando hay que leer el reloj:
    // elapsedPrev solo se actualiza al pausar y estaría viejo.
    const estabaTocando = estadoRef.current === 'tocando';
    // Un cambio encima de otro que aún no reanudaba también sigue tocando.
    const seguirTocando = estabaTocando || estadoRef.current === 'cambiando-tempo';
    const posPrev = estabaTocando
      ? elapsedPrevRef.current + (clockNow() - clockStartRef.current)
      : elapsedPrevRef.current;
    const turno = ++cambioTempoRef.current;

    cleanup();
    cancelarCuenta();
    synthRef.current = null;
    segIdxRef.current = 0;
    metroIdxRef.current = 0;

    // Los tiempos viven en milisegundos, pero marcan COMPASES. Al cambiar el
    // tempo la misma música cae en otro instante, así que todo se reescala por
    // el mismo factor: la posición actual y los dos puntos del bucle. Marcas el
    // tramo difícil una vez y subes la escalera sin volver a marcarlo ni perder
    // tu lugar.
    const prevBpm = bpmPrevRef.current;
    const f = prevBpm && prevBpm !== bpmActual ? prevBpm / bpmActual : 1;
    if (f !== 1) {
      setLoopA(v => (v == null ? v : v * f));
      setLoopB(v => (v == null ? v : v * f));
    }
    bpmPrevRef.current = bpmActual;

    // Tocando: se sigue tocando al tempo nuevo desde la misma música (pedido del
    // usuario; antes quedaba en pausa). abcjs fija el tempo al preparar el audio,
    // así que hay un silencio breve mientras se prepara de nuevo. En pausa se
    // queda en pausa, en el mismo lugar.
    const posNueva = posPrev * f;
    const siguiente = seguirTocando ? 'cambiando-tempo' : (posNueva > 0 ? 'pausado' : 'parado');
    estadoRef.current = siguiente;
    setEstado(siguiente);

    // Sin volver a dibujar: la partitura no depende del tempo. Basta rehacer el
    // mapa tiempo→posición (setTiming con el qpm nuevo) sobre el mismo SVG.
    requestAnimationFrame(async () => {
      if (turno !== cambioTempoRef.current) return;
      measureViewport();
      medirYMapear(bpmActual);   // reconstruye el mapa y reinicia el teclado

      // Recolocarse en la misma música al nuevo tempo.
      const fin = finMsRef.current || 0;
      const destino = Math.max(0, Math.min(posNueva, fin));
      elapsedPrevRef.current = destino;
      ultimoProgresoRef.current = destino;
      clockStartRef.current = clockNow();
      segIdxRef.current = 0;
      translateXRef.current = posEn(destino);
      applyTransform();
      actualizarTeclado(destino);
      recolocarMetronomo(destino);
      setProgreso(fin ? destino / fin : 0);

      if (!seguirTocando) return;
      if (volumen > 0) await prepareSynth(bpmActual);
      // Otro cambio de tempo, Pausa o Reset mientras se preparaba: nada que reanudar.
      if (turno !== cambioTempoRef.current || estadoRef.current !== 'cambiando-tempo') return;
      if (volumen > 0 && synthRef.current) {
        try {
          synthRef.current.seek(destino / 1000, 'seconds');
          synthRef.current.start();
        } catch { /* sin audio */ }
      }
      recolocarMetronomo(destino);
      // Ancla el reloj justo al arrancar el audio, como handlePlay.
      clockStartRef.current = clockNow();
      estadoRef.current = 'tocando';
      setEstado('tocando');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bpmActual]);

  // ─── Fullscreen ───
  useEffect(() => {
    const onFsChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      setTimeout(() => { measureViewport(); if (translateXRef.current === 0) applyTransform(); }, 300);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
    };
  }, [measureViewport, applyTransform]);

  // ─── Reajuste al cambiar el tamaño del viewport ───
  // Pantalla completa, ventana, controles que bajan de renglón… Se re-escala SIN
  // volver a dibujar ni tocar el audio: con origen a la izquierda, todas las x
  // medidas escalan en la misma proporción, así que el mapa tiempo→posición se
  // corrige multiplicando. Luego se recoloca la partitura en el instante actual.
  const reajustarVertical = useCallback(() => {
    if (!cajaContenidoRef.current || !puntosRef.current.length) return;
    const kAntes = escalaRef.current;
    measureViewport();
    const k = ajustarVertical();
    if (Math.abs(k - kAntes) > 0.0005) {
      const r = k / kAntes;
      puntosRef.current.forEach((p) => { p.x *= r; });
      firstNoteOffsetRef.current *= r;
      musicWidthRef.current *= r;
      escalaRef.current = k;
    }
    const elapsed = estadoRef.current === 'tocando'
      ? elapsedPrevRef.current + (clockNow() - clockStartRef.current)
      : elapsedPrevRef.current;
    translateXRef.current = posEn(elapsed);
    applyTransform();
  }, [measureViewport, ajustarVertical, clockNow, posEn, applyTransform]);

  useEffect(() => {
    const vp = containerRef.current;
    if (!vp || typeof ResizeObserver === 'undefined') return undefined;
    let raf = null;
    const ro = new ResizeObserver(() => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { raf = null; reajustarVertical(); });
    });
    ro.observe(vp);
    return () => { ro.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, [reajustarVertical]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await containerRef.current?.parentElement?.requestFullscreen();
      else await document.exitFullscreen();
    } catch { /* fullscreen no disponible */ }
  };

  // ─── Cuenta de entrada ───
  // Clicks antes de arrancar, para entrar a tiempo. Continúan la rejilla de la
  // pieza (ver cuentaDeEntrada): desde un tiempo fuerte es un compás, como
  // siempre; con anacrusa cuenta "1 2 3 | 1 2" y la anacrusa entra en el 3.
  // Se resuelve cuando el reloj de audio llega al punto de arranque; el synth NO
  // se agenda aquí: arranca después y el reloj se ancla en ese instante, así que
  // la garantía de cero deriva del motor se mantiene intacta.
  const correrCuentaEntrada = useCallback((desdeMs) => new Promise((resolve) => {
    const ctx = audioContextRef.current;
    const { pulsos, inicioMs } = cuentaDeEntrada(
      desdeMs, pulsosRef.current, pulsoMsRef.current, pulsosPorCompasRef.current,
    );
    if (!ctx || !pulsos.length) { resolve(); return; }

    const t0 = ctx.currentTime + 0.12;  // margen para agendar sin cortar el 1er click
    const aSeg = (ms) => t0 + (ms - inicioMs) / 1000;
    for (const p of pulsos) clickMetronomo(aSeg(p.t), p.acento);
    const finSeg = aSeg(desdeMs);

    cuentaUltimaRef.current = -1;
    const tick = () => {
      if (cuentaCanceladaRef.current) {
        cuentaRafRef.current = null;
        setCuenta(0);
        resolve();
        return;
      }
      const ahora = ctx.currentTime;
      if (ahora >= finSeg) {
        cuentaRafRef.current = null;
        cuentaUltimaRef.current = -1;
        setCuenta(0);
        resolve();
        return;
      }
      // Cuenta regresiva de clicks: el número del click que está sonando.
      let sonados = 0;
      while (sonados < pulsos.length && aSeg(pulsos[sonados].t) <= ahora) sonados++;
      const restan = pulsos.length - Math.max(0, sonados - 1);
      // Solo re-renderiza cuando el número cambia (unas cuantas veces, no 120).
      if (restan !== cuentaUltimaRef.current) { cuentaUltimaRef.current = restan; setCuenta(restan); }
      cuentaRafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }), [clickMetronomo]);

  const cancelarCuenta = () => {
    cuentaCanceladaRef.current = true;
    if (cuentaRafRef.current) { cancelAnimationFrame(cuentaRafRef.current); cuentaRafRef.current = null; }
    limpiarMetronomo();
    setCuenta(0);
  };

  // ─── Handlers ───
  const handlePlay = async () => {
    if (estado !== 'pausado') {
      // Auto-fullscreen
      if (!document.fullscreenElement) {
        try {
          await containerRef.current?.parentElement?.requestFullscreen();
          await new Promise(r => setTimeout(r, 250));
          measureViewport();
          applyTransform();
        } catch { /* fullscreen no disponible */ }
      }
    }

    // El synth se prepara SIEMPRE que falte, incluso al reanudar: cambiar el
    // volumen lo descarta (el multiplicador se fija al crearlo), y sin esto
    // reanudar tras cambiarlo se quedaba mudo.
    if (volumen > 0 && !synthRef.current) {
      await prepareSynth(bpmActual);
    }

    // Con metrónomo encendido hace falta contexto de audio aunque la pieza esté muda.
    if (metronomoRef.current) asegurarAudioContext();

    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    // Arranca desde donde esté el cursor: 0 tras Reset, o el punto elegido en
    // la barra de avance. Reanudar tras pausa usa el mismo camino.
    let desdeMs = elapsedPrevRef.current;
    // Con bucle activo, Play siempre entra DENTRO del tramo marcado.
    const { a: lA, b: lB } = loopRef.current;
    if (lA != null && lB != null && (desdeMs >= lB || desdeMs < lA)) desdeMs = lA;

    // Cuenta de entrada: va atada al metrónomo (si hay click, hay cuenta).
    if (metronomoRef.current && audioContextRef.current) {
      cuentaCanceladaRef.current = false;
      setEstado('cuenta');
      await correrCuentaEntrada(desdeMs);
      if (cuentaCanceladaRef.current) {
        setEstado(desdeMs > 0 ? 'pausado' : 'parado');
        return;
      }
    }

    elapsedPrevRef.current = desdeMs;
    recolocarMetronomo(desdeMs);
    if (volumen > 0 && synthRef.current) {
      try {
        synthRef.current.seek(desdeMs / 1000, 'seconds');
        synthRef.current.start();
      } catch { /* sin audio */ }
    }
    translateXRef.current = posEn(desdeMs);
    applyTransform();
    actualizarTeclado(desdeMs);

    // Ancla el reloj justo al arrancar/reanudar el audio.
    clockStartRef.current = clockNow();
    setEstado('tocando');
  };

  const handlePause = () => {
    if (estadoRef.current === 'cambiando-tempo') {
      // Se estaba preparando el audio al tempo nuevo: la posición ya está fija
      // y el reloj no corría. Solo se cancela la reanudación pendiente.
      cambioTempoRef.current++;
      estadoRef.current = 'pausado';
      setEstado('pausado');
      return;
    }
    elapsedPrevRef.current += clockNow() - clockStartRef.current;
    if (synthRef.current) { try { synthRef.current.pause(); } catch { /* sin audio */ } }
    limpiarMetronomo();
    setEstado('pausado');
  };

  const handleReset = () => {
    cambioTempoRef.current++; // cancela una reanudación de cambio de tempo pendiente
    cleanup();
    cancelarCuenta();
    translateXRef.current = 0;
    segIdxRef.current = 0;
    elapsedPrevRef.current = 0;
    ultimoProgresoRef.current = 0;
    metroIdxRef.current = 0;
    applyTransform();
    reiniciarTeclado();
    setProgreso(0);
    setEstado('parado');
    synthRef.current = null;
  };

  // ─── Metrónomo y bucle A-B ───
  const toggleMetronomo = () => {
    const nuevo = !metronomo;
    if (nuevo) {
      // Crear el AudioContext cambia la FUENTE del reloj (performance.now →
      // AudioContext). Si ya se estaba tocando hay que reanclar, o el tiempo
      // transcurrido daría un salto enorme.
      const habia = !!audioContextRef.current;
      const ctx = asegurarAudioContext();
      if (ctx && !habia && estadoRef.current === 'tocando') {
        elapsedPrevRef.current += performance.now() - clockStartRef.current;
        clockStartRef.current = clockNow();
      }
      try { ctx?.resume?.(); } catch { /* sin audio */ }
      recolocarMetronomo(elapsedActual());
    } else {
      limpiarMetronomo();
    }
    try { localStorage.setItem('chuy_metronomo', nuevo ? 'si' : 'no'); } catch { /* sin storage */ }
    setMetronomo(nuevo);
  };

  // Posición actual en ms, exacta aunque `progreso` solo se refresque 10 veces/s.
  const elapsedActual = () => (
    estadoRef.current === 'tocando'
      ? elapsedPrevRef.current + (clockNow() - clockStartRef.current)
      : elapsedPrevRef.current
  );

  const marcarA = () => {
    const t = Math.max(0, Math.min(elapsedActual(), finMsRef.current || 0));
    setLoopA(t);
    if (loopB != null && loopB <= t + 500) setLoopB(null); // B dejó de tener sentido
  };

  const marcarB = () => {
    const t = Math.max(0, Math.min(elapsedActual(), finMsRef.current || 0));
    if (loopA == null || t <= loopA + 500) return; // tramo demasiado corto: se ignora
    setLoopB(t);
  };

  const limpiarBucle = () => { setLoopA(null); setLoopB(null); };

  const toggleTeclado = () => {
    const nuevo = !conTeclado;
    try { localStorage.setItem('chuy_teclado_visible', nuevo ? 'si' : 'no'); } catch { /* sin storage */ }
    setConTeclado(nuevo);
  };

  const handleBpmUp = () => setBpmActual(prev => Math.min(200, prev + 5));
  const handleBpmDown = () => setBpmActual(prev => Math.max(20, prev - 5));

  // Cicla 🔊 normal → 🔉 bajito (guía) → 🔇 mudo. El multiplicador de volumen
  // se fija al crear el synth, así que se descarta el actual: el nuevo volumen
  // aplica al siguiente Play (si estaba sonando, el audio se detiene y el
  // scroll sigue — igual que hacía el mute de antes).
  const cambiarVolumen = () => {
    if (estadoRef.current === 'cambiando-tempo') {
      cambioTempoRef.current++;
      estadoRef.current = 'pausado';
      setEstado('pausado');
    }
    if (synthRef.current) {
      try { synthRef.current.stop(); } catch { /* ya parado */ }
      synthRef.current = null;
    }
    // Si estaba sonando, se detiene el audio: pausamos también el scroll para
    // que no siga corriendo en silencio (Play lo retoma con el nuevo volumen).
    if (estadoRef.current === 'tocando') {
      elapsedPrevRef.current += clockNow() - clockStartRef.current;
      setEstado('pausado');
    }
    setVolumen(v => (v === VOL_NORMAL ? VOL_BAJITO : v === VOL_BAJITO ? 0 : VOL_NORMAL));
  };

  const bpmOriginal = bpm || 80;
  const esTempoOriginal = bpmActual === bpmOriginal;
  const bucleActivo = loopA != null && loopB != null;

  // ─── Escalera de tempo ───
  const bpmDeEscalon = (pct) => Math.max(20, Math.min(200, Math.round((bpmOriginal * pct) / 100)));
  // Solo se ilumina un escalón si el BPM cae exacto en él (con ± se sale de la escalera).
  const escalonActual = ESCALONES.find((p) => bpmDeEscalon(p) === bpmActual) ?? null;
  const subirEscalon = () => {
    const i = escalonActual != null ? ESCALONES.indexOf(escalonActual) : -1;
    // Fuera de la escalera (se usó ±5): subir al primer escalón por encima.
    const siguiente = i >= 0
      ? ESCALONES[i + 1]
      : ESCALONES.find((p) => bpmDeEscalon(p) > bpmActual);
    if (siguiente) setBpmActual(bpmDeEscalon(siguiente));
  };
  const puedeSubir = escalonActual !== 100 && bpmActual < bpmDeEscalon(100);

  const tecladoVisible = conTeclado && rangoT !== null;

  return (
    <div className={`mp-container ${isFullscreen ? 'mp-fullscreen' : ''} ${tecladoVisible ? 'mp-con-teclado' : ''}`}>
      <div className="mp-header">
        <h3>🎹 {titulo}</h3>
        {autor && <p className="mp-autor">{autor}</p>}
      </div>

      <div className={`mp-viewport ${multiVoice ? 'mp-viewport-grand' : ''}`} ref={containerRef}>
        {cargando && (
          <div className="mp-loading">
            <span>Preparando audio...</span>
          </div>
        )}
        <div className="mp-playhead"></div>
        <div className="mp-sheet" ref={abcTargetRef}></div>
        {cuenta > 0 && (
          <div className="mp-cuenta" aria-live="polite">
            <span className="mp-cuenta-num">{cuenta}</span>
          </div>
        )}
      </div>

      {/* Teclado iluminado: HERMANO del viewport (capa aparte — encender teclas
          jamás repinta la partitura). Oculto = desmontado = coste cero. */}
      {tecladoVisible && (
        <div className="mp-teclado">
          <Teclado ref={tecladoRef} midiMin={rangoT.min} midiMax={rangoT.max} />
        </div>
      )}

      {/* Barra de avance: muestra cuánto falta y permite ir a cualquier punto */}
      <div className="mp-progreso">
        <span className="mp-tiempo">{fmtTiempo(progreso * duracionMs)}</span>
        <div
          className="mp-barra"
          ref={barraRef}
          onPointerDown={onBarraDown}
          onPointerMove={onBarraMove}
          onPointerUp={onBarraUp}
          onPointerCancel={onBarraUp}
          role="slider"
          tabIndex={0}
          aria-label="Avance de la canción"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progreso * 100)}
        >
          <div className="mp-barra-fill" style={{ width: `${progreso * 100}%` }} />
          {duracionMs > 0 && loopA != null && loopB != null && (
            <div
              className="mp-loop-zona"
              style={{ left: `${(loopA / duracionMs) * 100}%`, width: `${((loopB - loopA) / duracionMs) * 100}%` }}
            />
          )}
          {duracionMs > 0 && loopA != null && (
            <div className="mp-loop-marca mp-loop-marca-a" style={{ left: `${(loopA / duracionMs) * 100}%` }}>A</div>
          )}
          {duracionMs > 0 && loopB != null && (
            <div className="mp-loop-marca mp-loop-marca-b" style={{ left: `${(loopB / duracionMs) * 100}%` }}>B</div>
          )}
          <div className="mp-barra-thumb" style={{ left: `${progreso * 100}%` }} />
        </div>
        <span className="mp-tiempo">{fmtTiempo(duracionMs)}</span>
      </div>

      <div className="mp-controls">
        {estado === 'cuenta' ? (
          <button className="mp-btn mp-btn-pause" onClick={cancelarCuenta}>
            ✕ Cancelar
          </button>
        ) : estado !== 'tocando' && estado !== 'cambiando-tempo' ? (
          <button className="mp-btn mp-btn-play" onClick={handlePlay} disabled={cargando}>
            ▶ {cargando ? 'Cargando...' : estado === 'pausado' ? 'Continuar' : 'Play'}
          </button>
        ) : (
          <button className="mp-btn mp-btn-pause" onClick={handlePause}>
            ⏸ Pausa
          </button>
        )}

        <button className="mp-btn mp-btn-reset" onClick={handleReset} disabled={cargando}>
          ⏹ Reset
        </button>

        <button
          className={`mp-btn ${volumen > 0 ? 'mp-btn-sound-on' : 'mp-btn-sound-off'}`}
          onClick={cambiarVolumen}
          title={volumen === VOL_NORMAL ? 'Volumen normal (toca para bajarlo)' : volumen > 0 ? 'Volumen bajito: solo guía (toca para silenciar)' : 'Sin sonido (toca para volumen normal)'}
        >
          {volumen === VOL_NORMAL ? '🔊' : volumen > 0 ? '🔉' : '🔇'}
        </button>

        <button
          className={`mp-btn ${conTeclado ? 'mp-btn-sound-on' : 'mp-btn-sound-off'}`}
          onClick={toggleTeclado}
          aria-pressed={conTeclado}
          title={conTeclado ? 'Ocultar teclado' : 'Mostrar teclado'}
        >
          🎹
        </button>

        <button
          className={`mp-btn ${metronomo ? 'mp-btn-metro-on' : 'mp-btn-sound-off'}`}
          onClick={toggleMetronomo}
          aria-pressed={metronomo}
          title={metronomo
            ? 'Metrónomo encendido — el Play empieza con un compás de cuenta'
            : 'Encender metrónomo (suena aunque bajes el volumen de la pieza)'}
        >
          🥁
        </button>

        <button
          className="mp-btn mp-btn-fullscreen"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
        >
          {isFullscreen ? '✕' : '⛶'}
        </button>

        {/* Bucle A-B: marca un tramo y se repite solo. Los puntos se toman de
            donde vaya la reproducción, así que se marcan al vuelo. */}
        <div className="mp-loop-control">
          <span className="mp-loop-label">🔁</span>
          <button
            className={`mp-loop-btn ${loopA != null ? 'mp-loop-on' : ''}`}
            onClick={marcarA}
            title="Marcar aquí el INICIO del tramo a repetir"
          >
            A
          </button>
          <button
            className={`mp-loop-btn ${loopB != null ? 'mp-loop-on' : ''}`}
            onClick={marcarB}
            disabled={loopA == null}
            title={loopA == null ? 'Primero marca A' : 'Marcar aquí el FINAL del tramo a repetir'}
          >
            B
          </button>
          {(loopA != null || loopB != null) && (
            <button className="mp-loop-clear" onClick={limpiarBucle} title="Quitar el bucle">✕</button>
          )}
        </div>

        <div className="mp-bpm-control">
          <span className="mp-bpm-label">BPM</span>
          <button className="mp-bpm-btn" onClick={handleBpmDown}>−</button>
          {/* El número no cambia de ancho y el "↺ original" va debajo, con su
              lugar siempre reservado: al mover el tempo la fila ya no crece ni
              manda la escalera a otro renglón (idea del usuario). */}
          <div className="mp-bpm-centro">
            <span className="mp-bpm-value">{bpmActual}</span>
            <button
              className={`mp-bpm-original ${esTempoOriginal ? 'mp-bpm-original-oculto' : ''}`}
              onClick={() => setBpmActual(bpmOriginal)}
              disabled={esTempoOriginal}
              tabIndex={esTempoOriginal ? -1 : 0}
              aria-hidden={esTempoOriginal}
              title={`Volver al tempo original: ${bpmOriginal}`}
            >
              ↺ {bpmOriginal}
            </button>
          </div>
          <button className="mp-bpm-btn" onClick={handleBpmUp}>+</button>
        </div>

        {/* Escalera de tempo: % del tempo original. Al cambiar de escalón NO se
            pierde el lugar en la pieza ni el bucle marcado. */}
        <div className="mp-escalera">
          <span className="mp-escalera-label" title="Escalera de tempo: practica lento y ve subiendo">🪜</span>
          {ESCALONES.map((p) => (
            <button
              key={p}
              className={`mp-escalon ${escalonActual === p ? 'mp-escalon-on' : ''}`}
              onClick={() => setBpmActual(bpmDeEscalon(p))}
              aria-pressed={escalonActual === p}
              title={`${p}% del tempo original — ${bpmDeEscalon(p)} BPM`}
            >
              {p}
            </button>
          ))}
          <button
            className="mp-escalon mp-escalon-subir"
            onClick={subirEscalon}
            disabled={!puedeSubir}
            title="Subir un escalón"
          >
            ⏫
          </button>
        </div>
      </div>

      <p className="mp-instruction">
        {!esTempoOriginal && (
          <span className="mp-tempo-badge">
            {bpmActual < bpmOriginal ? '🐢 Lento' : '🐇 Rápido'} ({bpmActual}/{bpmOriginal})
          </span>
        )}
        {bucleActivo && (
          <span className="mp-loop-badge">
            🔁 {fmtTiempo(loopA)} – {fmtTiempo(loopB)}
          </span>
        )}
        {bucleActivo
          ? ' Repitiendo ese tramo — sube la escalera 🪜 y el bucle se mantiene'
          : esTempoOriginal
            ? 'Presiona Play y sigue las notas cuando pasen por la línea roja'
            : ' — Al cambiar de tempo no pierdes tu lugar en la pieza'}
      </p>
    </div>
  );
};

export default MusicPrompter;
