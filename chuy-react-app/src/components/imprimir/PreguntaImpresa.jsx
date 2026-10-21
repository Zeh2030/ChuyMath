import React from 'react';
import { valorDeOpcion } from '../../utils/calificar';
import { carasConLetra, esSvg, figurasCripto, letra, letrasRevueltas } from '../../utils/imprimir';

/**
 * Una pregunta de simulacro dibujada para papel: sin botones, sin animaciones y con
 * todo lo necesario para contestar con lápiz (letras A-E, nombres de lugares, letras
 * en las caras del cubo, renglones). El contenido HTML/SVG viene del admin, igual que
 * en la app (OpcionMultiple ya inyecta `imagen` y las explicaciones como HTML).
 */

const Html = ({ html, className }) => (
  <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
);

const Enunciado = ({ texto }) => (texto ? <Html className="pi-enunciado" html={texto} /> : null);

const Renglon = ({ etiqueta }) => (
  <p className="pi-renglon">{etiqueta} <span className="pi-linea" /></p>
);

const OpcionMultiple = ({ p }) => {
  const sonImagenes = p.opciones_son_imagenes || (p.opciones || []).every(o => esSvg(o));
  return (
    <>
      <Enunciado texto={p.pregunta || p.pregunta_final} />
      {p.imagen && (esSvg(p.imagen) || /^\s*</.test(p.imagen)
        ? <Html className="pi-imagen" html={p.imagen} />
        : <div className="pi-imagen"><img src={p.imagen} alt="" /></div>)}
      <ol className={`pi-opciones ${sonImagenes ? 'pi-opciones-imagenes' : ''}`}>
        {(p.opciones || p.opciones_finales || []).map((o, i) => {
          const texto = typeof o === 'object' && o !== null ? (o.texto ?? valorDeOpcion(o)) : o;
          return (
            <li key={i} className="pi-opcion">
              <span className="pi-letra">{letra(i)}</span>
              {sonImagenes || esSvg(texto)
                ? <Html className="pi-opcion-imagen" html={texto} />
                : <span className="pi-opcion-texto">{String(texto)}</span>}
            </li>
          );
        })}
      </ol>
    </>
  );
};

const Operaciones = ({ p }) => (
  <>
    <Enunciado texto={p.pregunta || p.operacion_texto} />
    <div className="pi-caja-operaciones" />
    <Renglon etiqueta="Respuesta:" />
  </>
);

const Criptoaritmetica = ({ p }) => {
  const op = p.operacion || {};
  return (
    <>
      <Enunciado texto={p.pregunta || p.titulo || 'Descubre qué número vale cada figura.'} />
      <div className="pi-cripto-op">
        <div>{(op.linea1 || '').trim()}</div>
        <div>{(op.linea2 || '').trim()}</div>
        <div className="pi-cripto-raya" />
        <div>{(op.resultado || '').trim()}</div>
      </div>
      <div className="pi-cripto-valores">
        {figurasCripto(op).map(f => (
          <span key={f} className="pi-cripto-valor">{f} = <span className="pi-cuadro" /></span>
        ))}
      </div>
    </>
  );
};

const FLECHA = { norte: '⬆️ Norte', sur: '⬇️ Sur', este: '➡️ Este', oeste: '⬅️ Oeste' };

const NavegacionMapa = ({ p }) => {
  const c = p.configuracion_mapa || {};
  const T = 38; // lado de cada cuadro, en unidades del SVG
  const ancho = c.columnas * T;
  const alto = c.filas * T + 12; // aire para el nombre de la fila de abajo
  const centro = (fila, columna) => [columna * T + T / 2, fila * T + T / 2];
  return (
    <>
      <Enunciado texto={p.pregunta || '¿A qué lugar llega?'} />
      <div className="pi-mapa">
        <svg viewBox={`-2 -2 ${ancho + 4} ${alto + 4}`} className="pi-mapa-svg" style={{ maxWidth: Math.min(ancho * 1.3, 430) }}>
          {Array.from({ length: c.filas }, (_, f) => Array.from({ length: c.columnas }, (_, k) => (
            <rect key={`${f}-${k}`} x={k * T} y={f * T} width={T} height={T} fill="white" stroke="#999" strokeWidth="0.8" />
          )))}
          {c.punto_inicio && (() => {
            const [x, y] = centro(c.punto_inicio.fila, c.punto_inicio.columna);
            return (
              <g>
                <circle cx={x} cy={y} r={T / 2 - 5} fill="#fde2e2" stroke="#c0392b" strokeWidth="1.5" />
                <text x={x} y={y} dy=".35em" textAnchor="middle" fontSize="15">{c.punto_inicio.icono || '🏃'}</text>
                <text x={x} y={y + T / 2 + 7} textAnchor="middle" fontSize="7" fontWeight="bold">Inicio</text>
              </g>
            );
          })()}
          {(c.puntos_interes || []).map(pi => {
            const [x, y] = centro(pi.fila, pi.columna);
            return (
              <g key={pi.nombre}>
                <text x={x} y={y - 2} dy=".35em" textAnchor="middle" fontSize="16">{pi.icono}</text>
                <text x={x} y={y + T / 2 + 7} textAnchor="middle" fontSize="7" fontWeight="bold">{pi.nombre}</text>
              </g>
            );
          })}
        </svg>
        {(c.movimientos || []).length > 0 && (
          <ol className="pi-pasos">
            {c.movimientos.map((m, i) => <li key={i}>{FLECHA[m] || m}</li>)}
          </ol>
        )}
      </div>
      <Renglon etiqueta="Llega a:" />
    </>
  );
};

