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
  const targetXRef = useRef(0);
  const rafIdRef = useRef(null);
  const viewportWidthRef = useRef(600);
  const playheadOffsetRef = useRef(150);
  const svgLeftRef = useRef(0);

  // Audio refs
  const synthRef = useRef(null);
  const visualObjRef = useRef(null);
  const audioContextRef = useRef(null);
  const timingRef = useRef(null);
  const estadoRef = useRef('parado');

  // Keep ref in sync with state (for callbacks)
  useEffect(() => { estadoRef.current = estado; }, [estado]);

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
        svgLeftRef.current = svg.getBoundingClientRect().left;
      }
      measureViewport();
      translateXRef.current = 0;
      targetXRef.current = 0;
      applyTransform(0);

      prepareAll(bpmActual);
    });

    return () => {
      cleanup();
    };
  }, [abcNotation]);

  // --- Cleanup ---
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

  // --- Medir viewport ---
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

      // AudioContext
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

      // TimingCallbacks: fires per-note events with SVG element positions
      const timing = new abcjs.TimingCallbacks(visualObjRef.current, {
        qpm: qpm,
        eventCallback: onNoteEvent,
        lineEndCallback: null,
      });
      timingRef.current = timing;

    } catch (err) {
      console.warn('Error preparando audio/timing:', err);
    }
  };

  // --- Callback por cada nota: mover scroll a la posición del elemento SVG ---
  const onNoteEvent = (event) => {
    if (!event) {
      // null event = fin de la canción
      if (estadoRef.current === 'tocando') {
        setEstado('parado');
        if (onTerminar) onTerminar();
      }
      return;
    }

    // Obtener el elemento SVG de la nota actual
    if (event.elements && event.elements.length > 0 && event.elements[0].length > 0) {
      const noteEl = event.elements[0][0];
      if (noteEl) {
        const noteRect = noteEl.getBoundingClientRect();
        const svgRect = abcTargetRef.current?.querySelector('svg')?.getBoundingClientRect();
        if (svgRect) {
          // noteRect y svgRect ambos incluyen el transform, así que la diferencia
          // da la posición original de la nota dentro del SVG
          targetXRef.current = noteRect.left - svgRect.left;
        }
      }
    }
  };

  // --- Aplicar transform CSS ---
  const applyTransform = useCallback((x) => {
    if (abcTargetRef.current) {
      const offset = playheadOffsetRef.current - x;
      abcTargetRef.current.style.transform = `translateX(${offset}px)`;
      translateXRef.current = x;
    }
  }, []);

  // --- Loop de animación suave (interpola hacia targetX) ---
  const smoothScroll = useCallback(() => {
    const current = translateXRef.current;
    const target = targetXRef.current;
    const diff = target - current;

    // Interpolar suavemente (lerp con factor alto para respuesta rápida)
    const speed = 0.15;
    const newX = Math.abs(diff) < 0.5 ? target : current + diff * speed;

    applyTransform(newX);
    rafIdRef.current = requestAnimationFrame(smoothScroll);
  }, [applyTransform]);

  // --- Control de animación por estado ---
  useEffect(() => {
    if (estado === 'tocando') {
      rafIdRef.current = requestAnimationFrame(smoothScroll);
    }

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [estado, smoothScroll]);

  // --- Cambio de BPM: parar, re-preparar, reset ---
  useEffect(() => {
    if (!visualObjRef.current) return;

    cleanup();
    translateXRef.current = 0;
    targetXRef.current = 0;
    applyTransform(0);
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
        if (translateXRef.current === 0) {
          applyTransform(0);
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

    if (estado === 'pausado') {
      // Reanudar
      if (sonidoOn && synthRef.current) {
        try { synthRef.current.resume(); } catch(e) {}
      }
      if (timingRef.current) {
        try { timingRef.current.resume(); } catch(e) {}
      }
    } else {
      // Nuevo play desde el inicio
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
    targetXRef.current = 0;
    applyTransform(0);
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
