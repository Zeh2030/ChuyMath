import React, { useState, useEffect, useRef, useCallback } from 'react';
import abcjs from 'abcjs';
import './MusicPrompter.css';

/**
 * Strip internal barlines from ABC for more uniform note spacing.
 * Preserves |] (final), |: and :| (repeats).
 */
const stripBarlines = (abc) => {
  return abc.split('\n').map(line => {
    if (line.match(/^[A-Z]:/) || line.startsWith('%%') || line.trim() === '') return line;
    return line
      .replace(/\|\]/g, '\x00E\x00')
      .replace(/\|:/g, '\x00S\x00')
      .replace(/:\|/g, '\x00R\x00')
      .replace(/\|/g, ' ')
      .replace(/\x00E\x00/g, '|]')
      .replace(/\x00S\x00/g, '|:')
      .replace(/\x00R\x00/g, ':|');
  }).join('\n');
};

const MusicPrompter = ({ abcNotation, bpm, titulo, autor, onTerminar, multiVoice = false }) => {
  const [estado, setEstado] = useState('parado');
  const [bpmActual, setBpmActual] = useState(bpm || 80);
  const [sonidoOn, setSonidoOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cargando, setCargando] = useState(false);

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
  const correctionRef = useRef(0);

  const synthRef = useRef(null);
  const visualObjRef = useRef(null);
  const audioContextRef = useRef(null);
  const timingRef = useRef(null);
  const estadoRef = useRef('parado');

  useEffect(() => { estadoRef.current = estado; }, [estado]);

  // ─── Render ABC → SVG ───
  useEffect(() => {
    if (!abcTargetRef.current || !abcNotation) return;

    abcTargetRef.current.innerHTML = '';
    const strippedAbc = stripBarlines(abcNotation);

    const visualObj = abcjs.renderAbc(abcTargetRef.current, strippedAbc, {
      staffwidth: multiVoice ? 10000 : 6000,
      scale: 2,
      wrap: null,
      add_classes: true,
      paddingtop: 0,
      paddingbottom: 0,
      paddingleft: 20,
    });

    visualObjRef.current = visualObj[0];

    requestAnimationFrame(() => {
      const svg = abcTargetRef.current?.querySelector('svg');
      if (svg) {
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
      }
      measureViewport();
      translateXRef.current = 0;
      correctionRef.current = 0;
      applyTransform();
    });

    return () => { cleanup(); };
  }, [abcNotation]);

  const cleanup = () => {
    if (rafIdRef.current) { cancelAnimationFrame(rafIdRef.current); rafIdRef.current = null; }
    if (timingRef.current) { try { timingRef.current.stop(); } catch(e) {} timingRef.current = null; }
    if (synthRef.current) { try { synthRef.current.stop(); } catch(e) {} }
  };

  const measureViewport = useCallback(() => {
    if (containerRef.current) {
      viewportWidthRef.current = containerRef.current.clientWidth;
      playheadOffsetRef.current = viewportWidthRef.current * 0.25;
    }
  }, []);

  // ─── Per-note correction callback ───
  // Only uses V:1 (voice 1) to avoid double-correction in multi-voice.
  // Sets correction (not accumulates) to prevent overcorrection.
  const onNoteEvent = (event) => {
    if (!event) {
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
          const noteRealX = noteRect.left - svgRect.left;
          const scrollX = translateXRef.current + firstNoteOffsetRef.current;
          const error = noteRealX - scrollX;
          correctionRef.current = error;
        }
      }
    }
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
        },
      });
      await synth.prime();
      synthRef.current = synth;

      // Calibrate scroll speed with synth's precise duration
      const realDuration = synth.duration;
      if (musicWidthRef.current > 0 && realDuration > 0) {
        pixelsPerSecondRef.current = musicWidthRef.current / realDuration;
      }

      // TimingCallbacks for per-note correction + end detection
      if (timingRef.current) { try { timingRef.current.stop(); } catch(e) {} }
      const timing = new abcjs.TimingCallbacks(visualObjRef.current, {
        qpm: qpm,
        eventCallback: onNoteEvent,
      });
      timingRef.current = timing;
    } catch (err) {
      console.warn('Error preparando audio:', err);
    }
    setCargando(false);
  };

  // ─── Apply CSS transform ───
  const applyTransform = useCallback(() => {
    const offset = playheadOffsetRef.current - firstNoteOffsetRef.current - translateXRef.current;
    if (abcTargetRef.current) {
      abcTargetRef.current.style.transform = `translateX(${offset}px)`;
    }
  }, []);

  // ─── Animation: constant speed + smooth per-note correction ───
  const animate = useCallback((timestamp) => {
    if (!lastTimestampRef.current) lastTimestampRef.current = timestamp;

    const deltaMs = timestamp - lastTimestampRef.current;
    lastTimestampRef.current = timestamp;

    // Base advance: constant speed (visual metronome)
    let advance = pixelsPerSecondRef.current * (deltaMs / 1000);

    // Absorb per-note correction gradually (5% per frame, capped at 30% of normal advance)
    if (Math.abs(correctionRef.current) > 0.5) {
      const maxCorrection = Math.max(advance * 0.3, 0.5);
      const raw = correctionRef.current * 0.05;
      const correction = Math.max(-maxCorrection, Math.min(maxCorrection, raw));
      advance += correction;
      correctionRef.current -= correction;
    } else {
      correctionRef.current = 0;
    }

    translateXRef.current += advance;

    if (translateXRef.current >= musicWidthRef.current) {
      translateXRef.current = musicWidthRef.current;
      applyTransform();
      return;
    }

    applyTransform();
    rafIdRef.current = requestAnimationFrame(animate);
  }, [applyTransform]);

  // ─── Animation state control ───
  useEffect(() => {
    if (estado === 'tocando') {
      lastTimestampRef.current = null;
      rafIdRef.current = requestAnimationFrame(animate);
    }
    return () => { if (rafIdRef.current) { cancelAnimationFrame(rafIdRef.current); rafIdRef.current = null; } };
  }, [estado, animate]);

  // ─── BPM change ───
  useEffect(() => {
    if (!visualObjRef.current || !abcTargetRef.current) return;

    cleanup();
    synthRef.current = null;
    translateXRef.current = 0;
    correctionRef.current = 0;
    lastTimestampRef.current = null;
    setEstado('parado');

    // Re-render
    abcTargetRef.current.innerHTML = '';
    const strippedAbc = stripBarlines(abcNotation);
    const visualObj = abcjs.renderAbc(abcTargetRef.current, strippedAbc, {
      staffwidth: multiVoice ? 10000 : 6000, scale: 2, wrap: null, add_classes: true,
      paddingtop: 0, paddingbottom: 0, paddingleft: 20,
    });
    visualObjRef.current = visualObj[0];

    requestAnimationFrame(() => {
      const svg = abcTargetRef.current?.querySelector('svg');
      if (svg) {
        const svgRect = svg.getBoundingClientRect();
        const allNotes = svg.querySelectorAll('.abcjs-note, .abcjs-rest');
        if (allNotes.length > 0) {
          const firstRect = allNotes[0].getBoundingClientRect();
          const lastRect = allNotes[allNotes.length - 1].getBoundingClientRect();
          firstNoteOffsetRef.current = firstRect.left - svgRect.left;
          musicWidthRef.current = (lastRect.right - firstRect.left) + 100;
        }
      }
      measureViewport();
      applyTransform();
    });
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
    } catch (err) {}
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
        } catch (err) {}
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
      if (sonidoOn && synthRef.current) { try { synthRef.current.resume(); } catch(e) {} }
      if (timingRef.current) { try { timingRef.current.resume(); } catch(e) {} }
    } else {
      if (sonidoOn && synthRef.current) { try { synthRef.current.start(); } catch(e) {} }
      if (timingRef.current) { try { timingRef.current.start(); } catch(e) {} }
    }

    setEstado('tocando');
  };

  const handlePause = () => {
    if (synthRef.current) { try { synthRef.current.pause(); } catch(e) {} }
    if (timingRef.current) { try { timingRef.current.pause(); } catch(e) {} }
    setEstado('pausado');
  };

  const handleReset = () => {
    cleanup();
    translateXRef.current = 0;
    correctionRef.current = 0;
    lastTimestampRef.current = null;
    applyTransform();
    setEstado('parado');
    synthRef.current = null;
  };

  const handleBpmUp = () => setBpmActual(prev => Math.min(200, prev + 5));
  const handleBpmDown = () => setBpmActual(prev => Math.max(20, prev - 5));

  const toggleSonido = () => {
    if (sonidoOn && synthRef.current && estado === 'tocando') { try { synthRef.current.stop(); } catch(e) {} }
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
          className={`mp-btn ${sonidoOn ? 'mp-btn-sound-on' : 'mp-btn-sound-off'}`}
          onClick={toggleSonido}
          title={sonidoOn ? 'Silenciar' : 'Activar sonido'}
        >
          {sonidoOn ? '🔊' : '🔇'}
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
