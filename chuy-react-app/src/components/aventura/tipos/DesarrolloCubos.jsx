import React, { useState, useEffect, useMemo } from 'react';
import './DesarrolloCubos.css';

// three.js solo se descarga cuando el nino llega a una mision de cubos.
const Cubo3D = React.lazy(() => import('./Cubo3D'));

// Colores para planos que no traen color propio (formato antiguo, SVG a mano).
const PALETA_PLANO = [
  '#FFD93D', '#FF6B6B', '#4ECDC4', '#45B7D1',
  '#96CEB4', '#C7A2FF', '#FFAF7B', '#A8E063',
];

const leerAtributo = (etiqueta, nombre) => {
  const m = etiqueta.match(new RegExp(`(?:^|\\s)${nombre}\\s*=\\s*['"]([^'"]*)['"]`));
  return m ? m[1] : null;
};

/**
 * Convierte el `plano_svg` del formato antiguo en una rejilla de caras.
 *
 * Los planos son SVG escritos a mano pero con una forma muy regular: `<rect>`
 * en una cuadricula y un `<text>` dentro de algunas celdas. Parseandolos aqui,
 * el contenido antiguo gana el cubo 3D sin tener que reescribir ningun JSON.
 * Si el SVG no encaja con ese patron devolvemos null y no se muestra el 3D.
 */
const parsearPlanoSvg = (svg) => {
  if (!svg || typeof svg !== 'string') return null;
  try {
    const celdas = [...svg.matchAll(/<rect\b[^>]*>/g)]
      .map((m) => {
        const t = m[0];
        return {
          x: parseFloat(leerAtributo(t, 'x')),
          y: parseFloat(leerAtributo(t, 'y')),
          ancho: parseFloat(leerAtributo(t, 'width')),
          alto: parseFloat(leerAtributo(t, 'height')),
        };
      })
      .filter((c) => [c.x, c.y, c.ancho, c.alto].every(Number.isFinite) && c.ancho > 0 && c.alto > 0);

    if (celdas.length < 2) return null;

    const textos = [...svg.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)]
      .map((m) => ({
        x: parseFloat(leerAtributo(m[1], 'x')),
        y: parseFloat(leerAtributo(m[1], 'y')),
        contenido: m[2].trim(),
      }))
      .filter((t) => Number.isFinite(t.x) && Number.isFinite(t.y) && t.contenido);

    const lado = Math.min(...celdas.map((c) => Math.min(c.ancho, c.alto)));
    const minX = Math.min(...celdas.map((c) => c.x));
    const minY = Math.min(...celdas.map((c) => c.y));

    return celdas.map((celda, idx) => {
      // El texto de la celda es el que cae dentro de sus limites.
      const dentro = textos.find(
        (t) => t.x >= celda.x && t.x <= celda.x + celda.ancho &&
               t.y >= celda.y && t.y <= celda.y + celda.alto
      );
      return {
        id: `c${idx}`,
        fila: Math.round((celda.y - minY) / lado),
        columna: Math.round((celda.x - minX) / lado),
        contenido: dentro ? dentro.contenido : '',
        color: PALETA_PLANO[idx % PALETA_PLANO.length],
      };
    });
  } catch {
    return null;
  }
};

