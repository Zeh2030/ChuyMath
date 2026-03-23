import React, { useState } from 'react';
import './ExperimentoGuia.css';

/**
 * ExperimentoGuia - Wizard paso a paso para experimentos de ciencias.
 * Flujo: Portada → Predicción → Pasos → Observación → Explicación → Quiz → Fin
 */
const ExperimentoGuia = ({ mision, onCompletar }) => {
  const [fase, setFase] = useState('portada'); // portada | prediccion | pasos | observacion | explicacion | quiz | fin
  const [prediccionElegida, setPrediccionElegida] = useState(null);
  const [pasosCompletados, setPasosCompletados] = useState({});
  const [observacionElegida, setObservacionElegida] = useState(null);
  const [quizActual, setQuizActual] = useState(0);
  const [quizRespuestas, setQuizRespuestas] = useState({});
  const [quizFeedback, setQuizFeedback] = useState(null); // null | 'correcto' | 'incorrecto'

  const {
    materiales = [],
    materiales_emoji = [],
    prediccion,
    pasos = [],
    observacion,
    explicacion,
    quiz = [],
  } = mision;

  const todosPasosCompletados = pasos.length > 0 && pasos.every((_, i) => pasosCompletados[i]);

  const togglePaso = (index) => {
    setPasosCompletados(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const responderQuiz = (respuesta) => {
    const preguntaActual = quiz[quizActual];
    const esCorrecta = respuesta === preguntaActual.respuesta;
    setQuizRespuestas(prev => ({ ...prev, [quizActual]: { respuesta, correcta: esCorrecta } }));
    setQuizFeedback(esCorrecta ? 'correcto' : 'incorrecto');
  };

  const siguienteQuiz = () => {
    setQuizFeedback(null);
    if (quizActual < quiz.length - 1) {
      setQuizActual(quizActual + 1);
    } else {
      setFase('fin');
    }
  };

  const avanzar = () => {
    const flujo = ['portada', 'prediccion', 'pasos', 'observacion', 'explicacion', 'quiz', 'fin'];
    const idx = flujo.indexOf(fase);

    // Saltar predicción si no existe
    if (fase === 'portada' && !prediccion) {
      setFase('pasos');
      return;
    }
    // Saltar observación si no existe
    if (fase === 'pasos' && !observacion) {
      setFase('explicacion');
      return;
    }
    // Saltar quiz si no existe
    if (fase === 'explicacion' && quiz.length === 0) {
      setFase('fin');
      return;
    }

    if (idx < flujo.length - 1) {
      setFase(flujo[idx + 1]);
    }
  };

  // === PORTADA ===
  if (fase === 'portada') {
    return (
      <div className="experimento-guia">
        <div className="exp-portada">
          <div className="exp-emoji-grande">{mision.emoji || '🔬'}</div>
          <h2 className="exp-titulo">{mision.titulo}</h2>
          {mision.tema && <span className="exp-tema-badge">{mision.tema.replace(/-/g, ' ')}</span>}

          {materiales.length > 0 && (
            <div className="exp-materiales">
              <h3>Materiales necesarios</h3>
              <ul className="exp-materiales-lista">
                {materiales.map((mat, i) => (
                  <li key={i}>
                    <span className="exp-mat-emoji">{materiales_emoji[i] || '📦'}</span>
                    <span>{mat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button className="exp-btn-principal" onClick={avanzar}>
            Comenzar experimento
          </button>
        </div>
      </div>
    );
  }

  // === PREDICCION ===
  if (fase === 'prediccion') {
    return (
      <div className="experimento-guia">
        <div className="exp-fase-header">
          <span className="exp-fase-num">1</span>
          <h3>Prediccion</h3>
        </div>
        <div className="exp-prediccion">
          <p className="exp-pregunta">{prediccion.pregunta}</p>
          <div className="exp-opciones">
            {prediccion.opciones.map((op, i) => (
              <button
                key={i}
                className={`exp-opcion ${prediccionElegida === op ? 'selected' : ''}`}
                onClick={() => setPrediccionElegida(op)}
              >
                {op}
              </button>
            ))}
          </div>
          <button
            className="exp-btn-principal"
            disabled={prediccionElegida === null}
            onClick={avanzar}
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  // === PASOS ===
  if (fase === 'pasos') {
    return (
      <div className="experimento-guia">
        <div className="exp-fase-header">
          <span className="exp-fase-num">{prediccion ? '2' : '1'}</span>
          <h3>Sigue los pasos</h3>
        </div>
        <div className="exp-pasos">
          {pasos.map((paso, i) => (
            <div
              key={i}
              className={`exp-paso ${pasosCompletados[i] ? 'completado' : ''}`}
              onClick={() => togglePaso(i)}
            >
              <div className="exp-paso-check">
                {pasosCompletados[i] ? '✅' : '⬜'}
              </div>
              <span className="exp-paso-emoji">{paso.emoji || '👉'}</span>
              <span className="exp-paso-texto">{paso.instruccion}</span>
            </div>
          ))}
          <button
            className="exp-btn-principal"
            disabled={!todosPasosCompletados}
            onClick={avanzar}
          >
            {todosPasosCompletados ? 'Continuar' : `Marca todos los pasos (${Object.values(pasosCompletados).filter(Boolean).length}/${pasos.length})`}
          </button>
        </div>
      </div>
    );
  }

  // === OBSERVACION ===
  if (fase === 'observacion') {
    return (
      <div className="experimento-guia">
        <div className="exp-fase-header">
          <span className="exp-fase-num">{prediccion ? '3' : '2'}</span>
          <h3>Observacion</h3>
        </div>
        <div className="exp-observacion">
          <p className="exp-pregunta">{observacion.pregunta}</p>
          <div className="exp-opciones">
            {observacion.opciones.map((op, i) => (
              <button
                key={i}
                className={`exp-opcion ${observacionElegida === op ? 'selected' : ''}`}
                onClick={() => setObservacionElegida(op)}
              >
                {op}
              </button>
            ))}
          </div>

          {/* Comparar prediccion vs observacion */}
          {prediccionElegida && observacionElegida && (
            <div className="exp-comparacion">
              <p><strong>Tu prediccion:</strong> {prediccionElegida}</p>
              <p><strong>Lo que observaste:</strong> {observacionElegida}</p>
              {prediccionElegida === observacionElegida ? (
                <p className="exp-match">Tu prediccion fue correcta!</p>
              ) : (
                <p className="exp-no-match">Tu prediccion fue diferente. Eso esta bien, asi se aprende!</p>
              )}
            </div>
          )}

          <button
            className="exp-btn-principal"
            disabled={observacionElegida === null}
            onClick={avanzar}
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  // === EXPLICACION ===
  if (fase === 'explicacion') {
    return (
      <div className="experimento-guia">
        <div className="exp-fase-header">
          <span className="exp-fase-num">
            {prediccion && observacion ? '4' : prediccion || observacion ? '3' : '2'}
          </span>
          <h3>Explicacion cientifica</h3>
        </div>
        <div className="exp-explicacion">
          <div className="exp-explicacion-card">
            <div className="exp-explicacion-icono">🧪</div>
            <p>{explicacion}</p>
          </div>
          <button className="exp-btn-principal" onClick={avanzar}>
            {quiz.length > 0 ? 'Ir al Quiz' : 'Finalizar'}
          </button>
        </div>
      </div>
    );
  }

  // === QUIZ ===
  if (fase === 'quiz') {
    const pregunta = quiz[quizActual];
    const yaRespondida = quizRespuestas[quizActual] !== undefined;

    return (
      <div className="experimento-guia">
        <div className="exp-fase-header">
          <span className="exp-fase-num">Quiz</span>
          <h3>Pregunta {quizActual + 1} de {quiz.length}</h3>
        </div>
        <div className="exp-quiz">
          <p className="exp-pregunta">{pregunta.pregunta}</p>

          {/* true-or-false */}
          {pregunta.tipo === 'true-or-false' && (
            <div className="exp-opciones">
              <button
                className={`exp-opcion ${yaRespondida && quizRespuestas[quizActual]?.respuesta === true ? (quizRespuestas[quizActual].correcta ? 'correcto' : 'incorrecto') : ''}`}
                disabled={yaRespondida}
                onClick={() => responderQuiz(true)}
              >
                Verdadero
              </button>
              <button
                className={`exp-opcion ${yaRespondida && quizRespuestas[quizActual]?.respuesta === false ? (quizRespuestas[quizActual].correcta ? 'correcto' : 'incorrecto') : ''}`}
                disabled={yaRespondida}
                onClick={() => responderQuiz(false)}
              >
                Falso
              </button>
            </div>
          )}

          {/* opcion-multiple */}
          {pregunta.tipo === 'opcion-multiple' && (
            <div className="exp-opciones">
              {pregunta.opciones.map((op, i) => (
                <button
                  key={i}
                  className={`exp-opcion ${yaRespondida && quizRespuestas[quizActual]?.respuesta === op ? (quizRespuestas[quizActual].correcta ? 'correcto' : 'incorrecto') : ''} ${yaRespondida && op === pregunta.respuesta && !quizRespuestas[quizActual]?.correcta ? 'respuesta-correcta' : ''}`}
                  disabled={yaRespondida}
                  onClick={() => responderQuiz(op)}
                >
                  {op}
                </button>
              ))}
            </div>
          )}

          {/* fill-the-gap (texto libre) */}
          {pregunta.tipo === 'fill-the-gap' && !yaRespondida && (
            <FillGapInput onSubmit={responderQuiz} />
          )}

          {/* Feedback */}
          {quizFeedback && (
            <div className={`exp-quiz-feedback ${quizFeedback}`}>
              {quizFeedback === 'correcto' ? 'Correcto!' : `Incorrecto. La respuesta es: ${pregunta.respuesta}`}
            </div>
          )}

          {yaRespondida && (
            <button className="exp-btn-principal" onClick={siguienteQuiz}>
              {quizActual < quiz.length - 1 ? 'Siguiente pregunta' : 'Finalizar'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // === FIN ===
  if (fase === 'fin') {
    const totalCorrectas = Object.values(quizRespuestas).filter(r => r.correcta).length;
    return (
      <div className="experimento-guia">
        <div className="exp-fin">
          <div className="exp-fin-emoji">🎉</div>
          <h2>Experimento completado!</h2>
          {quiz.length > 0 && (
            <p className="exp-fin-score">
              Quiz: {totalCorrectas} / {quiz.length} correctas
              {totalCorrectas === quiz.length && ' - Perfecto!'}
            </p>
          )}
          <button className="exp-btn-principal" onClick={onCompletar}>
            Continuar
          </button>
        </div>
      </div>
    );
  }

  return null;
};

/** Mini-componente para fill-the-gap dentro del quiz */
const FillGapInput = ({ onSubmit }) => {
  const [valor, setValor] = useState('');
  return (
    <div className="exp-fill-gap">
      <input
        type="text"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder="Escribe tu respuesta..."
        className="exp-fill-input"
      />
      <button
        className="exp-btn-principal"
        disabled={!valor.trim()}
        onClick={() => onSubmit(valor.trim())}
      >
        Verificar
      </button>
    </div>
  );
};

export default ExperimentoGuia;
