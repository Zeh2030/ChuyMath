import React, { useState, useEffect, useRef, useCallback } from 'react';
import abcjs from 'abcjs';
import './MusicPrompter.css';

const MusicPrompter = ({ abcNotation, bpm, titulo, autor, onTerminar }) => {
  const [estado, setEstado] = useState('parado');
  const [bpmActual, setBpmActual] = useState(bpm || 80);
  const [sonidoOn, setSonidoOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef(null);
  const abcTargetRef = useRef(null);
  const translateXRef = useRef(0);
  const rafIdRef = useRef(null);
  const lastTimestampRef = useRef(null);
  const totalWidthRef = useRef(0);
  const viewportWidthRef = useRef(600);
  const pixelsPerSecondRef = useRef(0);
  const playheadOffsetRef = useRef(150);
  const audioDurationRef = useRef(0);

  // Audio refs
  const synthRef = useRef(null);
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
      measureViewport();
      translateXRef.current = 0;
      applyTransform();

      // Init synth con BPM actual
      prepareSynth(bpmActual);
    });

    return () => {
      if (synthRef.current) {
        try { synthRef.current.stop(); } catch(e) {}
      }
    };
  }, [abcNotation]);

  // --- Medir viewport ---
  const measureViewport = useCallback(() => {
    if (containerRef.current) {
      viewportWidthRef.current = containerRef.current.clientWidth;
      playheadOffsetRef.current = viewportWidthRef.current * 0.25;
    }
  }, []);

  // --- Preparar synth y calibrar scroll con duración real ---
  const prepareSynth = async (qpm) => {
    try {
      if (!visualObjRef.current) return;

      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioContext();
      }

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

      // Obtener duración real del audio (fuente de verdad)
      const realDuration = synth.duration;
      audioDurationRef.current = realDuration;

      // Calibrar scroll con duración real del audio
      const scrollableWidth = totalWidthRef.current;
      pixelsPerSecondRef.current = scrollableWidth > 0 && realDuration > 0
        ? scrollableWidth / realDuration
        : 0;

      synthRef.current = synth;
    } catch (err) {
      console.warn('Audio synth no disponible:', err);
      // Fallback: calcular sin audio
      calibrateScrollFallback(qpm);
    }
  };

  // Fallback si synth no funciona
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
    audioDurationRef.current = duration;
    pixelsPerSecondRef.current = totalWidthRef.current > 0
      ? totalWidthRef.current / duration : 0;
  };

  // --- Cambio de BPM: parar, re-preparar, reset ---
  useEffect(() => {
    // Skip en mount inicial (ya se hace en el useEffect de abcNotation)
    if (!visualObjRef.current) return;

    // Parar todo
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (synthRef.current) {
      try { synthRef.current.stop(); } catch(e) {}
    }

    // Reset posición
    translateXRef.current = 0;
    lastTimestampRef.current = null;
    applyTransform();
    setEstado('parado');

    // Re-preparar synth con nuevo BPM
    prepareSynth(bpmActual);
  }, [bpmActual]);

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

  // --- Fullscreen ---
  useEffect(() => {
    const onFsChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      // Recalcular viewport después de transición fullscreen
      setTimeout(() => {
        measureViewport();
        // Recalibrar si está parado
        if (translateXRef.current === 0) {
          applyTransform();
        }
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

    if (sonidoOn && synthRef.current) {
      try {
        if (estado === 'pausado') {
          synthRef.current.resume();
        } else {
          synthRef.current.start();
        }
      } catch (err) {
        console.warn('Error al reproducir audio:', err);
      }
    }

    setEstado('tocando');
  };

  const handlePause = () => {
    if (synthRef.current) {
      try { synthRef.current.pause(); } catch(e) {}
    }
    setEstado('pausado');
  };

  const handleReset = () => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (synthRef.current) {
      try { synthRef.current.stop(); } catch(e) {}
    }
    translateXRef.current = 0;
    lastTimestampRef.current = null;
    applyTransform();
    setEstado('parado');

    // Re-preparar synth para siguiente play
    prepareSynth(bpmActual);
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