const DesarrolloCubos = ({
  mision,
  onCompletar,
  modoSimulacro = false,
  respuestaGuardada = '',
  onRespuesta = null,
  mostrarResultado: mostrarResultadoExterno = false
}) => {
  const [seleccion, setSeleccion] = useState(respuestaGuardada || '');
  const [esCorrecto, setEsCorrecto] = useState(false);
  const [mostrarFeedback, setMostrarFeedback] = useState(false);
  const [indiceEjercicioActual, setIndiceEjercicioActual] = useState(0);

  useEffect(() => {
    if (modoSimulacro && respuestaGuardada) {
      setSeleccion(respuestaGuardada);
    }
  }, [respuestaGuardada, modoSimulacro]);

  // Reiniciar índice al cambiar de misión
  useEffect(() => {
    setIndiceEjercicioActual(0);
    setSeleccion('');
    setMostrarFeedback(false);
    setEsCorrecto(false);
  }, [mision.id]);

  // Soportar dos formatos: nuevo (datos_cubo) y antiguo (plano_svg/opciones_svg)
  const usarFormatoAntiguo = !mision.datos_cubo && mision.ejercicios;
  const ejercicios = usarFormatoAntiguo ? (mision.ejercicios || []) : [];
  const ejercicio = usarFormatoAntiguo && ejercicios.length > 0 ? ejercicios[indiceEjercicioActual] : null;

  // En formato antiguo, usar el índice como respuesta
  const caras = usarFormatoAntiguo
    ? (ejercicio?.opciones_svg || []).map((svg, idx) => ({
        id: idx.toString(),
        contenido: 'Opción ' + (idx + 1),
        color: '#fff',
        fila: Math.floor(idx / 2),
        columna: idx % 2
      }))
    : (mision.datos_cubo?.caras || []);

  const pregunta = usarFormatoAntiguo
    ? (mision.instruccion || 'Observa y selecciona')
    : mision.pregunta;

  const respuestaCorrecta = usarFormatoAntiguo
    ? (ejercicio?.respuesta !== undefined ? ejercicio.respuesta.toString() : '')
    : (mision.respuesta !== undefined ? mision.respuesta.toString() : '');

  const explicacionCorrecta = usarFormatoAntiguo
    ? ejercicio?.explicacion_correcta
    : mision.explicacion_correcta;

  const explicacionIncorrecta = usarFormatoAntiguo
    ? ejercicio?.explicacion_incorrecta
    : mision.explicacion_incorrecta;

  // Tamaño de la celda en el SVG
  const CELL_SIZE = 80;
  const PADDING = 10;

  // Calcular dimensiones del SVG dinámicamente
  const maxFil = Math.max(...caras.map(c => c.fila)) + 1;
  const maxCol = Math.max(...caras.map(c => c.columna)) + 1;
  const width = maxCol * CELL_SIZE + (maxCol + 1) * PADDING;
  const height = maxFil * CELL_SIZE + (maxFil + 1) * PADDING;

  const handleSeleccion = (idCara) => {
    if (mostrarFeedback || mostrarResultadoExterno) return;
    setSeleccion(idCara);
    if (modoSimulacro && onRespuesta) {
      onRespuesta(idCara);
    }
  };

  const comprobarRespuesta = () => {
    if (!seleccion) return;
    // Comparación robusta como strings
    const correcto = seleccion.toString() === respuestaCorrecta.toString();
    setEsCorrecto(correcto);
    setMostrarFeedback(true);

    // Si es correcto, esperamos a que el usuario presione Continuar
  };

  const handleContinuar = () => {
    if (usarFormatoAntiguo && indiceEjercicioActual < ejercicios.length - 1) {
      // Avanzar al siguiente ejercicio
      setIndiceEjercicioActual(prev => prev + 1);
      setSeleccion('');
      setMostrarFeedback(false);
      setEsCorrecto(false);
    } else if (onCompletar) {
      // Completar misión (si es el último o único ejercicio)
      onCompletar();
    }
  };

  const handleReintentar = () => {
    setSeleccion('');
    setMostrarFeedback(false);
    setEsCorrecto(false);
  };

  const debeMostrarResultado = mostrarFeedback || (modoSimulacro && mostrarResultadoExterno);

  // En simulacro, verificar contra la respuesta guardada
  const esCorrectoCalculado = modoSimulacro
    ? (seleccion === respuestaCorrecta)
    : esCorrecto;

  // === Cubo 3D ===
  // El plano que se dobla: en el formato nuevo son las mismas caras del quiz;
  // en el antiguo se saca del SVG dibujado a mano.
  const carasPlano = useMemo(() => {
    if (!usarFormatoAntiguo) return caras;
    return parsearPlanoSvg(ejercicio?.plano_svg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usarFormatoAntiguo, mision.datos_cubo, ejercicio?.plano_svg]);

  // Tras responder, se marca la cara correcta (y la elegida si fallo).
  const resaltar = useMemo(() => {
    if (usarFormatoAntiguo || !debeMostrarResultado) return null;
    const marcas = { [respuestaCorrecta]: '#2ecc71' };
    if (!esCorrectoCalculado && seleccion) marcas[seleccion] = '#e74c3c';
    return marcas;
  }, [usarFormatoAntiguo, debeMostrarResultado, respuestaCorrecta, esCorrectoCalculado, seleccion]);

  // El cubo se dobla despues de responder: doblarlo antes regalaria la respuesta.
  // `permitir_doblar_antes` en el JSON lo abre para misiones de pura exploracion.
  const puedeDoblar = Boolean(carasPlano?.length) &&
    (debeMostrarResultado || mision.permitir_doblar_antes === true);

  return (
    <div className="cubos-container">
      <h3 className="cubos-pregunta">{pregunta}</h3>

      {/* Formato antiguo: mostrar plano + opciones SVG */}
      {usarFormatoAntiguo && ejercicio ? (
        <div className="cubos-antiguo-format">
          {/* Mostrar el plano del cubo */}
          <div className="plano-container">
            <h4>Observa el plano:</h4>
            <div dangerouslySetInnerHTML={{ __html: ejercicio.plano_svg }} />
          </div>

          {/* Mostrar opciones como SVGs */}
          <div className="opciones-container">
            <h4>¿Cuál de estos cubos se forma?</h4>
            <div className="opciones-grid">
              {ejercicio.opciones_svg?.map((optionSvg, idx) => {
                const isSelected = seleccion === idx.toString();
                const isCorrect = debeMostrarResultado && idx.toString() === respuestaCorrecta;
                const isWrong = debeMostrarResultado && isSelected && !esCorrectoCalculado;

                return (
                  <div
                    key={idx}
                    className={`opcion-svg ${isSelected ? 'selected' : ''} ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
                    onClick={() => !debeMostrarResultado && handleSeleccion(idx.toString())}
                    style={{ cursor: debeMostrarResultado ? 'default' : 'pointer' }}
                  >
                    <div dangerouslySetInnerHTML={{ __html: optionSvg }} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Formato nuevo: renderizar con estructura de caras */
        <div className="svg-wrapper">
          <svg
            width="100%"
            viewBox={`0 0 ${width} ${height}`}
            className="cubo-svg"
          >
            <defs>
              {/* Filtro para sombra suave (Clase Mundial) */}
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                <feOffset dx="2" dy="4" result="offsetblur" />
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.3" />
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {caras.map((cara) => {
              const x = cara.columna * (CELL_SIZE + PADDING) + PADDING;
              const y = cara.fila * (CELL_SIZE + PADDING) + PADDING;
              const isSelected = seleccion === cara.id;
              const isCorrect = debeMostrarResultado && cara.id === respuestaCorrecta;
              const isWrong = debeMostrarResultado && isSelected && !esCorrectoCalculado;

              // Estilo dinámico según estado
              let strokeColor = "white";
              let strokeWidth = "3";

              if (isSelected) {
                strokeColor = "#3498db"; // Azul selección
                strokeWidth = "6";
              }
              if (isCorrect) {
                strokeColor = "#2ecc71"; // Verde correcto
                strokeWidth = "8";
              }
              if (isWrong) {
                strokeColor = "#e74c3c"; // Rojo error
                strokeWidth = "8";
              }

              return (
                <g
                  key={cara.id}
                  onClick={() => handleSeleccion(cara.id)}
                  style={{ cursor: debeMostrarResultado ? 'default' : 'pointer' }}
                  className="cara-grupo"
                >
                  <rect
                    x={x}
                    y={y}
                    width={CELL_SIZE}
                    height={CELL_SIZE}
                    rx="12"
                    fill={cara.color}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    filter="url(#shadow)"
                    className="cara-rect"
                  />
                  <text
                    x={x + CELL_SIZE / 2}
                    y={y + CELL_SIZE / 2}
                    dy=".35em"
                    textAnchor="middle"
                    fontSize="40"
                    className="cara-icono"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {cara.contenido}
                  </text>

                  {/* Indicador de selección (Check pequeño visual) */}
                  {isSelected && !debeMostrarResultado && (
                    <circle cx={x + CELL_SIZE - 12} cy={y + 12} r="8" fill="#3498db" stroke="white" strokeWidth="2" />
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {/* Comprobacion en 3D: el plano se dobla de verdad y se puede girar */}
      {puedeDoblar && (
        <div className="cubos-3d-panel">
          <h4>Compruébalo en 3D</h4>
          <React.Suspense fallback={<div className="cubos-3d-cargando">Cargando el cubo…</div>}>
            <Cubo3D
              key={`${mision.id}-${indiceEjercicioActual}`}
              caras={carasPlano}
              resaltar={resaltar}
              etiqueta={usarFormatoAntiguo ? '🎲 Ver cómo se dobla' : null}
            />
          </React.Suspense>
        </div>
      )}

      <div className="instruccion-seleccion">
        {debeMostrarResultado ? (
           <p className={`mensaje-resultado ${esCorrectoCalculado ? 'texto-verde' : 'texto-rojo'}`}>
             {esCorrectoCalculado ? explicacionCorrecta : explicacionIncorrecta}
           </p>
        ) : (
           <p>👆 Toca la cara correcta en el dibujo</p>
        )}
      </div>

      {!modoSimulacro && (
        <div className="acciones-container">
          {!mostrarFeedback ? (
            <button
              className="boton-enviar"
              onClick={comprobarRespuesta}
              disabled={!seleccion}
            >
              Confirmar
            </button>
          ) : (
            esCorrecto ? (
              <button className="boton-continuar" onClick={handleContinuar}>
                Continuar ➜
              </button>
            ) : (
              <button className="boton-reintentar" onClick={handleReintentar}>
                Intentar de Nuevo
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default DesarrolloCubos;

