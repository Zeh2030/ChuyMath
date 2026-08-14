import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import TabBar from '../layout/TabBar';
import { tiposJuegos } from '../../data/tiposJuegos';
import { matchesMateria } from '../../utils/materiaContent';
import './ExplorarTab.css';

const ExplorarTab = ({ profile, materia, initialFiltro }) => {
  const [aventuras, setAventuras] = useState([]);
  const [simulacros, setSimulacros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState(initialFiltro || 'todos');
  const [tabActivo, setTabActivo] = useState(initialFiltro ? 'boveda' : 'accesos');
  const [filtroGrado, setFiltroGrado] = useState('todos');
  const [filtroNivel, setFiltroNivel] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  // Al cambiar de materia (toggle vive en el shell) resetear filtros locales,
  // igual que hacía Boveda con su onChange inline. El guard con ref evita que
  // esto se dispare en el primer render y pise un initialFiltro recién llegado.
  const prevMateriaRef = useRef(materia);
  useEffect(() => {
    if (prevMateriaRef.current !== materia) {
      setFiltro('todos');
      setFiltroNivel('todos');
      setBusqueda('');
      prevMateriaRef.current = materia;
    }
  }, [materia]);

  const tiposJuegosFiltrados = tiposJuegos.filter(t => t.materia === materia);

  // SIMPLIFICADO: Solo cargar de 'aventuras' y 'simulacros'
  useEffect(() => {
    const cargarContenido = async () => {
      try {
        setLoading(true);

        // Cargar Aventuras
        const aventurasRef = collection(db, 'aventuras');
        const aventurasSnapshot = await getDocs(aventurasRef);
        const listaAventuras = aventurasSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Usar el tipo del documento si existe, sino 'aventura' como fallback
            tipo: data.tipo || 'aventura',
            coleccion: 'aventuras' // Para saber la ruta correcta
          };
        }).sort((a, b) => b.id.localeCompare(a.id));

        // Cargar Simulacros (TODO el contenido está aquí, diferenciado por campo 'tipo')
        const simulacrosRef = collection(db, 'simulacros');
        const simulacrosSnapshot = await getDocs(simulacrosRef);
        const listaSimulacros = simulacrosSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            tipo: data.tipo || 'simulacro',
            ...data,
            coleccion: 'simulacros' // Para saber la ruta correcta
          };
        });

        // Cargar Inglés (misma estructura que aventuras, colección separada)
        const inglesRef = collection(db, 'ingles');
        const inglesSnapshot = await getDocs(inglesRef);
        const listaIngles = inglesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            tipo: data.tipo || 'word-bank',
            materia: 'ingles',
            coleccion: 'ingles'
          };
        }).sort((a, b) => b.id.localeCompare(a.id));

        // Cargar Piano (colección separada)
        const pianoRef = collection(db, 'piano');
        const pianoSnapshot = await getDocs(pianoRef);
        const listaPiano = pianoSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            tipo: data.tipo || 'piano-prompter',
            materia: 'piano',
            coleccion: 'piano'
          };
        }).sort((a, b) => a.id.localeCompare(b.id));

        // Cargar Ciencias (colección separada)
        const cienciasRef = collection(db, 'ciencias');
        const cienciasSnapshot = await getDocs(cienciasRef);
        const listaCiencias = cienciasSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            tipo: data.tipo || 'experimento-guia',
            materia: 'ciencias',
            coleccion: 'ciencias'
          };
        }).sort((a, b) => a.id.localeCompare(b.id));

        // Cargar Dibujo (coleccion separada)
        const dibujoRef = collection(db, 'dibujo');
        const dibujoSnapshot = await getDocs(dibujoRef);
        const listaDibujo = dibujoSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            tipo: data.tipo || 'dibujo-libre',
            materia: 'dibujo',
            coleccion: 'dibujo'
          };
        }).sort((a, b) => a.id.localeCompare(b.id));

        // Cargar Geografia (coleccion separada)
        const geografiaRef = collection(db, 'geografia');
        const geografiaSnapshot = await getDocs(geografiaRef);
        const listaGeografia = geografiaSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            tipo: data.tipo || 'explorador-mapa',
            materia: 'geografia',
            coleccion: 'geografia'
          };
        }).sort((a, b) => a.id.localeCompare(b.id));

        // Cargar Letras (coleccion separada)
        const letrasRef = collection(db, 'letras');
        const letrasSnapshot = await getDocs(letrasRef);
        const listaLetras = letrasSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            tipo: data.tipo || 'abecedario',
            materia: 'letras',
            coleccion: 'letras'
          };
        }).sort((a, b) => a.id.localeCompare(b.id));

        setAventuras([...listaAventuras, ...listaIngles, ...listaPiano, ...listaCiencias, ...listaDibujo, ...listaGeografia, ...listaLetras]);
        setSimulacros(listaSimulacros);
      } catch (err) {
        console.error("Error cargando la bóveda:", err);
        setError("No se pudo cargar el contenido de la bóveda.");
      } finally {
        setLoading(false);
      }
    };

    cargarContenido();
  }, []);

  // Formatear fecha para que sea legible
  const formatearFecha = (id) => {
    // Intentar parsear si es fecha ISO
    const fecha = new Date(id);

    if (isNaN(fecha.getTime())) {
      // Si no es fecha válida (ej: "simulador-matematicas-1"), retornar el ID limpio
      return id.replace(/-/g, ' ').replace('simulador', '').trim();
    }

    const dias = Math.floor((Date.now() - fecha.getTime()) / (1000*60*60*24));
    // La fecha del ID marca el ORDEN del temario, no cuando se publico, asi que
    // el contenido preparado por delante tiene fecha futura. Sin este caso
    // salia "Hace -19 dias".
    if (dias < 0) return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Ayer';
    if (dias < 7) return `Hace ${dias} días`;

    return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
  };

  // Obtener progreso del usuario para un item
  const getProgreso = (id, tipo) => {
    if (!profile) return null;

    if (tipo === 'simulacro' && profile.simulacros) {
      const resultados = profile.simulacros.filter(s => s.simulacroId === id);
      if (resultados.length === 0) return null;
      // Retornar el mejor puntaje
      return resultados.reduce((prev, current) => (prev.porcentaje > current.porcentaje) ? prev : current);
    }

    // Aventuras / expediciones: progreso simple iniciado/completado
    if (profile.aventurasProgreso) {
      const progresoAventura = profile.aventurasProgreso[id];
      if (progresoAventura) return progresoAventura;
    }

    return null;
  };

  const gradosDisponibles = React.useMemo(() => {
    const grados = new Set();
    simulacros.forEach(s => {
      if (s.grado !== undefined && s.grado !== null) {
        grados.add(s.grado);
      }
    });
    return Array.from(grados).sort((a, b) => a - b);
  }, [simulacros]);

  // Filtrar por materia (compartido con useAventuraDelDia vía utils/materiaContent)
  const filterMateria = (item) => matchesMateria(item, materia);

  const nivelesDisponibles = React.useMemo(() => {
    const niveles = new Set();
    const tipoSel = tiposJuegos.find(t => t.id === filtro);
    aventuras.filter(filterMateria).forEach(a => {
      // Si hay un tipo seleccionado (ej. identifica-nota), cuenta solo los niveles
      // de ESE tipo, para que los chips coincidan con las tarjetas mostradas.
      if (tipoSel) {
        const tipoObjetivo = tipoSel.tipo === 'aventura' ? 'aventura' : tipoSel.tipo;
        if (a.tipo !== tipoObjetivo) return;
      }
      if (a.nivel) niveles.add(a.nivel);
    });
    return Array.from(niveles).sort();
  }, [aventuras, materia, filtro]);

  // Grupos de nivel (A0, A1, P1, etc.)
  const gruposNivel = React.useMemo(() => {
    const grupos = new Set();
    nivelesDisponibles.forEach(n => {
      const grupo = n.replace(/-T?\d+$/, ''); // A1-09 → A1 ; P1-T04 → P1
      grupos.add(grupo);
    });
    return Array.from(grupos).sort();
  }, [nivelesDisponibles]);

  // Temas disponibles agrupados
  const temasAgrupados = React.useMemo(() => {
    const temas = {};
    aventuras.filter(filterMateria).forEach(a => {
      const tema = a.tema || a.nivel || 'sin-tema';
      const nivel = a.nivel || '';
      const key = `${nivel}_${tema}`;
      if (!temas[key]) {
        temas[key] = {
          tema: tema,
          nivel: nivel,
          label: a.titulo?.replace(/^(Word Bank|Fill the Gap|Image Picker|Tap the Pairs|Word Scramble|Listen and Type|Verb Conjugator|True or False|Sentence Transform|Mini Story|Expedición):?\s*/i, '').split(':')[0] || tema,
          items: [],
        };
      }
      temas[key].items.push(a);
    });
    // Agrupar por tema (no por key), merge items del mismo tema
    const merged = {};
    Object.values(temas).forEach(t => {
      const temaKey = `${t.nivel}_${t.tema}`;
      if (!merged[temaKey]) {
        merged[temaKey] = { ...t };
      } else {
        merged[temaKey].items.push(...t.items);
      }
    });
    return Object.values(merged)
      .filter(t => t.items.length > 0)
      .sort((a, b) => a.nivel.localeCompare(b.nivel));
  }, [aventuras, materia]);

  // Filtrar por nivel (soporta grupo como "A0" o específico como "A1-09")
  const matchNivel = (item) => {
    if (filtroNivel === 'todos') return true;
    if (!item.nivel) return false;
    // Si el filtro es un grupo (ej "A0"), match cualquier nivel que empiece con "A0"
    if (!filtroNivel.includes('-')) return item.nivel.startsWith(filtroNivel);
    return item.nivel === filtroNivel;
  };

  // Filtrar por búsqueda
  const matchBusqueda = (item) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (item.titulo || '').toLowerCase().includes(q) ||
           (item.tema || '').toLowerCase().includes(q) ||
           (item.nivel || '').toLowerCase().includes(q) ||
           (item.descripcion || '').toLowerCase().includes(q);
  };

  // Filtrar contenido
  const contenidoMostrar = () => {
    let items = [];

    const tipoEspecifico = tiposJuegos.find(t => t.id === filtro);
    if (tipoEspecifico) {
      if (tipoEspecifico.tipo === 'aventura') {
        items = aventuras
          .filter(filterMateria)
          .filter(a => a.tipo === 'aventura');
      } else {
        // filterMateria already restricts by current materia,
        // so generic types like 'true-or-false' won't mix english/piano
        const enAventuras = aventuras
          .filter(filterMateria)
          .filter(a => a.tipo === tipoEspecifico.tipo);
        const enSimulacros = simulacros
          .filter(filterMateria)
          .filter(s => s.tipo === tipoEspecifico.tipo)
          .filter(s => filtroGrado === 'todos' ? true : String(s.grado) === String(filtroGrado));
        items = [...enAventuras, ...enSimulacros];
      }
    } else if (filtro === 'todos') {
      items = [
        ...aventuras.filter(filterMateria),
        ...simulacros.filter(filterMateria).filter(s => filtroGrado === 'todos' ? true : String(s.grado) === String(filtroGrado))
      ];
    }

    return items.filter(matchNivel).filter(matchBusqueda);
  };

  // Contar contenido disponible
  const contarPorTipo = (tipoId) => {
    const tipoData = tiposJuegos.find(t => t.id === tipoId);
    if (!tipoData) return 0;

    // Aventuras genéricas (sin tipo específico)
    if (tipoData.tipo === 'aventura') {
      return aventuras.filter(filterMateria).filter(a => a.tipo === 'aventura').length;
    }

    // Buscar en ambas colecciones por tipo específico
    const enAventuras = aventuras.filter(filterMateria).filter(a => a.tipo === tipoData.tipo).length;
    const enSimulacros = simulacros.filter(filterMateria).filter(s => s.tipo === tipoData.tipo).length;
    return enAventuras + enSimulacros;
  };

  return (
    <div className="boveda-container">
      <TabBar
        tabs={[
          { id: 'accesos', label: '⚡ Accesos Rápidos' },
          { id: 'boveda', label: '📚 Mi Bóveda' },
        ]}
        active={tabActivo}
        onChange={setTabActivo}
      />

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Abriendo el centro de exploración...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p>❌ {error}</p>
        </div>
      ) : (
        <>
          {/* SECCIÓN 1: ACCESOS RÁPIDOS */}
          {tabActivo === 'accesos' && (
            <section className="accesos-rapidos-section">
              <h2 className="section-title">⚡ Accesos Rápidos</h2>
              <div className="tipos-juegos-grid">
                {tiposJuegosFiltrados.map(tipo => {
                  const count = contarPorTipo(tipo.id);
                  return (
                    <button
                      key={tipo.id}
                      className={`tipo-juego-card ${count === 0 ? 'sin-contenido' : ''}`}
                      disabled={count === 0}
                      title={count === 0 ? 'No hay contenido disponible' : tipo.descripcion}
                      onClick={() => {
                        if (count > 0) {
                          setTabActivo('boveda');
                          // Establecer filtro al tipo específico (secuencia, operaciones, etc.)
                          setFiltro(tipo.id);
                        }
                      }}
                    >
                      <div className="tipo-emoji">{tipo.emoji}</div>
                      <div className="tipo-nombre">{tipo.nombre}</div>
                      {count > 0 && <div className="tipo-count">{count}</div>}
                      {count === 0 && <div className="tipo-bloqueado">🔒</div>}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* SECCIÓN 2: MI BÓVEDA (Histórico) */}
          {tabActivo === 'boveda' && (
            <section className="mi-boveda-section">
              {/* Filter bar: tipo + nivel + búsqueda */}
              <div className="boveda-filter-bar">
                <div className="boveda-filter-row">
                  {filtro !== 'todos' ? (
                    <span className="boveda-filter-chip active">
                      {(() => {
                        const tipoData = tiposJuegos.find(t => t.id === filtro);
                        return tipoData ? `${tipoData.emoji} ${tipoData.nombre}` : filtro;
                      })()}
                      <button className="boveda-filter-clear" onClick={() => setFiltro('todos')}>✕</button>
                    </span>
                  ) : (
                    <span className="boveda-filter-chip all">
                      📚 Todo
                    </span>
                  )}
                  <span className="boveda-filter-count">
                    {contenidoMostrar().length} {contenidoMostrar().length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                {/* Level filter chips */}
                {(materia === 'ingles' || materia === 'piano' || materia === 'ciencias' || materia === 'dibujo' || materia === 'geografia' || materia === 'letras') && nivelesDisponibles.length > 1 && (
                  <div className="boveda-nivel-chips">
                    <button
                      className={`nivel-chip ${filtroNivel === 'todos' ? 'active' : ''}`}
                      onClick={() => setFiltroNivel('todos')}
                    >
                      Todos
                    </button>
                    {gruposNivel.map(grupo => (
                      <button
                        key={grupo}
                        className={`nivel-chip nivel-grupo ${filtroNivel === grupo ? 'active' : ''}`}
                        onClick={() => setFiltroNivel(filtroNivel === grupo ? 'todos' : grupo)}
                      >
                        {grupo}
                      </button>
                    ))}
                    {/* Specific levels when a group is selected */}
                    {filtroNivel !== 'todos' && !filtroNivel.includes('-') && (
                      nivelesDisponibles
                        .filter(n => n.startsWith(filtroNivel))
                        .map(nivel => (
                          <button
                            key={nivel}
                            className={`nivel-chip nivel-especifico ${filtroNivel === nivel ? 'active' : ''}`}
                            onClick={() => setFiltroNivel(filtroNivel === nivel ? filtroNivel.replace(/-T?\d+$/, '') : nivel)}
                          >
                            {nivel}
                          </button>
                        ))
                    )}
                  </div>
                )}

                {/* Search */}
                <div className="boveda-search">
                  <input
                    type="text"
                    placeholder="Buscar por tema, nivel o título..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="boveda-search-input"
                  />
                  {busqueda && (
                    <button className="boveda-search-clear" onClick={() => setBusqueda('')}>✕</button>
                  )}
                </div>
              </div>

              {/* Contenido */}
              <div className="contenido-grid">
                {contenidoMostrar().length === 0 ? (
                  <div className="vacio-mensaje">
                    <p>📭 No se encontró contenido en esta sección.</p>
                    {filtro !== 'todos' && (
                      <button className="btn-recomendacion" onClick={() => setFiltro('todos')}>
                        ✨ Ver todo el contenido disponible
                      </button>
                    )}
                  </div>
                ) : (
                  contenidoMostrar().map((item, index) => {
                    const progreso = getProgreso(item.id, item.tipo);

                    // Determinar la ruta basándose en la colección de origen
                    const esAventura = item.coleccion === 'aventuras' || item.coleccion === 'ingles' || item.coleccion === 'piano' || item.coleccion === 'ciencias' || item.coleccion === 'dibujo' || item.coleccion === 'geografia' || item.coleccion === 'letras';
                    const rutaBase = esAventura ? `/aventura/${item.id}` : `/simulacro/${item.id}`;
                    // Si viene de un tipo de juego específico (no "todos"), lo llevamos en la URL
                    // para que el botón "Volver" adentro del juego regrese exactamente aquí.
                    const ruta = filtro !== 'todos' ? `${rutaBase}?from=${encodeURIComponent(filtro)}` : rutaBase;

                    // Obtener nombre del tipo para mostrar (considera materia para evitar colisiones)
                    const itemMateria = item.materia || 'matematicas';
                    const tipoData = tiposJuegos.find(t => t.tipo === item.tipo && t.materia === itemMateria)
                      || tiposJuegos.find(t => t.tipo === item.tipo);
                    const nombreTipo = tipoData ? tipoData.nombre : (esAventura ? 'Aventura' : 'Simulacro');
                    const emojiTipo = tipoData ? tipoData.emoji : (esAventura ? '🗺️' : '🎓');

                    return (
                      <Link
                        to={ruta}
                        key={`${item.id}-${index}`}
                        className={`tarjeta-contenido tipo-${item.tipo}`}
                      >
                        <div className="tarjeta-icono">
                          {emojiTipo}
                        </div>
                        <div className="tarjeta-info">
                          <span className="tarjeta-tipo">
                            {nombreTipo}
                          </span>
                          <h3 className="tarjeta-titulo">{item.titulo}</h3>
                          {item.descripcion && <p className="tarjeta-desc">{item.descripcion}</p>}
                          <span className="tarjeta-fecha">{formatearFecha(item.id)}</span>

                          {/* Badges de clasificación */}
                          <div className="tarjeta-badges-clasificacion">
                            {item.tipo === 'simulacro' && item.grado !== undefined && (
                              <span className="badge-info">🎓 {item.grado}°</span>
                            )}
                            {item.tipo !== 'simulacro' && item.nivel && (
                              <span className="badge-info">⭐ {item.nivel}</span>
                            )}
                          </div>

                          {/* Progreso Visual */}
                          {progreso && item.tipo === 'simulacro' && progreso.porcentaje !== undefined && (
                            <div className="tarjeta-progreso">
                              <span className={`badge-status ${progreso.porcentaje >= 70 ? 'bien' : ''}`}>
                                {progreso.porcentaje >= 70 ? '✅ Completado' : '🔄 En progreso'}
                              </span>
                              <span className="score-badge">{progreso.porcentaje}%</span>
                            </div>
                          )}

                          {progreso && item.tipo !== 'simulacro' && (
                            <div className="tarjeta-progreso">
                              <span className={`badge-status ${progreso.status === 'completado' ? 'bien' : ''}`}>
                                {progreso.status === 'completado' ? '✅ Completado' : '🔄 Iniciado'}
                              </span>
                              {progreso.vecesCompletado ? (
                                <span className="score-badge">{progreso.vecesCompletado}x</span>
                              ) : null}
                            </div>
                          )}
                        </div>
                        <div className="tarjeta-accion">
                          <span className="btn-abrir">Abrir →</span>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default ExplorarTab;
