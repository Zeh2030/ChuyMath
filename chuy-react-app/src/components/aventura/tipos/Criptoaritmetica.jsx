import React, { useState, useEffect } from 'react';
import './Criptoaritmetica.css';

/**
 * Componente para resolver criptoaritmética.
 * El usuario debe asignar un dígito único (0-9) a cada letra.
 */
const Criptoaritmetica = ({ 
  mision, 
  onCompletar, 
  modoSimulacro = false, 
  respuestaGuardada = {}, 
  onRespuesta = null, 
  mostrarResultado: mostrarResultadoExterno = false 
}) => {
  // Estado para las asignaciones: { 'A': '1', 'B': '2' }
  const [asignaciones, setAsignaciones] = useState(respuestaGuardada || {});
  const [letrasUnicas, setLetrasUnicas] = useState([]);
  const [primerasLetras, setPrimerasLetras] = useState([]);
  const [errorValidacion, setErrorValidacion] = useState(null);
  
  // Estados para modo aventura
  const [mostrarFeedback, setMostrarFeedback] = useState(false);
  const [esCorrecta, setEsCorrecta] = useState(false);

  // Inicialización: extraer letras del problema
  useEffect(() => {
    if (mision && mision.palabras) {
      const letras = new Set();
      const primeras = new Set();
      
      mision.palabras.forEach(palabra => {
        // Añadir todas las letras
        for (let letra of palabra) {
          if (/[A-Z]/.test(letra)) letras.add(letra);
        }
        // Identificar la primera letra (no puede ser 0)
        if (palabra.length > 0 && /[A-Z]/.test(palabra[0])) {
          primeras.add(palabra[0]);
        }
      });

      setLetrasUnicas(Array.from(letras).sort());
      setPrimerasLetras(Array.from(primeras));
    }
  }, [mision]);

  // Sincronizar con respuesta guardada en simulacro
  useEffect(() => {
    if (modoSimulacro && respuestaGuardada) {
      setAsignaciones(respuestaGuardada);
    }
  }, [respuestaGuardada, modoSimulacro]);

  // Manejar cambio en los inputs de letras
  const handleInputChange = (letra, valor) => {
    if (mostrarFeedback || mostrarResultadoExterno) return;

    // Solo permitir un dígito
    const digito = valor.slice(-1); 
    if (digito && !/[0-9]/.test(digito)) return;

    const nuevasAsignaciones = { ...asignaciones };
    
    if (digito === '') {
      delete nuevasAsignaciones[letra];
    } else {
      nuevasAsignaciones[letra] = digito;
    }

    setAsignaciones(nuevasAsignaciones);
    setErrorValidacion(null); // Limpiar errores al escribir

    if (modoSimulacro && onRespuesta) {
      onRespuesta(nuevasAsignaciones);
    }
  };

  // Validar reglas lógicas antes de enviar
  const validarLogica = () => {
    const valores = Object.values(asignaciones);
    
    // 1. Verificar que todas las letras tengan valor
    if (letrasUnicas.some(l => !asignaciones[l])) {
      return "Faltan letras por asignar.";
    }

    // 2. Verificar duplicados (dígitos repetidos)
    const unicos = new Set(valores);
    if (unicos.size !== valores.length) {
      return "¡Cuidado! No puedes usar el mismo número para dos letras diferentes.";
    }

    // 3. Verificar ceros a la izquierda
    for (let letra of primerasLetras) {
      if (asignaciones[letra] === '0') {
        return `La letra inicial '${letra}' no puede valer 0.`;
      }
    }

    return null; // Todo ok
  };

  // Verificar si la respuesta matemática es correcta
  const verificarSolucion = () => {
    const solucionCorrecta = mision.solucion;
    if (!solucionCorrecta) return false;

    // Comparar cada asignación con la solución esperada
    for (let letra of letrasUnicas) {
      if (asignaciones[letra] !== solucionCorrecta[letra]) {
        return false;
      }
    }
    return true;
  };

  // Manejar envío (Modo Aventura)
  const handleEnviar = () => {
    const error = validarLogica();
    if (error) {
      setErrorValidacion(error);
      return;
    }

    const correcta = verificarSolucion();
    setEsCorrecta(correcta);
    setMostrarFeedback(true);

    if (correcta && onCompletar) {
      setTimeout(() => onCompletar(), 2000);
    }
  };

  const handleReintentar = () => {
    setMostrarFeedback(false);
    setEsCorrecta(false);
    setErrorValidacion(null);
  };

  const debeMostrarResultado = mostrarFeedback || (modoSimulacro && mostrarResultadoExterno);
  // En simulacro, calculamos esCorrecta al vuelo para mostrar feedback final
  const esCorrectaCalculada = modoSimulacro ? verificarSolucion() : esCorrecta;

  return (
    <div className="cripto-container">
      <h3 className="cripto-titulo">{mision.pregunta || "Descifra el código:"}</h3>

      {/* Área del Problema Visual */}
      <div className="cripto-tablero">
        {mision.palabras && (
          <div className="operacion-visual">
            <div className="sumandos">
              {mision.palabras.slice(0, -1).map((palabra, idx) => (
                <div key={idx} className="palabra">
                  {palabra.split('').map((char, i) => (
                    <span key={i} className="caracter">
                      {char}
                      {asignaciones[char] && <span className="valor-super">{asignaciones[char]}</span>}
                    </span>
                  ))}
                  {idx === mision.palabras.length - 2 && <span className="operador">+</span>}
                </div>
              ))}
            </div>
            <div className="linea-resultado"></div>
            <div className="resultado palabra">
              {mision.palabras[mision.palabras.length - 1].split('').map((char, i) => (
                <span key={i} className="caracter">
                  {char}
                  {asignaciones[char] && <span className="valor-super">{asignaciones[char]}</span>}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Panel de Asignación */}
      <div className="panel-asignacion">
        <p className="instruccion-panel">Asigna un número a cada letra:</p>
        <div className="grid-letras">
          {letrasUnicas.map(letra => (
            <div key={letra} className="input-grupo">
              <label className="letra-label">{letra} =</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                className={`input-digito ${asignaciones[letra] ? 'lleno' : ''}`}
                value={asignaciones[letra] || ''}
                onChange={(e) => handleInputChange(letra, e.target.value)}
                disabled={debeMostrarResultado}
                placeholder="?"
                autoComplete="off"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Mensajes de error de validación (antes de enviar) */}
      {errorValidacion && !debeMostrarResultado && (
        <div className="mensaje-error-validacion">
          ⚠️ {errorValidacion}
        </div>
      )}

      {/* Botones (Solo Aventura) */}
      {!modoSimulacro && (
        <div className="acciones-container">
          {!mostrarFeedback ? (
            <button className="boton-enviar" onClick={handleEnviar}>
              Comprobar
            </button>
          ) : (
            !esCorrecta && (
              <button className="boton-reintentar" onClick={handleReintentar}>
                Intentar de Nuevo
              </button>
            )
          )}
        </div>
      )}

      {/* Feedback Final */}
      {debeMostrarResultado && (
        <div className={`feedback-container ${esCorrectaCalculada ? 'feedback-correcto' : 'feedback-incorrecto'}`}>
          <div className="feedback-icono">
            {esCorrectaCalculada ? '✅' : '❌'}
          </div>
          <div className="feedback-texto">
            <p className="feedback-titulo">
              {esCorrectaCalculada ? '¡Código Descifrado!' : 'Algo no cuadra...'}
            </p>
            <p className="feedback-explicacion">
              {esCorrectaCalculada ? mision.explicacion_correcta : mision.explicacion_incorrecta}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Criptoaritmetica;

