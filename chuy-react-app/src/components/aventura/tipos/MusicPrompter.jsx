import React, { useState, useEffect, useRef, useCallback } from 'react';
import abcjs from 'abcjs';
import './MusicPrompter.css';

/**
 * Estima el total de beats en una cadena de notación ABC.
 * Asume L:1/4 (cada nota sin modificador = 1 beat).
 */
function estimateTotalBeats(abcNotation) {
  // Extraer solo la línea de notas (después de las líneas de encabezado)
  const lines = abcNotation.split('\n');
  const notesLine = lines
    .filter(l => l && !l.match(/^[A-Z]:/))
    .join(' ');

  let beats = 0;
  // Matchea notas (A-G, a-g), con posibles octave marks (',), y duración
  const noteRegex = /([A-Ga-gz][',]*)((\d+)?(\/(\d+))?)/g;
  let match;
  while ((match = noteRegex.exec(notesLine)) !== null) {
    const fullDuration = match[2];
    if (!fullDuration || fullDuration === '') {
      beats += 1; // Nota default = 1 beat (L:1/4)
    } else if (match[3] && !match[4]) {
      // Solo número: C2 = 2 beats, C4 = 4 beats
      beats += parseInt(match[3], 10);
    } else if (match[4]) {
      // Fracción: C/2 = 0.5, C3/2 = 1.5
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
  // --- State (solo lo que necesita re-render) ---
  const [estado, setEstado] = useState('parado'); // 'parado' | 'tocando' | 'pausado'
  const [bpmActual, setBpmActual] = useState(bpm || 80);

  // --- Refs (rendimiento, sin re-renders) ---
  const containerRef = useRef(null);
  const abcTargetRef = useRef(null);
  const translateXRef = useRef(0);
  const rafIdRef = useRef(null);
  const lastTimestampRef = useRef(null);
  const totalWidthRef = useRef(0);
  const viewportWidthRef = useRef(600);
  const pixelsPerSecondRef = useRef(0);
  const playheadOffsetRef = useRef(150);

  // --- Renderizar ABC → SVG ---
  useEffect(() => {
    if (!abcTargetRef.current || !abcNotation) return;

    // Limpiar render previo
    abcTargetRef.current.innerHTML = '';

    // Renderizar partitura
    abcjs.renderAbc(abcTargetRef.current, abcNotation, {
      staffwidth: 3000,
      add_classes: true,
      paddingtop: 10,
      paddingbottom: 10,
      paddingleft: 20,
    });

    // Medir SVG después del render
    requestAnimationFrame(() => {
      const svg = abcTargetRef.current?.querySelector('svg');
      if (svg) {
        totalWidthRef.current = svg.getBoundingClientRect().width;
      }

      // Medir viewport
      if (containerRef.current) {
        viewportWidthRef.current = containerRef.current.clientWidth;
        playheadOffsetRef.current = viewportWidthRef.current * 0.25;
      }

      // Calcular velocidad inicial
      recalcSpeed();

      // Posición inicial: primera nota alineada con playhead
      translateXRef.current = 0;
      applyTransform();
    });
  }, [abcNotation]);

  // --- Recalcular velocidad cuando BPM cambia ---
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

    // Avanzar posición
    translateXRef.current += pixelsPerSecondRef.current * (deltaMs / 1000);

    // Verificar si la canción terminó
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
      lastTimestampRef.current = null; // Reset para evitar salto después de pausa
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
  const handlePlay = () => setEstado('tocando');
  const handlePause = () => setEstado('pausado');

  const handleReset = () => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    translateXRef.current = 0;
    lastTimestampRef.current = null;
    applyTransform();
    setEstado('parado');
  };

  const handleBpmUp = () => setBpmActual(prev => Math.min(200, prev + 5));
  const handleBpmDown = () => setBpmActual(prev => Math.max(20, prev - 5));

  return (
    <div className="mp-container">
      {/* Header */}
      <div className="mp-header">
        <h3>🎹 {titulo}</h3>
        {autor && <p className="mp-autor">{autor}</p>}
      </div>

      {/* Viewport con partitura */}
      <div className="mp-viewport" ref={containerRef}>
        <div className="mp-playhead"></div>
        <div className="mp-sheet" ref={abcTargetRef}></div>
      </div>

      {/* Controles */}
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

        <div className="mp-bpm-control">
          <span className="mp-bpm-label">BPM</span>
          <button className="mp-bpm-btn" onClick={handleBpmDown}>−</button>
          <span className="mp-bpm-value">{bpmActual}</span>
          <button className="mp-bpm-btn" onClick={handleBpmUp}>+</button>
        </div>
      </div>

      <p className="mp-instruction">
        Presiona Play y sigue las notas cuando pasen por la línea roja
      </p>
    </div>
  );
};

export default MusicPrompter;
