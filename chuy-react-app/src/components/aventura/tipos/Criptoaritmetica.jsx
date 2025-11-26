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
  
  // Nuevos estados para manejar la estructura del JSON
  const [misionDisplayWords, setMisionDisplayWords] = useState([]);
  const [expectedSolution, setExpectedSolution] = useState({});

  // Estados para modo aventura
  const [mostrarFeedback, setMostrarFeedback] = useState(false);
  const [esCorrecta, setEsCorrecta] = useState(false);

  // Inicialización: extraer letras y palabras del problema
  useEffect(() => {
    console.log('Criptoaritmetica recibida:', JSON.stringify(mision, null, 2));

    let ejercicioDatos = null;

    // Función auxiliar para encontrar 'operacion' en cualquier nivel de la estructura
    const encontrarOperacion = (obj) => {
      // Caso 1: operacion está directamente en el objeto
      if (obj.operacion) {
        return obj;
      }
      // Caso 2: está en ejercicios[0]
      if (obj.ejercicios && obj.ejercicios.length > 0 && obj.ejercicios[0].operacion) {
        return obj.ejercicios[0];
      }
      // Caso 3: está en misiones[0].ejercicios[0] (estructura original de aventura)
      if (obj.misiones && obj.misiones.length > 0) {
        const primeraMision = obj.misiones[0];
        if (primeraMision.operacion) {
          return primeraMision;
        }
        if (primeraMision.ejercicios && primeraMision.ejercicios.length > 0) {
          return primeraMision.ejercicios[0];
        }
      }
      return null;
    };

    ejercicioDatos = encontrarOperacion(mision);
    
    if (!ejercicioDatos) {
      console.error('No se encontró operacion en ningún nivel de la estructura.');
      console.log('Claves de mision:', Object.keys(mision));
      console.log('mision completa:', JSON.stringify(mision, null, 2));
    } else {
      console.log('ejercicioDatos encontrado:', ejercicioDatos);
    }

    if (ejercicioDatos && ejercicioDatos.operacion) {
      const displayWordsArray = [
        ejercicioDatos.operacion.linea1,
        ejercicioDatos.operacion.linea2,
        ejercicioDatos.operacion.resultado
      ].filter(Boolean).map(s => s.trim());

      setMisionDisplayWords(displayWordsArray);

      // Extraer letras únicas y primeras letras de las palabras limpias
      // Usamos una lógica negativa: todo lo que NO sea operador, espacio o número es una "letra" (variable)
      const letras = new Set();
      const primeras = new Set();
      
      displayWordsArray.forEach(palabra => {
        // Usar Array.from para iterar correctamente sobre emojis (que pueden ser caracteres dobles)
        const caracteres = Array.from(palabra);
        
        caracteres.forEach((char, index) => {
          // Si el caracter NO es un espacio, ni +, ni -, ni un dígito 0-9...
          // entonces asumimos que es una variable (letra o emoji) a resolver.
          if (!/[\s+\-0-9]/.test(char)) {
            letras.add(char);
            
            // Si es el primer caracter visible de la palabra (y no es un número), es una "primera letra"
            // Nota: Aquí simplificamos asumiendo que el primer char de la palabra es inicio de cifra.
            // Para ser más precisos, deberíamos ver si la palabra 'token' es un número.
            // Pero dado el formato "  🍎", el trim() no quita espacios internos si los hay, 
            // pero displayWordsArray hizo trim().
            
            // Verificamos si es el inicio de la cadena limpia.
            // Una forma simple: si index es 0, o si el anterior era espacio/operador.
            if (index === 0 || /[\s+\-]/.test(caracteres[index-1])) {
               primeras.add(char);
            }
          }
        });
      });

      setLetrasUnicas(Array.from(letras).sort());
      setPrimerasLetras(Array.from(primeras));

      // Inicializar asignaciones
      setAsignaciones(prev => {
        const nuevasAsignaciones = { ...prev };
        Array.from(letras).forEach(letra => {
          if (!(letra in nuevasAsignaciones)) {
            nuevasAsignaciones[letra] = '';
          }
        });
        return nuevasAsignaciones;
      });

      // Transformar la solución
      const transformedSolution = {};
      if (ejercicioDatos.solucion) {
        ejercicioDatos.solucion.forEach(item => {
          transformedSolution[item.figura] = item.valor;
        });
      }
      setExpectedSolution(transformedSolution);
    } else {
      console.error('No se encontraron datos de operación válidos en la misión:', mision);
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
    // Comparar cada asignación del usuario con la solución esperada
    for (let letra of letrasUnicas) {
      if (asignaciones[letra] !== expectedSolution[letra]) {
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

  console.log('Renderizando Criptoaritmetica:', { misionDisplayWords, letrasUnicas, asignaciones });

  return (
    <div className="cripto-container">
      <h3 className="cripto-titulo">{mision.pregunta || mision.titulo || "Descifra el código:"}</h3>

      {/* Área del Problema Visual */}
      <div className="cripto-tablero">
        {misionDisplayWords.length > 0 && (
          <div className="operacion-visual">
            <div className="sumandos">
              {misionDisplayWords.slice(0, -1).map((palabra, idx) => (
                <div key={idx} className="palabra">
                  {Array.from(palabra).map((char, i) => (
                    <span key={i} className="caracter">
                      {char}
                      {asignaciones[char] && <span className="valor-super">{asignaciones[char]}</span>}
                    </span>
                  ))}
                  {idx === misionDisplayWords.length - 2 && <span className="operador">+</span>}
                </div>
              ))}
            </div>
            <div className="linea-resultado"></div>
            <div className="resultado palabra">
              {Array.from(misionDisplayWords[misionDisplayWords.length - 1]).map((char, i) => (
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
              {esCorrectaCalculada 
                ? (mision.explicacion_correcta || (mision.ejercicios && mision.ejercicios[0].explicacion_correcta) || '¡Correcto!') 
                : (mision.explicacion_incorrecta || (mision.ejercicios && mision.ejercicios[0].explicacion_incorrecta) || 'Intenta de nuevo')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Criptoaritmetica;

