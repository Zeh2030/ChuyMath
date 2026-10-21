import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import PreguntaImpresa from '../components/imprimir/PreguntaImpresa';
import { burbujasDe, claveDe, letra } from '../utils/imprimir';
import './ImprimirSimulacro.css';

/**
 * Versión para papel de un simulacro: examen, hoja de respuestas y clave para el papá.
 * Sin PageWrapper ni Header (hoja blanca, sin tema). Se imprime con el diálogo del
 * navegador, que también permite "Guardar como PDF".
 */
const ImprimirSimulacro = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [simulacro, setSimulacro] = useState(null);
  const [error, setError] = useState(null);
  const [incluirHoja, setIncluirHoja] = useState(true);
  const [incluirClave, setIncluirClave] = useState(true);

  useEffect(() => {
    let vigente = true;
    getDoc(doc(db, 'simulacros', id))
      .then((snap) => {
        if (!vigente) return;
        if (snap.exists()) setSimulacro({ id: snap.id, ...snap.data() });
        else setError(`No se encontró el simulacro con ID ${id}`);
      })
      .catch((e) => vigente && setError(e.message));
    return () => { vigente = false; };
  }, [id]);

  // El título del documento es el nombre que propone "Guardar como PDF".
  useEffect(() => {
    if (!simulacro) return undefined;
    const anterior = document.title;
    document.title = `${simulacro.titulo} - ChuyMath`;
    return () => { document.title = anterior; };
  }, [simulacro]);

  if (error) {
    return (
      <div className="impreso-fondo">
        <div className="impreso-barra solo-pantalla">
          <button onClick={() => navigate(-1)}>← Volver</button>
        </div>
        <p className="impreso-mensaje">❌ {error}</p>
      </div>
    );
  }
  if (!simulacro) {
    return <div className="impreso-fondo"><p className="impreso-mensaje">Preparando la versión para imprimir...</p></div>;
  }

  const items = simulacro.problemas || simulacro.misiones || [];

  return (
    <div className="impreso-fondo">
      <div className="impreso-barra solo-pantalla">
        <button onClick={() => navigate(`/simulacro/${id}`)}>← Volver al simulacro</button>
        <label><input type="checkbox" checked={incluirHoja} onChange={(e) => setIncluirHoja(e.target.checked)} /> Hoja de respuestas</label>
        <label><input type="checkbox" checked={incluirClave} onChange={(e) => setIncluirClave(e.target.checked)} /> Clave (para el papá)</label>
        <button className="impreso-boton-imprimir" onClick={() => window.print()}>🖨️ Imprimir</button>
      </div>

      <main className="impreso">
        {/* Examen */}
        <section className="seccion-examen">
          <header className="impreso-encabezado">
            <h1>{simulacro.titulo}</h1>
            <div className="impreso-datos">
              <span>Nombre: <span className="pi-linea pi-linea-larga" /></span>
              <span>Grado: <span className="pi-linea pi-linea-corta" /></span>
              <span>Fecha: <span className="pi-linea" /></span>
              <span>Inicio: <span className="pi-linea pi-linea-corta" /></span>
              <span>Fin: <span className="pi-linea pi-linea-corta" /></span>
            </div>
            <p className="impreso-instrucciones">
              {items.length} preguntas. Lee con calma cada una
              {incluirHoja ? ' y marca tu respuesta en la hoja de respuestas.' : ' y escribe tu respuesta.'}
              {' '}Puedes hacer tus operaciones en esta hoja.
            </p>
          </header>
          {items.map((p, i) => <PreguntaImpresa key={p.id || i} problema={p} numero={i + 1} />)}
        </section>

        {incluirHoja && (
          <section className="seccion-hoja">
            <header className="impreso-encabezado">
              <h2>Hoja de respuestas</h2>
              <p className="impreso-subtitulo">{simulacro.titulo}</p>
              <div className="impreso-datos">
                <span>Nombre: <span className="pi-linea pi-linea-larga" /></span>
                <span>Aciertos: <span className="pi-linea pi-linea-corta" /> de {items.length}</span>
              </div>
            </header>
            <ol className="hoja-filas">
              {items.map((p, i) => {
                const n = burbujasDe(p);
                return (
                  <li key={p.id || i} className="hoja-fila">
                    <span className="hoja-numero">{i + 1}.</span>
                    {n > 0
                      ? Array.from({ length: n }, (_, k) => <span key={k} className="hoja-burbuja">{letra(k)}</span>)
                      : <span className="pi-linea hoja-linea" />}
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {incluirClave && (
          <section className="seccion-clave">
            <header className="impreso-encabezado">
              <h2>Clave — para el papá</h2>
              <p className="impreso-subtitulo">{simulacro.titulo}</p>
            </header>
            <table className="clave-tabla">
              <tbody>
                {items.map((p, i) => {
                  const { letra: l, texto } = claveDe(p);
                  return (
                    <tr key={p.id || i} className="clave-fila">
                      <td className="clave-numero">{i + 1}.</td>
                      <td className="clave-respuesta">
                        {l && <strong className="clave-letra">{l}</strong>} {texto}
                      </td>
                      <td className="clave-explicacion">
                        {p.explicacion_correcta && <span dangerouslySetInnerHTML={{ __html: p.explicacion_correcta }} />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </div>
  );
};

export default ImprimirSimulacro;
