import React, { useState, useEffect, useRef, useCallback } from 'react';
import abcjs from 'abcjs';
import './MusicPrompter.css';

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

/**
 * Ancho del pentagrama PROPORCIONAL al contenido (px por compás constante),
 * para que piezas largas no se compriman. Tope de seguridad para no generar
 * SVGs absurdamente anchos (~120k px CSS a scale 2).
 */
const calcStaffwidth = (abc, multiVoice) => {
  const compases = estimarCompases(abc);
  const porCompas = multiVoice ? 1100 : 500;
  return Math.min(Math.max(1500, compases * porCompas), 60000);
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
const MusicPrompter = ({ abcNotation, bpm, titulo, autor, onTerminar, multiVoice = false }) => {
  const [estado, setEstado] = useState('parado');
  const [bpmActual, setBpmActual] = useState(bpm || 80);
  // Volumen del synth: 1 = normal (escuchar la pieza), 0.2 = guía apenas
  // audible (el niño toca y el synth solo lo orienta), 0 = mudo.
  const [volumen, setVolumen] = useState(1);
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
      }
    } catch (err) {
      console.warn('Error preparando audio:', err);
    }
    setCargando(false);
  };

  // ─── Animación: x(t) por interpolación sobre el mapa ───
  const animate = useCallback(() => {
    const puntos = puntosRef.current;
    if (!puntos.length) return;

    const elapsed = elapsedPrevRef.current + (clockNow() - clockStartRef.current);

    // Avanza el cursor de segmento (monotónico, O(1) amortizado por frame).
    let i = segIdxRef.current;
    while (i < puntos.length - 1 && elapsed >= puntos[i + 1].t) i++;
    segIdxRef.current = i;

    const a = puntos[i];
    const b = puntos[Math.min(i + 1, puntos.length - 1)];
    let x;
    if (b.t <= a.t) {
      x = b.x;
    } else if (b.x < a.x) {
      // Repetición (|: :|): la música salta hacia atrás. Mantener posición y
      // saltar de golpe al cambiar de segmento, no interpolar en reversa.
      x = a.x;
    } else {
      const f = Math.max(0, Math.min(1, (elapsed - a.t) / (b.t - a.t)));
      x = a.x + (b.x - a.x) * f;
    }

    translateXRef.current = x;
    applyTransform();

    if (elapsed >= finMsRef.current) {
      if (estadoRef.current === 'tocando') {
        setEstado('parado');
        if (onTerminar) onTerminar();
      }
      return;
    }
    rafIdRef.current = requestAnimationFrame(animate);
  }, [applyTransform, clockNow, onTerminar]);

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
      // Prepare synth on first play
      if (!synthRef.current) {
        await prepareSynth(bpmActual);
      }
    }

    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    if (estado === 'pausado') {
      if (volumen > 0 && synthRef.current) { try { synthRef.current.resume(); } catch { /* sin audio */ } }
    } else {
      translateXRef.current = 0;
      segIdxRef.current = 0;
      elapsedPrevRef.current = 0;
      if (volumen > 0 && synthRef.current) { try { synthRef.current.start(); } catch { /* sin audio */ } }
    }

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
    applyTransform();
    setEstado('parado');
    synthRef.current = null;
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
    setVolumen(v => (v === 1 ? 0.2 : v === 0.2 ? 0 : 1));
  };

  const bpmOriginal = bpm || 80;
  const esTempoOriginal = bpmActual === bpmOriginal;

  return (
    <div className={`mp-container ${isFullscreen ? 'mp-fullscreen' : ''}`}>
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
          title={volumen === 1 ? 'Volumen normal (toca para bajarlo)' : volumen > 0 ? 'Volumen bajito: solo guía (toca para silenciar)' : 'Sin sonido (toca para volumen normal)'}
        >
          {volumen === 1 ? '🔊' : volumen > 0 ? '🔉' : '🔇'}
        </button>

        {isFullscreen && (
          <button className="mp-btn mp-btn-fullscreen" onClick={toggleFullscreen} title="Salir de pantalla completa">
            ✕
          </button>
        )}

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