const DesarrolloCubos = ({ p }) => {
  const caras = carasConLetra(p.datos_cubo);
  const T = 64, G = 4;
  const columnas = Math.max(...caras.map(c => c.columna)) + 1;
  const filas = Math.max(...caras.map(c => c.fila)) + 1;
  return (
    <>
      <Enunciado texto={p.pregunta} />
      <div className="pi-cubo">
        <svg viewBox={`0 0 ${columnas * (T + G) + G} ${filas * (T + G) + G}`} className="pi-cubo-svg">
          {caras.map(cara => {
            const x = cara.columna * (T + G) + G;
            const y = cara.fila * (T + G) + G;
            return (
              <g key={cara.id}>
                <rect x={x} y={y} width={T} height={T} rx="6" fill={cara.color || 'white'} stroke="#333" strokeWidth="1.5" />
                <text x={x + T / 2} y={y + T / 2 + 2} dy=".35em" textAnchor="middle" fontSize="30">{cara.contenido}</text>
                <circle cx={x + 11} cy={y + 11} r="8.5" fill="white" stroke="#333" strokeWidth="1" />
                <text x={x + 11} y={y + 11} dy=".35em" textAnchor="middle" fontSize="11" fontWeight="bold">{cara.letra}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="pi-nota">Escribe la letra de la cara en tu hoja de respuestas.</p>
    </>
  );
};

const Platillo = ({ objetos }) => (
  <div className="pi-platillo">
    {objetos.map((o, i) => (
      <span key={i} className="pi-objeto">
        <span className="pi-objeto-icono">{o.icono}</span>
        {o.cantidad > 1 && <span className="pi-objeto-cantidad">×{o.cantidad}</span>}
        {o.valor_visible && <span className="pi-objeto-valor">{o.valor_visible}</span>}
      </span>
    ))}
  </div>
);

const BalanzaLogica = ({ p }) => {
  const c = p.configuracion_balanza || {};
  return (
    <>
      <Enunciado texto={p.pregunta} />
      <div className="pi-balanza">
        <div className="pi-balanza-platillos">
          <Platillo objetos={c.lado_izquierdo || []} />
          <Platillo objetos={c.lado_derecho || []} />
        </div>
        <div className="pi-balanza-barra" />
        <div className="pi-balanza-base" />
      </div>
      <Renglon etiqueta="Respuesta:" />
    </>
  );
};

const PalabraDelDia = ({ p }) => {
  const palabra = String(p.palabra || p.respuesta || '');
  return (
    <>
      <Enunciado texto={p.pregunta} />
      {p.pista && <p className="pi-nota">Pista: {p.pista}</p>}
      <p className="pi-letras-revueltas">
        Usa estas letras: {letrasRevueltas(palabra, p.id).map((l, i) => <span key={i} className="pi-ficha">{l}</span>)}
      </p>
      <div className="pi-casillas">
        {Array.from(palabra).map((_, i) => <span key={i} className="pi-cuadro pi-cuadro-grande" />)}
      </div>
    </>
  );
};

const RENDERIZADORES = {
  'opcion-multiple': OpcionMultiple,
  operaciones: Operaciones,
  criptoaritmetica: Criptoaritmetica,
  'navegacion-mapa': NavegacionMapa,
  'desarrollo-cubos': DesarrolloCubos,
  'balanza-logica': BalanzaLogica,
  'palabra-del-dia': PalabraDelDia,
};

const PreguntaImpresa = ({ problema, numero }) => {
  const Cuerpo = RENDERIZADORES[problema.tipo];
  return (
    <section className={`pregunta-impresa pi-${problema.tipo}`}>
      <div className="pi-numero">{numero}.</div>
      <div className="pi-cuerpo">
        {Cuerpo
          ? <Cuerpo p={problema} />
          : <p className="pi-no-imprimible">(pregunta no imprimible: {problema.tipo})</p>}
      </div>
    </section>
  );
};

export default PreguntaImpresa;
