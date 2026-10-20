import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/layout/PageWrapper';
import Header from '../components/layout/Header';
import { planNoche, semana, proximosEventos, fechaNocheActual, direccion } from '../utils/cielo.js';
import { cargarClima, climaDeVentana } from '../utils/clima.js';
import { TELESCOPIO, etiquetaOcular } from '../data/observatorio/equipo.js';
import { SITIO } from '../data/observatorio/sitio.js';
import './Observatorio.css';

/**
 * Observatorio — planificador "¿Qué vemos hoy?" para el telescopio de la familia.
 * Fase 2 de _ciencias/PROGRAMA_CIENCIAS.md §Observatorio. Es una herramienta, no una
 * misión: calcula el cielo de Jerez en el navegador (astronomy-engine, ver
 * utils/cielo.js) y le suma la nubosidad de Open-Meteo (utils/clima.js).
 * Página lazy: la librería de efemérides no entra al bundle principal.
 */

const CLAVE_ROJO = 'chuymath_observatorio_rojo';

const hora = (d) => (d ? d.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' }) : '—');
const fechaLarga = (d) => d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
const fechaCorta = (d) => d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' });
const fechaEvento = (d) => d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
const mismoDia = (a, b) => a.toDateString() === b.toDateString();

const leerRojo = () => {
  try {
    return localStorage.getItem(CLAVE_ROJO) === '1';
  } catch {
    return false;
  }
};

const Observatorio = () => {
  const navigate = useNavigate();
  const hoy = useMemo(() => fechaNocheActual(), []);
  const [diaSel, setDiaSel] = useState(hoy);
  const [rojo, setRojo] = useState(leerRojo);
  const [clima, setClima] = useState(null);
  const [climaFallo, setClimaFallo] = useState(false);

  useEffect(() => {
    let vivo = true;
    cargarClima()
      .then((d) => { if (vivo) setClima(d); })
      .catch(() => { if (vivo) setClimaFallo(true); });
    return () => { vivo = false; };
  }, []);

  const cambiarRojo = () => {
    setRojo((r) => {
      try { localStorage.setItem(CLAVE_ROJO, r ? '0' : '1'); } catch { /* solo es comodidad */ }
      return !r;
    });
  };

  const eventos = useMemo(() => proximosEventos(hoy, 60), [hoy]);
  const dias = useMemo(() => semana(hoy, 7, eventos), [hoy, eventos]);
  const plan = useMemo(() => planNoche(diaSel, eventos), [diaSel, eventos]);

  const v = plan.ventanas;
  const climaNoche = climaDeVentana(clima, v.familiar.inicio, v.familiar.fin);
  const top = plan.objetos.slice(0, 3);
  const resto = plan.objetos.slice(3);
  const esHoy = mismoDia(diaSel, hoy);

  const contenido = (
    <div className={`obs ${rojo ? 'obs-rojo' : ''}`}>
      <div className="obs-barra">
        <button type="button" className="obs-boton" onClick={() => navigate('/dashboard')}>← Volver</button>
        <button type="button" className="obs-boton" onClick={cambiarRojo} aria-pressed={rojo}>
          {rojo ? '☀️ Modo normal' : '🔴 Modo noche'}
        </button>
      </div>

      <section className="obs-tarjeta obs-noche">
        <p className="obs-etiqueta">{esHoy ? 'Esta noche' : 'La noche del'}</p>
        <h2 className="obs-titulo">{fechaLarga(diaSel)}</h2>
        <p className="obs-sub">
          {v.nocheEntera
            ? `Fin de semana: horario de ${hora(v.familiar.inicio)} a ${hora(v.familiar.fin)}, y toda la noche si hay algo excepcional.`
            : `Horario de entre semana: de ${hora(v.familiar.inicio)} a ${hora(v.familiar.fin)}`}
        </p>

        <div className="obs-datos">
          <div className="obs-dato">
            <span className="obs-dato-icono">{climaNoche ? climaNoche.semaforo.emoji : '⛅'}</span>
            <div>
              <strong>{climaNoche ? climaNoche.semaforo.texto : 'Cielo'}</strong>
              <span>
                {climaNoche
                  ? `${climaNoche.nubes}% de nubes en el horario`
                  : climaFallo ? 'Sin pronóstico (¿sin internet?)' : clima ? 'Aún no hay pronóstico para ese día' : 'Cargando pronóstico…'}
              </span>
            </div>
          </div>
          <div className="obs-dato">
            <span className="obs-dato-icono">{plan.luna.emoji}</span>
            <div>
              <strong>{plan.luna.nombre} · {Math.round(plan.luna.ilum * 100)}%</strong>
              <span>Sale {hora(plan.salidaLuna)} · se mete {hora(plan.puestaLuna)}</span>
            </div>
          </div>
          <div className="obs-dato">
            <span className="obs-dato-icono">🌆</span>
            <div>
              <strong>Oscuro desde {hora(v.oscuro)}</strong>
              <span>El Sol se mete {hora(v.puesta)}</span>
            </div>
          </div>
        </div>

        {climaNoche?.avisos.map((a) => <p key={a} className="obs-aviso">⚠️ {a}</p>)}
      </section>

      {plan.eventos.length > 0 && (
        <section className="obs-tarjeta obs-eventos-noche">
          {plan.eventos.map((e) => {
            const desvelada = e.excepcional && e.fueraDeHorario;
            return (
              <div key={e.id} className={`obs-evento ${e.excepcional ? 'obs-evento-especial' : ''}`}>
                <span className="obs-evento-emoji">{e.emoji}</span>
                <div>
                  <strong>
                    {desvelada && v.nocheEntera && '🌟 ¡Vale la desvelada! '}
                    {e.titulo} · {hora(e.t)}
                  </strong>
                  <p>{e.texto}</p>
                  {desvelada && !v.nocheEntera && (
                    <p className="obs-nota">Es entre semana y cae fuera del horario: ustedes deciden.</p>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}

      <section className="obs-seccion">
        <h3 className="obs-seccion-titulo">🔭 Lo mejor para ver</h3>
        {top.length === 0 && (
          <p className="obs-vacio">En el horario de esta noche no hay nada que valga la pena. ¡Revisa otra noche de la semana!</p>
        )}
        {top.map((r, i) => (
          <article key={r.obj.id} className="obs-objeto">
            <div className="obs-objeto-cabeza">
              <span className="obs-objeto-num">{i + 1}</span>
              <span className="obs-objeto-emoji">{r.obj.emoji}</span>
              <div>
                <h4>{r.obj.nombre}</h4>
                <p className="obs-objeto-cuando">
                  Mejor a las {hora(r.mejor.t)} · {direccion(r.mejor.alt, r.mejor.az)}
                </p>
              </div>
            </div>
            <p className="obs-objeto-ocular">
              Ocular: {etiquetaOcular(r.ocular.mm)}{r.ocular.filtro ? ' con el filtro lunar' : ''}
            </p>
            {r.detalle && <p className="obs-objeto-detalle">{r.detalle}</p>}
            <p className="obs-objeto-texto"><strong>Qué vas a ver:</strong> {r.obj.queVeras}</p>
            {(r.obj.leccion || r.obj.mision) && (
              <div className="obs-objeto-botones">
                {r.obj.leccion && (
                  <button type="button" className="obs-boton" onClick={() => navigate(`/aventura/${r.obj.leccion}`)}>
                    🚀 Antes de salir
                  </button>
                )}
                {r.obj.mision && (
                  <button type="button" className="obs-boton obs-boton-mision" onClick={() => navigate(`/aventura/${r.obj.mision}`)}>
                    📋 Misión
                  </button>
                )}
              </div>
            )}
          </article>
        ))}

        {resto.length > 0 && (
          <details className="obs-mas">
            <summary>También se ve esta noche ({resto.length})</summary>
            <ul>
              {resto.map((r) => (
                <li key={r.obj.id}>
                  <span>{r.obj.emoji} <strong>{r.obj.nombre}</strong></span>
                  <span>{hora(r.mejor.t)} · {direccion(r.mejor.alt, r.mejor.az)} · {r.ocular.mm} mm</span>
                </li>
              ))}
            </ul>
          </details>
        )}
        {plan.apagadosPorLuna.length > 0 && (
          <p className="obs-nota">
            🌕 La Luna apaga esta noche: {plan.apagadosPorLuna.map((o) => o.nombre).join(', ')}.
          </p>
        )}
      </section>

      <section className="obs-seccion">
        <h3 className="obs-seccion-titulo">📅 Esta semana</h3>
        <div className="obs-semana">
          {dias.map((n) => {
            const c = climaDeVentana(clima, n.ventanas.familiar.inicio, n.ventanas.familiar.fin);
            const sel = mismoDia(n.dia, diaSel);
            return (
              <button
                key={n.dia.toISOString()}
                type="button"
                className={`obs-dia ${sel ? 'obs-dia-sel' : ''} ${n.ventanas.nocheEntera ? 'obs-dia-finde' : ''}`}
                onClick={() => setDiaSel(n.dia)}
                aria-pressed={sel}
              >
                <span className="obs-dia-fecha">{mismoDia(n.dia, hoy) ? 'Hoy' : fechaCorta(n.dia)}</span>
                <span className="obs-dia-luna">{n.luna.emoji}</span>
                <span className="obs-dia-clima">{c ? c.semaforo.emoji : '·'}</span>
                <span className="obs-dia-total">{n.total} objetos</span>
                {n.excepcional && <span className="obs-dia-estrella">🌟</span>}
              </button>
            );
          })}
        </div>
      </section>

      <section className="obs-seccion">
        <h3 className="obs-seccion-titulo">🗓️ Próximamente</h3>
        <ul className="obs-proximos">
          {eventos.filter((e) => e.t >= new Date()).slice(0, 8).map((e) => (
            <li key={e.id} className={e.excepcional ? 'obs-evento-especial' : ''}>
              <span className="obs-evento-emoji">{e.emoji}</span>
              <div>
                <strong>{e.titulo}</strong>
                <span className="obs-proximo-fecha">{fechaEvento(e.t)} · {hora(e.t)}</span>
                <p>{e.texto}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <footer className="obs-pie">
        <p className="obs-sol">☀️🚫 Nunca apuntes el telescopio al Sol. El filtro de la Luna NO sirve para el Sol.</p>
        <p>{TELESCOPIO.nombre} · {SITIO.nombre} · Pronóstico: Open-Meteo.com</p>
      </footer>
    </div>
  );

  // En modo noche la página tapa todo (fondo, encabezado y escenografía del tema):
  // nada de luz blanca que arruine los ojos acostumbrados a la oscuridad.
  if (rojo) return <div className="obs-pantalla-roja">{contenido}</div>;

  return (
    <PageWrapper>
      <Header title="🔭 Observatorio" subtitle="¿Qué vemos hoy?" />
      {contenido}
    </PageWrapper>
  );
};

export default Observatorio;
