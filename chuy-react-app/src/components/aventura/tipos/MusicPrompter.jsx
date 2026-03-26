import React, { useState, useEffect, useRef, useCallback } from 'react';
import abcjs from 'abcjs';
import './MusicPrompter.css';

/**
 * Strip internal barlines from ABC notation for uniform note spacing.
 * Without barlines, abcjs spaces notes purely by duration → constant-speed
 * scroll works perfectly as a visual metronome.
 * Preserves final barlines (|]), repeat signs (|: :|), and header/directive lines.
 */
const stripBarlines = (abc) => {
  return abc.split('\n').map(line => {
    // Keep header lines (X:, T:, M:, K:, V:, etc.) and directives (%%)
    if (line.match(/^[A-Z]:/) || line.startsWith('%%') || line.trim() === '') return line;
    // Protect special barlines, strip regular ones, restore protected
    return line
      .replace(/\|\]/g, '\x00END\x00')
      .replace(/\|:/g, '\x00RS\x00')
      .replace(/:\|/g, '\x00RE\x00')
      .replace(/\|/g, ' ')
      .replace(/\x00END\x00/g, '|]')
      .replace(/\x00RS\x00/g, '|:')
      .replace(/\x00RE\x00/g, ':|');
  }).join('\n');
};

const MusicPrompter = ({ abcNotation, bpm, titulo, autor, onTerminar, multiVoice = false }) => {
  const [estado, setEstado] = useState('parado');
  const [bpmActual, setBpmActual] = useState(bpm || 80);
  const [sonidoOn, setSonidoOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [barlinePositions, setBarlinePositions] = useState([]);

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

  // Audio refs
  const synthRef = useRef(null);
  const visualObjRef = useRef(null);
  const audioContextRef = useRef(null);
  const timingRef = useRef(null);
  const estadoRef = useRef('parado');

  useEffect(() => { estadoRef.current = estado; }, [estado]);

  // --- Renderizar ABC → SVG (barlines stripped for uniform spacing) ---
  useEffect(() => {
    if (!abcTargetRef.current || !abcNotation) return;

    abcTargetRef.current.innerHTML = '';

    const strippedAbc = stripBarlines(abcNotation);

    // Larger staffwidth ensures short notes remain readable after
    // time-proportional repositioning (sixteenths need more room)
    const visualObj = abcjs.renderAbc(abcTargetRef.current, strippedAbc, {
      staffwidth: multiVoice ? 12000 : 6000,
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

        const allNotes = svg.querySelectorAll('.abcjs-note, .abcjs-rest');
        if (allNotes.length > 0) {
          const firstRect = allNotes[0].getBoundingClientRect();
          const lastRect = allNotes[allNotes.length - 1].getBoundingClientRect();
          firstNoteOffsetRef.current = firstRect.left - svgRect.left;
          musicWidthRef.current = (lastRect.right - firstRect.left) + 50;
        } else {
          firstNoteOffsetRef.current = 0;
          musicWidthRef.current = svgRect.width;
        }
      }
      measureViewport();
      translateXRef.current = 0;
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

  // --- Calculate barline overlay positions (visual only, no spacing impact) ---
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

  // --- Reposition notes to be time-proportional ---
  // abcjs spaces notes by musical convention (longer notes = more space),
  // but not linearly proportional to time. This function moves each note
  // to its exact time-proportional position so constant-speed scroll syncs perfectly.
  const repositionNotes = (timing, totalDurationSec) => {
    const svg = abcTargetRef.current?.querySelector('svg');
    if (!svg || !timing.noteTimings || timing.noteTimings.length === 0) return;

    const svgRect = svg.getBoundingClientRect();
    const musicWidth = musicWidthRef.current;
    const firstNoteX = firstNoteOffsetRef.current;
    const totalMs = totalDurationSec * 1000;
    const MIN_SPACING = 20; // Minimum px between consecutive notes

    // First pass: calculate desired positions and enforce minimum spacing
    const noteData = [];
    timing.noteTimings.forEach(event => {
      if (!event.elements || event.milliseconds === undefined) return;
      let desiredRelX = (event.milliseconds / totalMs) * musicWidth;

      // Enforce minimum spacing from previous note
      if (noteData.length > 0) {
        const prevX = noteData[noteData.length - 1].desiredRelX;
        if (desiredRelX - prevX < MIN_SPACING) {
          desiredRelX = prevX + MIN_SPACING;
        }
      }

      noteData.push({ event, desiredRelX });
    });

    // Second pass: apply transforms
    noteData.forEach(({ event, desiredRelX }) => {
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

      // TimingCallbacks for end-of-song detection + note timing data
      const timing = new abcjs.TimingCallbacks(visualObjRef.current, {
        qpm: qpm,
        eventCallback: onNoteEvent,
      });
      timingRef.current = timing;

      // Reposition notes to time-proportional positions
      // (must happen AFTER measuring musicWidth but BEFORE playing)
      repositionNotes(timing, realDuration);

      // Calculate barline overlay positions (uses original musicWidth)
      calculateBarlines(qpm, realDuration);

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

    calculateBarlines(qpm, duration);
  };

  // --- Callback: only detect end of song ---
  const onNoteEvent = (event) => {
    if (!event) {
      if (estadoRef.current === 'tocando') {
        setEstado('parado');
        if (onTerminar) onTerminar();
      }
    }
  };

  // --- Aplicar transform CSS (sheet + barlines move together) ---
  const applyTransform = useCallback(() => {
    const offset = playheadOffsetRef.current - firstNoteOffsetRef.current - translateXRef.current;
    if (abcTargetRef.current) {
      abcTargetRef.current.style.transform = `translateX(${offset}px)`;
    }
    if (barlinesRef.current) {
      barlinesRef.current.style.transform = `translateX(${offset}px)`;
    }
  }, []);

  // --- Loop de animación: scroll constante puro (metronomo visual) ---
  const animate = useCallback((timestamp) => {
    if (!lastTimestampRef.current) {
      lastTimestampRef.current = timestamp;
    }

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
