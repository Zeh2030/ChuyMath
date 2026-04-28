import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import PageWrapper from '../components/layout/PageWrapper';
import Header from '../components/layout/Header';
import MateriaToggle from '../components/layout/MateriaToggle';
import './Boveda.css';

const Boveda = () => {
  const { currentUser } = useAuth();
  const { profile } = useProfile(currentUser?.uid);
  const [searchParams] = useSearchParams();
  const filtroFromUrl = searchParams.get('filtro');
  const [aventuras, setAventuras] = useState([]);
  const [simulacros, setSimulacros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState(filtroFromUrl || 'todos');
  const [tabActivo, setTabActivo] = useState(filtroFromUrl ? 'boveda' : 'accesos');
  const [filtroGrado, setFiltroGrado] = useState('todos');
  const [filtroNivel, setFiltroNivel] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  // Detect materia from URL filter
  const detectMateria = (f) => {
    if (!f || f === 'todos') return 'matematicas';
    // Subject-specific ids (piano-*, geografia-*) take priority over generic types
    if (f.startsWith('piano-') || f === 'identifica-nota') return 'piano';
    if (f.startsWith('geografia-') || f === 'explorador-mapa') return 'geografia';
    const englishTypes = ['word-bank', 'verb-conjugator', 'true-or-false', 'fill-the-gap',
      'tap-the-pairs', 'sentence-transform', 'image-picker', 'word-scramble',
      'listen-and-type', 'expediciones-en', 'mini-story'];
    const pianoTypes = ['piano-prompter', 'identifica-nota'];
    const cienciasTypes = ['experimento-guia'];
    const dibujoTypes = ['colorear', 'dibujo-guiado', 'dibujo-libre'];
    const geografiaTypes = ['explorador-mapa'];
    if (englishTypes.includes(f)) return 'ingles';
    if (pianoTypes.includes(f)) return 'piano';
    if (cienciasTypes.includes(f)) return 'ciencias';
    if (dibujoTypes.includes(f)) return 'dibujo';
    if (geografiaTypes.includes(f)) return 'geografia';
    return 'matematicas';
  };
  const [materia, setMateria] = useState(detectMateria(filtroFromUrl));

  // Definir tipos de juegos disponibles
  const tiposJuegos = [
    // Matemáticas
    { id: 'aventuras', emoji: '🎯', nombre: 'Aventuras Diarias', tipo: 'aventura', descripcion: 'Aventuras diarias', materia: 'matematicas' },
    { id: 'expediciones', emoji: '🚀', nombre: 'Expediciones', tipo: 'expedicion', descripcion: 'Viajes temáticos', materia: 'matematicas' },
    { id: 'simulacros', emoji: '🏆', nombre: 'Simulacros', tipo: 'simulacro', descripcion: 'Exámenes completos', materia: 'matematicas' },
    { id: 'numberblocks-constructor', emoji: '🧱', nombre: 'Numberblocks', tipo: 'numberblocks-constructor', descripcion: 'Construye rectángulos con bloques', materia: 'matematicas' },
    { id: 'area-constructor', emoji: '📐', nombre: 'Área Constructor', tipo: 'area-constructor', descripcion: 'Mide y calcula áreas', materia: 'matematicas' },
    { id: 'fraccion-explorer', emoji: '🍕', nombre: 'Fracciones', tipo: 'fraccion-explorer', descripcion: 'Aprende fracciones con pizza y chocolate', materia: 'matematicas' },
    { id: 'angulo-explorer', emoji: '📏', nombre: 'Ángulos', tipo: 'angulo-explorer', descripcion: 'Clasifica ángulos y resuelve triángulos', materia: 'matematicas' },
    { id: 'fraccion-operaciones', emoji: '🧮', nombre: 'Operaciones Fracciones', tipo: 'fraccion-operaciones', descripcion: 'Suma, resta, multiplica y divide fracciones', materia: 'matematicas' },
    { id: 'kakooma', emoji: '🧠', nombre: 'Kakooma', tipo: 'kakooma', descripcion: 'Cálculo mental visual', materia: 'matematicas' },
    { id: 'conteo-figuras', emoji: '💠', nombre: 'Conteo de Figuras', tipo: 'conteo-figuras', descripcion: 'Cuenta figuras geométricas', materia: 'matematicas' },
    { id: 'secuencias', emoji: '🔢', nombre: 'Secuencias', tipo: 'secuencia', descripcion: 'Patrones y secuencias', materia: 'matematicas' },
    { id: 'tabla-doble-entrada', emoji: '🔎', nombre: 'Juega al Detective', tipo: 'tabla-doble-entrada', descripcion: 'Resuelve misterios con lógica', materia: 'matematicas' },
    { id: 'operaciones', emoji: '➕', nombre: 'Operaciones', tipo: 'operaciones', descripcion: 'Matemáticas', materia: 'matematicas' },
    { id: 'criptoaritmetica', emoji: '🍇', nombre: 'Criptoaritmetica', tipo: 'criptoaritmetica', descripcion: 'Acertijos matemáticos', materia: 'matematicas' },
    { id: 'balanza-logica', emoji: '⚖️', nombre: 'Balanza Lógica', tipo: 'balanza-logica', descripcion: 'Lógica y equilibrio', materia: 'matematicas' },
    { id: 'desarrollo-cubos', emoji: '🧊', nombre: 'Desarrollo de Cubos', tipo: 'desarrollo-cubos', descripcion: 'Espacios 3D', materia: 'matematicas' },
    { id: 'palabra-del-dia', emoji: '📝', nombre: 'Palabra del Día', tipo: 'palabra-del-dia', descripcion: 'Vocabulario', materia: 'matematicas' },
    // English
    { id: 'word-bank', emoji: '📝', nombre: 'Word Bank', tipo: 'word-bank', descripcion: 'Build sentences in English', materia: 'ingles' },
    { id: 'verb-conjugator', emoji: '🔤', nombre: 'Conjugation', tipo: 'verb-conjugator', descripcion: 'Conjugate verbs in English', materia: 'ingles' },
    { id: 'true-or-false', emoji: '✅', nombre: 'True or False', tipo: 'true-or-false', descripcion: 'Is this sentence correct?', materia: 'ingles' },
    { id: 'fill-the-gap', emoji: '🔲', nombre: 'Fill the Gap', tipo: 'fill-the-gap', descripcion: 'Complete the missing word', materia: 'ingles' },
    { id: 'tap-the-pairs', emoji: '🔗', nombre: 'Tap the Pairs', tipo: 'tap-the-pairs', descripcion: 'Match English and Spanish', materia: 'ingles' },
    { id: 'sentence-transform', emoji: '🔄', nombre: 'Transform', tipo: 'sentence-transform', descripcion: 'Change sentence form', materia: 'ingles' },
    { id: 'image-picker', emoji: '🖼️', nombre: 'Image Picker', tipo: 'image-picker', descripcion: 'Pick the correct image', materia: 'ingles' },
    { id: 'word-scramble', emoji: '🔠', nombre: 'Scramble', tipo: 'word-scramble', descripcion: 'Unscramble the letters', materia: 'ingles' },
    { id: 'listen-and-type', emoji: '👂', nombre: 'Listen & Type', tipo: 'listen-and-type', descripcion: 'Listen and write', materia: 'ingles' },
    { id: 'expediciones-en', emoji: '🗺️', nombre: 'Expeditions', tipo: 'expedicion-ingles', descripcion: 'Themed English journeys', materia: 'ingles' },
    { id: 'mini-story', emoji: '📖', nombre: 'Mini Stories', tipo: 'mini-story', descripcion: 'Read stories and answer questions', materia: 'ingles' },
    // Piano
    { id: 'piano-prompter', emoji: '🎹', nombre: 'Teleprompter', tipo: 'piano-prompter', descripcion: 'Practica lectura de partituras', materia: 'piano' },
    { id: 'identifica-nota', emoji: '🎼', nombre: 'Identifica la Nota', tipo: 'identifica-nota', descripcion: 'Aprende a leer notas en el pentagrama', materia: 'piano' },
    { id: 'piano-opcion-multiple', emoji: '❓', nombre: 'Teoria Musical', tipo: 'opcion-multiple', descripcion: 'Preguntas sobre teoria musical', materia: 'piano' },
    { id: 'piano-tap-the-pairs', emoji: '🔗', nombre: 'Empareja', tipo: 'tap-the-pairs', descripcion: 'Empareja conceptos musicales', materia: 'piano' },
    { id: 'piano-image-picker', emoji: '🎵', nombre: 'Simbolos Musicales', tipo: 'image-picker', descripcion: 'Identifica simbolos del lenguaje musical', materia: 'piano' },
    { id: 'piano-true-or-false', emoji: '✅', nombre: 'Verdadero o Falso', tipo: 'true-or-false', descripcion: 'Conceptos musicales verdaderos o falsos', materia: 'piano' },
    { id: 'piano-fill-the-gap', emoji: '🔲', nombre: 'Completa la Frase', tipo: 'fill-the-gap', descripcion: 'Completa frases sobre musica', materia: 'piano' },
    { id: 'piano-mini-story', emoji: '📖', nombre: 'Compositores', tipo: 'mini-story', descripcion: 'Historias de grandes compositores', materia: 'piano' },
    // Ciencias
    { id: 'experimento-guia', emoji: '🧪', nombre: 'Experimentos', tipo: 'experimento-guia', descripcion: 'Experimentos caseros paso a paso', materia: 'ciencias' },
    // Dibujo
    { id: 'colorear', emoji: '🖍️', nombre: 'Colorear', tipo: 'colorear', descripcion: 'Colorea figuras con tu paleta', materia: 'dibujo' },
    { id: 'dibujo-guiado', emoji: '✏️', nombre: 'Dibujo Guiado', tipo: 'dibujo-guiado', descripcion: 'Aprende a dibujar paso a paso', materia: 'dibujo' },
    { id: 'dibujo-libre', emoji: '🎨', nombre: 'Dibujo Libre', tipo: 'dibujo-libre', descripcion: 'Dibuja lo que quieras', materia: 'dibujo' },
    // Geografia
    { id: 'explorador-mapa', emoji: '🗺️', nombre: 'Explora el Mapa', tipo: 'explorador-mapa', descripcion: 'Encuentra paises en mapas reales', materia: 'geografia' },
    { id: 'geografia-image-picker', emoji: '🏞️', nombre: 'Banderas y Mapas', tipo: 'image-picker', descripcion: 'Identifica banderas y monumentos del mundo', materia: 'geografia' },
    { id: 'geografia-tap-the-pairs', emoji: '🔗', nombre: 'Empareja Pais-Capital', tipo: 'tap-the-pairs', descripcion: 'Empareja paises con sus capitales y banderas', materia: 'geografia' },
    { id: 'geografia-fill-the-gap', emoji: '🔲', nombre: 'Completa Capitales', tipo: 'fill-the-gap', descripcion: 'Completa frases sobre paises y capitales', materia: 'geografia' },
    { id: 'geografia-true-or-false', emoji: '✅', nombre: 'Datos Verdadero/Falso', tipo: 'true-or-false', descripcion: 'Datos curiosos sobre el mundo', materia: 'geografia' },
    { id: 'geografia-opcion-multiple', emoji: '❓', nombre: 'Preguntas del Mundo', tipo: 'opcion-multiple', descripcion: 'Preguntas sobre geografia', materia: 'geografia' },
    { id: 'geografia-word-scramble', emoji: '🔠', nombre: 'Adivina el Pais', tipo: 'word-scramble', descripcion: 'Desordena letras de paises y capitales', materia: 'geografia' },
    { id: 'geografia-mini-story', emoji: '📖', nombre: 'Historias del Mundo', tipo: 'mini-story', descripcion: 'Historias culturales de paises y civilizaciones', materia: 'geografia' },
  ];

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

        setAventuras([...listaAventuras, ...listaIngles, ...listaPiano, ...listaCiencias, ...listaDibujo, ...listaGeografia]);
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

  // Helper: filtrar por materia (sin campo = matematicas)
  const filterMateria = (item) => {
    if (materia === 'matematicas') return !item.materia || item.materia === 'matematicas';
    if (materia === 'piano') return item.materia === 'piano';
    if (materia === 'ciencias') return item.materia === 'ciencias';
    if (materia === 'dibujo') return item.materia === 'dibujo';
    if (materia === 'geografia') return item.materia === 'geografia';
    return item.materia === materia;
  };

  const nivelesDisponibles = React.useMemo(() => {
    const niveles = new Set();
    aventuras.filter(filterMateria).forEach(a => {
      if (a.nivel) niveles.add(a.nivel);
    });
    return Array.from(niveles).sort();
  }, [aventuras, materia]);

  // Grupos de nivel (A0, A1, P1, etc.)
  const gruposNivel = React.useMemo(() => {
    const grupos = new Set();
    nivelesDisponibles.forEach(n => {
      const grupo = n.replace(/-\d+$/, ''); // A1-09 → A1
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
    <PageWrapper>
      <Header title={profile?.nombre ? `Centro de Exploración de ${profile.nombre}` : 'Centro de Exploración'} 
              subtitle={`¡Bienvenido al mundo del aprendizaje, ${profile?.nombre || 'súper explorador'}!`} />
      
      <div className="boveda-container">
        {/* Header Personalizado */}
        {profile && (
          <div className="boveda-header-personalizado">
            <div className="boveda-avatar">
              {profile.avatar || '😁'}
            </div>
            <div className="boveda-info">
              <h1>{profile.nombre}</h1>
              <p>Explora y domina todos los tipos de desafíos</p>
            </div>
          </div>
        )}

        {/* Materia toggle */}
        <MateriaToggle materia={materia} onChange={(m) => { setMateria(m); setFiltro('todos'); }} />

        {/* Tabs para móvil */}
        <div className="boveda-tabs">
          <button 
            className={`tab-btn ${tabActivo === 'accesos' ? 'active' : ''}`}
            onClick={() => setTabActivo('accesos')}
          >
            ⚡ Accesos Rápidos
          </button>
          <button 
            className={`tab-btn ${tabActivo === 'boveda' ? 'active' : ''}`}
            onClick={() => setTabActivo('boveda')}
          >
            📚 Mi Bóveda
          </button>
        </div>

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
                  {(materia === 'ingles' || materia === 'piano' || materia === 'ciencias' || materia === 'dibujo' || materia === 'geografia') && nivelesDisponibles.length > 1 && (
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
                              onClick={() => setFiltroNivel(filtroNivel === nivel ? filtroNivel.replace(/-\d+$/, '') : nivel)}
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
                      const esAventura = item.coleccion === 'aventuras' || item.coleccion === 'ingles' || item.coleccion === 'piano' || item.coleccion === 'ciencias' || item.coleccion === 'dibujo' || item.coleccion === 'geografia';
                      const ruta = esAventura ? `/aventura/${item.id}` : `/simulacro/${item.id}`;
                      
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
    </PageWrapper>
  );
};

export default Boveda;


