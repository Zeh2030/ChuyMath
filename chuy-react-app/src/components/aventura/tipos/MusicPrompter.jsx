import React, { useState, useEffect, useRef, useCallback } from 'react';
import abcjs from 'abcjs';
import './MusicPrompter.css';

/**
 * Estima el total de beats en una cadena de notación ABC.
 * Asume L:1/4 (cada nota sin modificador = 1 beat).
 */
function estimateTotalBeats(abcNotation) {
  const lines = abcNotation.split('\n');
  const notesLine = lines
    .filter(l => l && !l.match(/^[A-Z]:/))
    .join(' ');

  let beats = 0;
  const noteRegex = /([A-Ga-gz][',]*)((\d+)?(\/(\d+))?)/g;
  let match;
  while ((match = noteRegex.exec(notesLine)) !== null) {
    const fullDuration = match[2];
    if (!fullDuration || fullDuration === '') {
      beats += 1;
    } else if (match[3] && !match[4]) {
      beats += parseInt(match[3], 10);
    } else if (match[4]) {
      const num = match[3] ? parseInt(match[3], 10) : 1;
      const den = parseInt(match[5], 10);
      beats += num / den;
    } else {
      beats += 1;
    }
  }
  return Math.max(beats, 1);
}

const MusicPrompter = ({ abcNotation, bpm, titulo, autor, onTerminar }) => {
  const [estado, setEstado] = useState('parado');
  const [bpmActual, setBpmActual] = useState(bpm || 80);
  const [sonidoOn, setSonidoOn] = useState(true);
  const [synthReady, setSynthReady] = useState(false);

  const containerRef = useRef(null);
  const abcTargetRef = useRef(null);
  const translateXRef = useRef(0);
  const rafIdRef = useRef(null);
  const lastTimestampRef = useRef(null);
  const totalWidthRef = useRef(0);
  const viewportWidthRef = useRef(600);
  const pixelsPerSecondRef = useRef(0);
  const playheadOffsetRef = useRef(150);

  // Audio refs
  const synthControlRef = useRef(null);
  const visualObjRef = useRef(null);
  const audioContextRef = useRef(null);

  // --- Renderizar ABC → SVG ---
  useEffect(() => {
    if (!abcTargetRef.current || !abcNotation) return;

    abcTargetRef.current.innerHTML = '';

    const visualObj = abcjs.renderAbc(abcTargetRef.current, abcNotation, {
      staffwidth: 3000,
      add_classes: true,
      paddingtop: 10,
      paddingbottom: 10,
      paddingleft: 20,
    });

    visualObjRef.current = visualObj[0];

    requestAnimationFrame(() => {
      const svg = abcTargetRef.current?.querySelector('svg');
      if (svg) {
        totalWidthRef.current = svg.getBoundingClientRect().width;
      }
      if (containerRef.current) {
        viewportWidthRef.current = containerRef.current.clientWidth;
        playheadOffsetRef.current = viewportWidthRef.current * 0.25;
      }
      recalcSpeed();
      translateXRef.current = 0;
      applyTransform();
    });

    // Inicializar sintetizador
    initSynth();

    return () => {
      // Cleanup synth
      if (synthControlRef.current) {
        try { synthControlRef.current.stop(); } catch(e) {}
      }
    };
  }, [abcNotation]);

  // --- Inicializar sintetizador de audio ---
  const initSynth = async () => {
    try {
      if (!visualObjRef.current) return;

      // Crear AudioContext si no existe
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioContext();
      }

      const synth = new abcjs.synth.CreateSynth();
      await synth.init({
        visualObj: visualObjRef.current,
        audioContext: audioContextRef.current,
        millisecondsPerMeasure: undefined, // Usará el tempo del ABC
        options: {
          qpm: bpmActual, // quarters per minute
          soundFontUrl: 'https://paulrosen.github.io/midi-js-soundfonts/FluidR3_GM/',
          program: 0, // Acoustic Grand Piano
        },
      });

      await synth.prime();
      synthControlRef.current = synth;
      setSynthReady(true);
    } catch (err) {
      console.warn('Audio synth no disponible:', err);
      setSynthReady(false);
    }
  };

  // --- Recalcular velocidad ---
  const recalcSpeed = useCallback(() => {
    const totalBeats = estimateTotalBeats(abcNotation);
    const totalDurationSec = (totalBeats / bpmActual) * 60;
    const scrollableWidth = totalWidthRef.current;
    pixelsPerSecondRef.current = scrollableWidth > 0
      ? scrollableWidth / totalDurationSec
      : 0;
  }, [abcNotation, bpmActual]);

  useEffect(() => {
    recalcSpeed();
  }, [bpmActual, recalcSpeed]);

  // --- Aplicar transform CSS ---
  const applyTransform = useCallback(() => {
    if (abcTargetRef.current) {
      const offset = playheadOffsetRef.current - translateXRef.current;
      abcTargetRef.current.style.transform = `translateX(${offset}px)`;
    }
  }, []);

  // --- Loop de animación ---
  const animate = useCallback((timestamp) => {
    if (!lastTimestampRef.current) {
      lastTimestampRef.current = timestamp;
    }

    const deltaMs = timestamp - lastTimestampRef.current;
    lastTimestampRef.current = timestamp;

    translateXRef.current += pixelsPerSecondRef.current * (deltaMs / 1000);

    const maxScroll = totalWidthRef.current;
    if (translateXRef.current >= maxScroll) {
      translateXRef.current = maxScroll;
      applyTransform();
      setEstado('parado');
      if (onTerminar) onTerminar();
      return;
    }

    applyTransform();
    rafIdRef.current = requestAnimationFrame(animate);
  }, [applyTransform, onTerminar]);

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

  // --- Handlers ---
  const handlePlay = async () => {
    // Resumir AudioContext si está suspendido (requiere interacción del usuario)
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    // Iniciar/reanudar audio
    if (sonidoOn && synthControlRef.current) {
      try {
        if (estado === 'pausado') {
          synthControlRef.current.resume();
        } else {
          // Re-init synth con BPM actual para nuevo play
          await initSynth();
          synthControlRef.current.start();
        }
      } catch (err) {
        console.warn('Error al reproducir audio:', err);
      }
    }

    setEstado('tocando');
  };

  const handlePause = () => {
    if (sonidoOn && synthControlRef.current) {
      try { synthControlRef.current.pause(); } catch(e) {}
    }
    setEstado('pausado');
  };

  const handleReset = () => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (synthControlRef.current) {
      try { synthControlRef.current.stop(); } catch(e) {}
    }
    translateXRef.current = 0;
    lastTimestampRef.current = null;
    applyTransform();
    setEstado('parado');
  };

  const handleBpmUp = () => setBpmActual(prev => Math.min(200, prev + 5));
  const handleBpmDown = () => setBpmActual(prev => Math.max(20, prev - 5));

  const toggleSonido = () => {
    if (sonidoOn && synthControlRef.current && estado === 'tocando') {
      try { synthControlRef.current.stop(); } catch(e) {}
    }
    setSonidoOn(prev => !prev);
  };

  const bpmOriginal = bpm || 80;
  const esTempoOriginal = bpmActual === bpmOriginal;

  return (
    <div className="mp-container">
      <div className="mp-header">
        <h3>🎹 {titulo}</h3>
        {autor && <p className="mp-autor">{autor}</p>}
      </div>

      <div className="mp-viewport" ref={containerRef}>
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
            Tempo: {bpmActual < bpmOriginal ? '🐢 Lento' : '🐇 Rápido'} ({bpmActual}/{bpmOriginal})
          </span>
        )}
        {esTempoOriginal
          ? 'Presiona Play y sigue las notas cuando pasen por la línea roja'
          : ' — Ajusta la velocidad para practicar'}
      </p>
    </div>
  );
};

export default MusicPrompter;
