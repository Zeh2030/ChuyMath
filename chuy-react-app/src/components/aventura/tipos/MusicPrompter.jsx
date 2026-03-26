import React, { useState, useEffect, useRef, useCallback } from 'react';
import abcjs from 'abcjs';
import './MusicPrompter.css';

/**
 * Calculate adaptive staffwidth based on shortest note in the ABC.
 */
const calcStaffWidth = (abc, multiVoice) => {
  const MIN_WIDTH = multiVoice ? 10000 : 6000;
  const MIN_PX_PER_NOTE = 50;
  const TARGET_PX_PER_BEAT = 200;

  const noteLines = abc.split('\n').filter(l =>
    l.trim() && !l.match(/^[A-Z]:/) && !l.startsWith('%%')
  ).join(' ');

  let shortestBeats = 1;
  let totalBeats = 0;
  const noteRegex = /([A-Ga-gz][',]*)((\d+)?(\/(\d+))?)/g;
  let m;
  while ((m = noteRegex.exec(noteLines)) !== null) {
    const num = m[3] ? parseInt(m[3]) : 1;
    const den = m[5] ? parseInt(m[5]) : 1;
    const beats = num / den;
    totalBeats += beats;
    if (beats > 0 && beats < shortestBeats) shortestBeats = beats;
  }

  if (multiVoice) totalBeats = totalBeats / 2;
  totalBeats = Math.max(totalBeats, 4);

  const minPxPerBeat = MIN_PX_PER_NOTE / shortestBeats;
  const pxPerBeat = Math.max(TARGET_PX_PER_BEAT, minPxPerBeat);

  return Math.max(MIN_WIDTH, Math.round(totalBeats * pxPerBeat));
};

/**
 * Strip internal barlines from ABC for uniform note spacing.
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

/**
 * Calculate duration in seconds from ABC content and BPM.
 * Used for repositioning before synth is available (no audio context needed).
 */
const calcDurationFromAbc = (abc, qpm, multiVoice) => {
  const noteLines = abc.split('\n').filter(l =>
    l.trim() && !l.match(/^[A-Z]:/) && !l.startsWith('%%')
  ).join(' ');

  let totalBeats = 0;
  const noteRegex = /([A-Ga-gz][',]*)((\d+)?(\/(\d+))?)/g;
  let m;
  while ((m = noteRegex.exec(noteLines)) !== null) {
    const num = m[3] ? parseInt(m[3]) : 1;
    const den = m[5] ? parseInt(m[5]) : 1;
    totalBeats += num / den;
  }
  if (multiVoice) totalBeats = totalBeats / 2;
  totalBeats = Math.max(totalBeats, 1);
  return (totalBeats / qpm) * 60;
};

const MusicPrompter = ({ abcNotation, bpm, titulo, autor, onTerminar, multiVoice = false }) => {
  const [estado, setEstado] = useState('parado');
  const [bpmActual, setBpmActual] = useState(bpm || 80);
  const [sonidoOn, setSonidoOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [barlinePositions, setBarlinePositions] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [synthReady, setSynthReady] = useState(false);

  const containerRef = useRef(null);
  const abcTargetRef = useRef(null);
  const barlinesRef = useRef(null);
  const translateXRef = useRef(0);
  const rafIdRef = useRef(null);
  const lastTimestampRef = useRef(null);
  const viewportWidthRef = useRef(600);
  const pixelsPerSecondRef = useRef(0);
  const playheadOffsetRef = useRef(150);
  const firstNoteOffsetRef = useRef(0);
  const musicWidthRef = useRef(0);

  const synthRef = useRef(null);
  const visualObjRef = useRef(null);
  const audioContextRef = useRef(null);
  const timingRef = useRef(null);
  const estadoRef = useRef('parado');

  useEffect(() => { estadoRef.current = estado; }, [estado]);

  // ─── Render ABC → SVG, reposition immediately (no audio needed) ───
  useEffect(() => {
    if (!abcTargetRef.current || !abcNotation) return;

    setSynthReady(false);
    abcTargetRef.current.innerHTML = '';

    const strippedAbc = stripBarlines(abcNotation);
    const adaptiveWidth = calcStaffWidth(abcNotation, multiVoice);

    // Render with scale=2 for larger, more readable notes
    const visualObj = abcjs.renderAbc(abcTargetRef.current, strippedAbc, {
      staffwidth: adaptiveWidth,
      scale: 2,
      wrap: null,
      add_classes: true,
      paddingtop: 0,
      paddingbottom: 0,
      paddingleft: 20,
    });

    visualObjRef.current = visualObj[0];

    requestAnimationFrame(() => {
      measureSvg();

      // Reposition using calculated duration (no audio required).
      // This is synchronous and accurate for BPM-based timing.
      if (visualObjRef.current) {
        try {
          const timing = new abcjs.TimingCallbacks(visualObjRef.current, {
            qpm: bpmActual,
            eventCallback: () => {},
          });
          if (timing.noteTimings && timing.noteTimings.length > 0) {
            // Calculate duration from BPM + total beats (same as calibrateScrollFallback)
            const calcDuration = calcDurationFromAbc(abcNotation, bpmActual, multiVoice);
            repositionNotes(timing, calcDuration);
            pixelsPerSecondRef.current = musicWidthRef.current > 0 && calcDuration > 0
              ? musicWidthRef.current / calcDuration : 0;
            calculateBarlines(bpmActual, calcDuration);
          }
          timing.stop();
        } catch(e) {}
      }

      measureViewport();
      translateXRef.current = 0;
      applyTransform();
    });

    return () => { cleanup(); };
  }, [abcNotation]);

  // ─── Measure SVG dimensions ───
  const measureSvg = () => {
    const svg = abcTargetRef.current?.querySelector('svg');
    if (!svg) return;
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
  };

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

  // ─── Barline overlay positions ───
  const calculateBarlines = (qpm, duration) => {
    const mMatch = abcNotation.match(/M:(\d+)\/(\d+)/);
    const beatsPerMeasure = mMatch ? parseInt(mMatch[1]) : 4;
    const secondsPerMeasure = (beatsPerMeasure / qpm) * 60;
    const scrollWidth = musicWidthRef.current;
    const positions = [];
    for (let i = 1; i * secondsPerMeasure < duration; i++) {
      positions.push((i * secondsPerMeasure / duration) * scrollWidth);
    }
    setBarlinePositions(positions);
  };

  // ─── Reposition notes to time-proportional positions ───
  const repositionNotes = (timing, totalDurationSec) => {
    const svg = abcTargetRef.current?.querySelector('svg');
    if (!svg || !timing.noteTimings || timing.noteTimings.length === 0) return;

    const svgRect = svg.getBoundingClientRect();
    const musicWidth = musicWidthRef.current;
    const firstNoteX = firstNoteOffsetRef.current;
    const totalMs = totalDurationSec * 1000;

    timing.noteTimings.forEach(event => {
      if (!event.elements || event.milliseconds === undefined) return;

      const desiredRelX = (event.milliseconds / totalMs) * musicWidth;

      event.elements.forEach(voiceElements => {
        if (!Array.isArray(voiceElements)) return;
        voiceElements.forEach(el => {
          if (!el) return;
          const elRect = el.getBoundingClientRect();
          const currentRelX = (elRect.left - svgRect.left) - firstNoteX;
          const deltaX = desiredRelX - currentRelX;
          if (Math.abs(deltaX) > 0.5) {
            const existing = el.getAttribute('transform') || '';
            el.setAttribute('transform', `${existing} translate(${deltaX}, 0)`);
          }
        });
      });
    });
  };

  // ─── Prepare synth (called on first Play, requires user gesture for AudioContext) ───
  const prepareSynth = async (qpm) => {
    if (synthReady && synthRef.current) return; // already prepared

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

      // Recalibrate scroll speed with synth's precise duration
      const realDuration = synth.duration;
      if (musicWidthRef.current > 0 && realDuration > 0) {
        pixelsPerSecondRef.current = musicWidthRef.current / realDuration;
      }

      // TimingCallbacks for end-of-song detection
      if (timingRef.current) { try { timingRef.current.stop(); } catch(e) {} }
      const timing = new abcjs.TimingCallbacks(visualObjRef.current, {
        qpm: qpm,
        eventCallback: onNoteEvent,
      });
      timingRef.current = timing;

      setSynthReady(true);
    } catch (err) {
      console.warn('Error preparando audio:', err);
    }
    setCargando(false);
  };

  // ─── End of song detection ───
  const onNoteEvent = (event) => {
    if (!event) {
      if (estadoRef.current === 'tocando') {
        setEstado('parado');
        if (onTerminar) onTerminar();
      }
    }
  };

  // ─── Transform (sheet + barlines move together) ───
  const applyTransform = useCallback(() => {
    const offset = playheadOffsetRef.current - firstNoteOffsetRef.current - translateXRef.current;
    if (abcTargetRef.current) {
      abcTargetRef.current.style.transform = `translateX(${offset}px)`;
    }
    if (barlinesRef.current) {
      barlinesRef.current.style.transform = `translateX(${offset}px)`;
    }
  }, []);

  // ─── Animation loop: constant speed scroll (visual metronome) ───
  const animate = useCallback((timestamp) => {
    if (!lastTimestampRef.current) lastTimestampRef.current = timestamp;

    const deltaMs = timestamp - lastTimestampRef.current;
    lastTimestampRef.current = timestamp;

    translateXRef.current += pixelsPerSecondRef.current * (deltaMs / 1000);

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

  // ─── BPM change: re-render needed since repositioning depends on BPM ───
  useEffect(() => {
    if (!visualObjRef.current || !abcTargetRef.current) return;

    cleanup();
    setSynthReady(false);
    synthRef.current = null;
    translateXRef.current = 0;
    lastTimestampRef.current = null;
    setEstado('parado');

    // Re-render and reposition with new BPM
    abcTargetRef.current.innerHTML = '';
    const strippedAbc = stripBarlines(abcNotation);
    const adaptiveWidth = calcStaffWidth(abcNotation, multiVoice);
    const visualObj = abcjs.renderAbc(abcTargetRef.current, strippedAbc, {
      staffwidth: adaptiveWidth, scale: 2, wrap: null, add_classes: true,
      paddingtop: 0, paddingbottom: 0, paddingleft: 20,
    });
    visualObjRef.current = visualObj[0];

    requestAnimationFrame(() => {
      measureSvg();
      if (visualObjRef.current) {
        try {
          const timing = new abcjs.TimingCallbacks(visualObjRef.current, { qpm: bpmActual, eventCallback: () => {} });
          if (timing.noteTimings && timing.noteTimings.length > 0) {
            const calcDuration = calcDurationFromAbc(abcNotation, bpmActual, multiVoice);
            repositionNotes(timing, calcDuration);
            pixelsPerSecondRef.current = musicWidthRef.current > 0 && calcDuration > 0
              ? musicWidthRef.current / calcDuration : 0;
            calculateBarlines(bpmActual, calcDuration);
          }
          timing.stop();
        } catch(e) {}
      }
      measureViewport();
      applyTransform();
    });
  }, [bpmActual]);

  // ─── Fullscreen events ───
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
    // Auto-fullscreen on first play
    if (estado !== 'pausado') {
      if (!document.fullscreenElement) {
        try {
          await containerRef.current?.parentElement?.requestFullscreen();
          await new Promise(r => setTimeout(r, 250));
          measureViewport();
          applyTransform();
        } catch (err) {}
      }

      // Prepare synth on first play (requires user gesture for AudioContext)
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
    lastTimestampRef.current = null;
    applyTransform();
    setEstado('parado');
    setSynthReady(false);
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
            <span>Preparando partitura...</span>
          </div>
        )}
        <div className="mp-playhead"></div>
        <div className="mp-sheet" ref={abcTargetRef} style={{ opacity: cargando ? 0 : 1 }}></div>
        <div className="mp-barlines" ref={barlinesRef} style={{ opacity: cargando ? 0 : 1 }}>
          {barlinePositions.map((x, i) => (
            <div
              key={i}
              className="mp-barline-mark"
              style={{ left: `${firstNoteOffsetRef.current + x}px` }}
            />
          ))}
        </div>
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

        <button className="mp-btn mp-btn-reset" onClick={handleReset} disabled={cargando || (estado === 'parado' && translateXRef.current === 0)}>
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
