import React, { useState, useEffect, useRef, useCallback } from 'react';
import abcjs from 'abcjs';
import './MusicPrompter.css';

const MusicPrompter = ({ abcNotation, bpm, titulo, autor, onTerminar, multiVoice = false }) => {
  const [estado, setEstado] = useState('parado');
  const [bpmActual, setBpmActual] = useState(bpm || 80);
  const [sonidoOn, setSonidoOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef(null);
  const abcTargetRef = useRef(null);
  const translateXRef = useRef(0);
  const rafIdRef = useRef(null);
  const lastTimestampRef = useRef(null);
  const viewportWidthRef = useRef(600);
  const pixelsPerSecondRef = useRef(0);
  const playheadOffsetRef = useRef(150);
  const firstNoteOffsetRef = useRef(0);
  const musicWidthRef = useRef(0);

  // Correction refs (híbrido: scroll continuo + corrección por nota)
  const correctionRef = useRef(0); // px de corrección acumulada

  // Audio refs
  const synthRef = useRef(null);
  const visualObjRef = useRef(null);
  const audioContextRef = useRef(null);
  const timingRef = useRef(null);
  const estadoRef = useRef('parado');

  useEffect(() => { estadoRef.current = estado; }, [estado]);

  // --- Renderizar ABC → SVG ---
  useEffect(() => {
    if (!abcTargetRef.current || !abcNotation) return;

    abcTargetRef.current.innerHTML = '';

    const visualObj = abcjs.renderAbc(abcTargetRef.current, abcNotation, {
      staffwidth: multiVoice ? 8000 : 3000,
      wrap: null,
      add_classes: true,
      paddingtop: 10,
      paddingbottom: 10,
      paddingleft: 20,
    });

    visualObjRef.current = visualObj[0];

    requestAnimationFrame(() => {
      const svg = abcTargetRef.current?.querySelector('svg');
      if (svg) {
        const svgRect = svg.getBoundingClientRect();

        // Encontrar primera y última nota para medir el rango real de la música
        const allNotes = svg.querySelectorAll('.abcjs-note, .abcjs-rest');
        if (allNotes.length > 0) {
          const firstRect = allNotes[0].getBoundingClientRect();
          const lastRect = allNotes[allNotes.length - 1].getBoundingClientRect();
          firstNoteOffsetRef.current = firstRect.left - svgRect.left;
          // Ancho real = desde primera nota hasta el final de la última nota
          musicWidthRef.current = (lastRect.right - firstRect.left) + 50; // +50 margen
        } else {
          firstNoteOffsetRef.current = 0;
          musicWidthRef.current = svgRect.width;
        }
      }
      measureViewport();
      translateXRef.current = 0;
      correctionRef.current = 0;
      applyTransform();

      prepareAll(bpmActual);
    });

    return () => { cleanup(); };
  }, [abcNotation]);

  const cleanup = () => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (timingRef.current) {
      try { timingRef.current.stop(); } catch(e) {}
      timingRef.current = null;
    }
    if (synthRef.current) {
      try { synthRef.current.stop(); } catch(e) {}
    }
  };

  const measureViewport = useCallback(() => {
    if (containerRef.current) {
      viewportWidthRef.current = containerRef.current.clientWidth;
      playheadOffsetRef.current = viewportWidthRef.current * 0.25;
    }
  }, []);

  // --- Preparar synth + TimingCallbacks ---
  const prepareAll = async (qpm) => {
    try {
      if (!visualObjRef.current) return;

      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioContext();
      }

      // Synth
      const synth = new abcjs.synth.CreateSynth();
      await synth.init({
        visualObj: visualObjRef.current,
        audioContext: audioContextRef.current,
        options: {
          qpm: qpm,
          soundFontUrl: 'https://paulrosen.github.io/midi-js-soundfonts/FluidR3_GM/',
          program: 0,
        },
      });
      await synth.prime();
      synthRef.current = synth;

      // Calibrar scroll con duración real del audio
      const realDuration = synth.duration;
      const scrollableWidth = musicWidthRef.current;
      pixelsPerSecondRef.current = scrollableWidth > 0 && realDuration > 0
        ? scrollableWidth / realDuration
        : 0;

      // TimingCallbacks para corrección por nota
      const timing = new abcjs.TimingCallbacks(visualObjRef.current, {
        qpm: qpm,
        eventCallback: onNoteEvent,
      });
      timingRef.current = timing;

    } catch (err) {
      console.warn('Error preparando audio/timing:', err);
      calibrateScrollFallback(qpm);
    }
  };

  const calibrateScrollFallback = (qpm) => {
    const lines = abcNotation.split('\n');
    const notesLine = lines.filter(l => l && !l.match(/^[A-Z]:/)).join(' ');
    let beats = 0;
    const noteRegex = /([A-Ga-gz][',]*)((\d+)?(\/(\d+))?)/g;
    let match;
    while ((match = noteRegex.exec(notesLine)) !== null) {
      const d = match[2];
      if (!d || d === '') beats += 1;
      else if (match[3] && !match[4]) beats += parseInt(match[3], 10);
      else if (match[4]) {
        const num = match[3] ? parseInt(match[3], 10) : 1;
        beats += num / parseInt(match[5], 10);
      } else beats += 1;
    }
    beats = Math.max(beats, 1);
    const duration = (beats / qpm) * 60;
    const w = musicWidthRef.current;
    pixelsPerSecondRef.current = w > 0 ? w / duration : 0;
  };

  // --- Callback por nota: calcular corrección ---
  const onNoteEvent = (event) => {
    if (!event) {
      // Fin de la canción
      if (estadoRef.current === 'tocando') {
        setEstado('parado');
        if (onTerminar) onTerminar();
      }
      return;
    }

    if (event.elements && event.elements.length > 0 && event.elements[0].length > 0) {
      const noteEl = event.elements[0][0];
      if (noteEl && abcTargetRef.current) {
        const svgRect = abcTargetRef.current.querySelector('svg')?.getBoundingClientRect();
        if (svgRect) {
          const noteRect = noteEl.getBoundingClientRect();
          // Posición real de la nota en el SVG (ambos incluyen transform, se cancelan)
          const noteRealX = noteRect.left - svgRect.left;
          // Posición donde el scroll cree que está (relativo a firstNoteOffset)
          const scrollX = translateXRef.current + firstNoteOffsetRef.current;
          // Diferencia = error acumulado
          const error = noteRealX - scrollX;
          // Aplicar corrección suave (se absorbe gradualmente en el rAF loop)
          correctionRef.current += error;
        }
      }
    }
  };

  // --- Aplicar transform CSS ---
  const applyTransform = useCallback(() => {
    if (abcTargetRef.current) {
      const offset = playheadOffsetRef.current - firstNoteOffsetRef.current - translateXRef.current;
      abcTargetRef.current.style.transform = `translateX(${offset}px)`;
    }
  }, []);

  // --- Loop de animación: scroll continuo + absorción de corrección ---
  const animate = useCallback((timestamp) => {
    if (!lastTimestampRef.current) {
      lastTimestampRef.current = timestamp;
    }

    const deltaMs = timestamp - lastTimestampRef.current;
    lastTimestampRef.current = timestamp;

    // Avance continuo (velocidad constante basada en duración real)
    let advance = pixelsPerSecondRef.current * (deltaMs / 1000);

    // Absorber corrección suavemente (20% por frame)
    if (Math.abs(correctionRef.current) > 0.5) {
      const correction = correctionRef.current * 0.2;
      advance += correction;
      correctionRef.current -= correction;
    } else {
      correctionRef.current = 0;
    }

    translateXRef.current += advance;

    // Fin de canción
    const maxScroll = musicWidthRef.current;
    if (translateXRef.current >= maxScroll) {
      translateXRef.current = maxScroll;
      applyTransform();
      return;
    }

    applyTransform();
    rafIdRef.current = requestAnimationFrame(animate);
  }, [applyTransform]);

  // --- Control de animación por estado ---
  useEffect(() => {
    if (estado === 'tocando') {
      lastTimestampRef.current = null;
      rafIdRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [estado, animate]);

  // --- Cambio de BPM ---
  useEffect(() => {
    if (!visualObjRef.current) return;

    cleanup();
    translateXRef.current = 0;
    correctionRef.current = 0;
    lastTimestampRef.current = null;
    applyTransform();
    setEstado('parado');

    prepareAll(bpmActual);
  }, [bpmActual]);

  // --- Fullscreen ---
  useEffect(() => {
    const onFsChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      setTimeout(() => {
        measureViewport();
        if (translateXRef.current === 0) applyTransform();
      }, 300);
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
      if (!document.fullscreenElement) {
        await containerRef.current?.parentElement?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen no disponible:', err);
    }
  };

  // --- Handlers ---
  const handlePlay = async () => {
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    if (estado === 'pausado') {
      if (sonidoOn && synthRef.current) {
        try { synthRef.current.resume(); } catch(e) {}
      }
      if (timingRef.current) {
        try { timingRef.current.resume(); } catch(e) {}
      }
    } else {
      if (sonidoOn && synthRef.current) {
        try { synthRef.current.start(); } catch(e) {}
      }
      if (timingRef.current) {
        try { timingRef.current.start(); } catch(e) {}
      }
    }

    setEstado('tocando');
  };

  const handlePause = () => {
    if (synthRef.current) {
      try { synthRef.current.pause(); } catch(e) {}
    }
    if (timingRef.current) {
      try { timingRef.current.pause(); } catch(e) {}
    }
    setEstado('pausado');
  };

  const handleReset = () => {
    cleanup();
    translateXRef.current = 0;
    correctionRef.current = 0;
    lastTimestampRef.current = null;
    applyTransform();
    setEstado('parado');
    prepareAll(bpmActual);
  };

  const handleBpmUp = () => setBpmActual(prev => Math.min(200, prev + 5));
  const handleBpmDown = () => setBpmActual(prev => Math.max(20, prev - 5));

  const toggleSonido = () => {
    if (sonidoOn && synthRef.current && estado === 'tocando') {
      try { synthRef.current.stop(); } catch(e) {}
    }
    setSonidoOn(prev => !prev);
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
        <div className="mp-playhead"></div>
        <div className="mp-sheet" ref={abcTargetRef}></div>
      </div>

      <div className="mp-controls">
        {estado !== 'tocando' ? (
          <button className="mp-btn mp-btn-play" onClick={handlePlay}>
            ▶ {estado === 'pausado' ? 'Continuar' : 'Play'}
          </button>
        ) : (
          <button className="mp-btn mp-btn-pause" onClick={handlePause}>
            ⏸ Pausa
          </button>
        )}

        <button
          className="mp-btn mp-btn-reset"
          onClick={handleReset}
          disabled={estado === 'parado' && translateXRef.current === 0}
        >
          ⏹ Reset
        </button>

        <button
          className={`mp-btn ${sonidoOn ? 'mp-btn-sound-on' : 'mp-btn-sound-off'}`}
          onClick={toggleSonido}
          title={sonidoOn ? 'Silenciar' : 'Activar sonido'}
        >
          {sonidoOn ? '🔊' : '🔇'}
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
            <button
              className="mp-bpm-reset"
              onClick={() => setBpmActual(bpmOriginal)}
              title={`Tempo original: ${bpmOriginal}`}
            >
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
