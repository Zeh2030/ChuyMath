import React, { useState, useEffect, useRef, useCallback } from 'react';
import abcjs from 'abcjs';
import './MusicPrompter.css';

/**
 * Strip internal barlines from ABC for more uniform note spacing.
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
  const [barlinePositions, setBarlinePositions] = useState([]);
  const [cargando, setCargando] = useState(false);

  const containerRef = useRef(null);
  const abcTargetRef = useRef(null);
  const barlinesRef = useRef(null);
  const rafIdRef = useRef(null);
  const lastTimestampRef = useRef(null);
  const elapsedRef = useRef(0); // elapsed time in seconds since play started
  const viewportWidthRef = useRef(600);
  const playheadOffsetRef = useRef(150);
  const firstNoteOffsetRef = useRef(0);
  const musicWidthRef = useRef(0);

  // Scroll map: [{time: seconds, x: pixels}, ...] built from TimingCallbacks
  const scrollMapRef = useRef([]);

  const synthRef = useRef(null);
  const visualObjRef = useRef(null);
  const audioContextRef = useRef(null);
  const timingRef = useRef(null);
  const estadoRef = useRef('parado');

  useEffect(() => { estadoRef.current = estado; }, [estado]);

  // ─── Render ABC → SVG + build scroll map (no audio needed) ───
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
      // Measure SVG
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

      // Build scroll map from TimingCallbacks
      buildScrollMap(bpmActual);

      measureViewport();
      elapsedRef.current = 0;
      applyScrollPosition(0);
    });

    return () => { cleanup(); };
  }, [abcNotation]);

  // ─── Build time→position scroll map from abcjs TimingCallbacks ───
  const buildScrollMap = (qpm) => {
    if (!visualObjRef.current) return;

    const svg = abcTargetRef.current?.querySelector('svg');
    if (!svg) return;
    const svgRect = svg.getBoundingClientRect();
    const firstNoteX = firstNoteOffsetRef.current;

    try {
      const timing = new abcjs.TimingCallbacks(visualObjRef.current, {
        qpm: qpm,
        eventCallback: () => {},
      });

      if (!timing.noteTimings || timing.noteTimings.length === 0) {
        timing.stop();
        return;
      }

      const map = [];
      timing.noteTimings.forEach(event => {
        if (!event.elements || event.milliseconds === undefined) return;

        // Get the x position of the first element (voice 1)
        let noteX = null;
        for (const voiceEls of event.elements) {
          if (Array.isArray(voiceEls) && voiceEls.length > 0 && voiceEls[0]) {
            const rect = voiceEls[0].getBoundingClientRect();
            noteX = (rect.left + rect.width / 2) - svgRect.left - firstNoteX;
            break;
          }
        }

        if (noteX !== null) {
          map.push({ time: event.milliseconds / 1000, x: noteX });
        }
      });

      // Add end point: last note position + estimated last note duration
      if (map.length >= 2) {
        const last = map[map.length - 1];
        const secondLast = map[map.length - 2];
        const lastDuration = last.time - secondLast.time;
        map.push({ time: last.time + Math.max(lastDuration, 0.5), x: musicWidthRef.current });
      }

      scrollMapRef.current = map;
      timing.stop();

      // Calculate barline positions using the map's total duration
      if (map.length > 0) {
        const totalDuration = map[map.length - 1].time;
        const mMatch = abcNotation.match(/M:(\d+)\/(\d+)/);
        const beatsPerMeasure = mMatch ? parseInt(mMatch[1]) : 4;
        const secondsPerMeasure = (beatsPerMeasure / qpm) * 60;
        const positions = [];
        for (let i = 1; i * secondsPerMeasure < totalDuration; i++) {
          // Interpolate barline x position from scroll map
          const barTime = i * secondsPerMeasure;
          const barX = interpolateX(barTime, map);
          positions.push(barX);
        }
        setBarlinePositions(positions);
      }
    } catch (e) {
      console.warn('Error building scroll map:', e);
    }
  };

  // ─── Interpolate x position for a given time using scroll map ───
  const interpolateX = (time, map) => {
    if (!map || map.length === 0) return 0;
    if (time <= map[0].time) return map[0].x;
    if (time >= map[map.length - 1].time) return map[map.length - 1].x;

    // Binary search for bracketing entries
    let lo = 0, hi = map.length - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (map[mid].time <= time) lo = mid;
      else hi = mid;
    }

    const a = map[lo];
    const b = map[hi];
    const t = (time - a.time) / (b.time - a.time);
    return a.x + t * (b.x - a.x);
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

  // ─── Apply scroll position (used by both initial render and animation) ───
  const applyScrollPosition = useCallback((scrollX) => {
    const offset = playheadOffsetRef.current - firstNoteOffsetRef.current - scrollX;
    if (abcTargetRef.current) {
      abcTargetRef.current.style.transform = `translateX(${offset}px)`;
    }
    if (barlinesRef.current) {
      barlinesRef.current.style.transform = `translateX(${offset}px)`;
    }
  }, []);

  // ─── Prepare synth (called on first Play — requires user gesture) ───
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

      // TimingCallbacks for end-of-song detection
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

  // ─── End of song detection ───
  const onNoteEvent = (event) => {
    if (!event) {
      if (estadoRef.current === 'tocando') {
        setEstado('parado');
        if (onTerminar) onTerminar();
      }
    }
  };

  // ─── Animation loop: interpolated scroll (smooth, perfectly synced) ───
  const animate = useCallback((timestamp) => {
    if (!lastTimestampRef.current) lastTimestampRef.current = timestamp;

    const deltaMs = timestamp - lastTimestampRef.current;
    lastTimestampRef.current = timestamp;

    elapsedRef.current += deltaMs / 1000;

    const map = scrollMapRef.current;
    if (!map || map.length === 0) return;

    const totalDuration = map[map.length - 1].time;
    if (elapsedRef.current >= totalDuration) {
      applyScrollPosition(musicWidthRef.current);
      return; // song ended — onNoteEvent handles state change
    }

    // Interpolate scroll position from time→position map
    const scrollX = interpolateX(elapsedRef.current, map);
    applyScrollPosition(scrollX);

    rafIdRef.current = requestAnimationFrame(animate);
  }, [applyScrollPosition]);

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
    elapsedRef.current = 0;
    lastTimestampRef.current = null;
    setEstado('parado');

    // Re-render with new BPM
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
      buildScrollMap(bpmActual);
      measureViewport();
      applyScrollPosition(0);
    });
  }, [bpmActual]);

  // ─── Fullscreen events ───
  useEffect(() => {
    const onFsChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      setTimeout(() => { measureViewport(); if (elapsedRef.current === 0) applyScrollPosition(0); }, 300);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
    };
  }, [measureViewport, applyScrollPosition]);

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
          applyScrollPosition(0);
        } catch (err) {}
      }

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
    elapsedRef.current = 0;
    lastTimestampRef.current = null;
    applyScrollPosition(0);
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
        <div className="mp-barlines" ref={barlinesRef}>
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
