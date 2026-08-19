import React, { useState, useEffect, useRef, useCallback } from 'react';
import abcjs from 'abcjs';
import './MusicPrompter.css';
import Teclado from '../../piano/Teclado';
import { rangoTeclado } from '../../../utils/musica';

/**
 * Estima el número de compases contando barras `|` en las líneas de notas.
 * En multi-voz cuenta solo la voz 1 (las voces tienen los mismos compases).
 * Nota: las barras YA NO se eliminan del ABC — eso era necesario con el motor
 * viejo de velocidad constante; el mapa tiempo→posición absorbe su espacio.
 */
const estimarCompases = (abc) => {
  const lines = abc.split('\n');
  let voz = null;
  let compases = 0;
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('%%')) continue;
    const vm = line.match(/^V:\s*(\d+)/);
    if (vm) { voz = vm[1]; continue; }
    if (/^[A-Z]:/.test(line)) continue; // encabezados X:/T:/M:/L:/K:
    if (voz === null || voz === '1') {
      compases += (line.match(/\|/g) || []).length;
    }
  }
  return Math.max(1, compases);
};

// Niveles de volumen del synth (multiplicador del soundfont).
const VOL_NORMAL = 1;
const VOL_BAJITO = 0.4;

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

  const containerRef = useRef(null);
  const abcTargetRef = useRef(null);
  const translateXRef = useRef(0);
  const rafIdRef = useRef(null);
  const viewportWidthRef = useRef(600);
  const playheadOffsetRef = useRef(150);
  const firstNoteOffsetRef = useRef(0);
  const musicWidthRef = useRef(0);

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

  const synthRef = useRef(null);
  const visualObjRef = useRef(null);
  const audioContextRef = useRef(null);
  const estadoRef = useRef('parado');

  useEffect(() => { estadoRef.current = estado; }, [estado]);

  // Mismo reloj que el sintetizador; respaldo a performance.now() si no hay audio.
  const clockNow = useCallback(() => (
    audioContextRef.current ? audioContextRef.current.currentTime * 1000 : performance.now()
  ), []);

  const measureViewport = useCallback(() => {
    if (containerRef.current) {
      viewportWidthRef.current = containerRef.current.clientWidth;
      playheadOffsetRef.current = viewportWidthRef.current * 0.25;
    }
  }, []);

  // ─── Apply CSS transform ───
  const applyTransform = useCallback(() => {
    const offset = playheadOffsetRef.current - firstNoteOffsetRef.current - translateXRef.current;
    if (abcTargetRef.current) {
      abcTargetRef.current.style.transform = `translateX(${offset}px)`;
    }
  }, []);

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

    const svgRect = svg.getBoundingClientRect();
    const allNotes = svg.querySelectorAll('.abcjs-note, .abcjs-rest');
    if (allNotes.length > 0) {
      const firstRect = allNotes[0].getBoundingClientRect();
      const lastRect = allNotes[allNotes.length - 1].getBoundingClientRect();
      firstNoteOffsetRef.current = firstRect.left - svgRect.left;
      musicWidthRef.current = (lastRect.right - firstRect.left) + 100;
    } else {
      firstNoteOffsetRef.current = 0;
      musicWidthRef.current = svgRect.width;
    }

    // Altura adaptativa: el viewport crece con la partitura real (líneas
    // adicionales, grand staff). Vía variable CSS para que el modo fullscreen
    // (flex) siga mandando sobre esta medida.
    if (containerRef.current && svgRect.height > 0) {
      const alto = Math.max(240, Math.ceil(svgRect.height) + 30);
      containerRef.current.style.setProperty('--mp-alto', `${alto}px`);
    }

    const puntos = [];
    let finMs = 0;
    try {
      visualObj.setTiming(qpm, 0);
      (visualObj.noteTimings || []).forEach((ev) => {
        if (ev.type === 'end') {
          finMs = Math.max(finMs, ev.milliseconds || 0);
          return;
        }
        if (ev.type !== 'event') return;
        const el = ev.elements?.[0]?.[0];
        if (!el) return;
        const x = el.getBoundingClientRect().left - svgRect.left - firstNoteOffsetRef.current;
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

    // ─── Línea de tiempo del TECLADO (cálculo aparte; el mapa de arriba no se toca) ───
    // setUpAudio entrega las voces YA separadas (track 0 = derecha, 1 = izquierda)
    // con pitch MIDI y tiempos en redondas. Es transformación pura, sin audio.
    // (noteTimings no sirve aquí: en abcjs 6.6.2 no trae midiPitches en nuestro
    // orden de llamadas, y fusiona las voces que coinciden en el tiempo.)
    try {
      const audio = visualObj.setUpAudio({ qpm });
      const beatLen = visualObj.getBeatLength() || 0.25;
      const factorMs = 60000 / qpm / beatLen; // redondas → ms
      const tracks = (audio && audio.tracks) || [];
      const nVoces = Math.min(multiVoice ? 2 : 1, tracks.length);
      const linea = [];
      const midis = [];
      for (let v = 0; v < nVoces; v++) {
        const manoVoz = mano !== 'ambas' ? mano : (v === 0 ? 'derecha' : 'izquierda');
        for (const item of tracks[v]) {
          if (item.cmd !== 'note' || typeof item.pitch !== 'number') continue;
          const t = item.start * factorMs;
          const dur = item.duration * factorMs;
          // fin un poco antes del valor real para que las notas repetidas
          // parpadeen; suelo de 60ms para que las semicorcheas se alcancen a ver.
          linea.push({ t, fin: t + Math.max(60, dur - 40), midi: item.pitch, mano: manoVoz });
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
  }, [multiVoice, mano, reiniciarTeclado]);

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
  };

  // ─── Prepare synth (called on Play — requires user gesture) ───
  const prepareSynth = async (qpm) => {
    if (synthRef.current) return;

    setCargando(true);
    try {
      if (!visualObjRef.current) return;

      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioContext();
      }
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
      for (const n of activas) (n.mano === 'izquierda' ? izq : der).push(n.midi);
      tecladoRef.current.setActivas(der, izq);
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

  // ─── Animación: x(t) por interpolación sobre el mapa ───
  const animate = useCallback(() => {
    if (!puntosRef.current.length) return;

    const elapsed = elapsedPrevRef.current + (clockNow() - clockStartRef.current);

    translateXRef.current = posEn(elapsed);
    applyTransform();

    // El teclado va DESPUÉS del scroll: la partitura se compromete primero.
    actualizarTeclado(elapsed);

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
  }, [applyTransform, clockNow, onTerminar, posEn, actualizarTeclado]);

  // ─── Ir a un punto de la pieza (barra de avance) ───
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

    if (conAudio && synthRef.current) {
      // seek en segundos: si está sonando reengancha el audio ahí; si está
      // parado/pausado deja la posición lista para el siguiente start().
      try { synthRef.current.seek(target / 1000, 'seconds'); } catch { /* sin audio */ }
    }
  }, [applyTransform, clockNow, posEn, actualizarTeclado]);

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

  // ─── BPM change: re-render + reconstruir mapa ───
  useEffect(() => {
    if (!visualObjRef.current || !abcTargetRef.current) return;

    cleanup();
    synthRef.current = null;
    translateXRef.current = 0;
    segIdxRef.current = 0;
    elapsedPrevRef.current = 0;
    setEstado('parado');

    // Re-render
    abcTargetRef.current.innerHTML = '';
    const visualObj = abcjs.renderAbc(abcTargetRef.current, abcNotation, {
      staffwidth: calcStaffwidth(abcNotation, multiVoice), scale: 2, wrap: null, add_classes: true,
      selectTypes: false, paddingtop: 0, paddingbottom: 0, paddingleft: 20,
    });
    visualObjRef.current = visualObj[0];

    requestAnimationFrame(() => {
      measureViewport();
      medirYMapear(bpmActual);
      applyTransform();
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

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await containerRef.current?.parentElement?.requestFullscreen();
      else await document.exitFullscreen();
    } catch { /* fullscreen no disponible */ }
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

    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    // Arranca desde donde esté el cursor: 0 tras Reset, o el punto elegido en
    // la barra de avance. Reanudar tras pausa usa el mismo camino.
    const desdeMs = elapsedPrevRef.current;
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
    elapsedPrevRef.current += clockNow() - clockStartRef.current;
    if (synthRef.current) { try { synthRef.current.pause(); } catch { /* sin audio */ } }
    setEstado('pausado');
  };

  const handleReset = () => {
    cleanup();
    translateXRef.current = 0;
    segIdxRef.current = 0;
    elapsedPrevRef.current = 0;
    ultimoProgresoRef.current = 0;
    applyTransform();
    reiniciarTeclado();
    setProgreso(0);
    setEstado('parado');
    synthRef.current = null;
  };

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
          <div className="mp-barra-thumb" style={{ left: `${progreso * 100}%` }} />
        </div>
        <span className="mp-tiempo">{fmtTiempo(duracionMs)}</span>
      </div>

      <div className="mp-controls">
        {estado !== 'tocando' ? (
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
          className="mp-btn mp-btn-fullscreen"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
        >
          {isFullscreen ? '✕' : '⛶'}
        </button>

        <div className="mp-bpm-control">
          <span className="mp-bpm-label">BPM</span>
          <button className="mp-bpm-btn" onClick={handleBpmDown}>−</button>
          <span className="mp-bpm-value">{bpmActual}</span>
          <button className="mp-bpm-btn" onClick={handleBpmUp}>+</button>
          {!esTempoOriginal && (
            <button className="mp-bpm-reset" onClick={() => setBpmActual(bpmOriginal)} title={`Tempo original: ${bpmOriginal}`}>
              ↺
            </button>
          )}
        </div>
      </div>

      <p className="mp-instruction">
        {!esTempoOriginal && (
          <span className="mp-tempo-badge">
            {bpmActual < bpmOriginal ? '🐢 Lento' : '🐇 Rápido'} ({bpmActual}/{bpmOriginal})
          </span>
        )}
        {esTempoOriginal
          ? 'Presiona Play y sigue las notas cuando pasen por la línea roja'
          : ' — Al cambiar BPM se reinicia la canción'}
      </p>
    </div>
  );
};

export default MusicPrompter;
