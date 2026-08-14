import React, { useState } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useProfile } from '../hooks/useProfile.jsx';
import PageWrapper from '../components/layout/PageWrapper';
import Header from '../components/layout/Header';
import MateriaToggle from '../components/layout/MateriaToggle';
import TabBar from '../components/layout/TabBar';
import HoyTab from '../components/dashboard/HoyTab';
import ExplorarTab from '../components/dashboard/ExplorarTab';
import { resolveActiveTab } from '../utils/dashboardTabs';
import './Dashboard.shell.css';

// Detecta la materia a partir de un filtro de tipo de juego (ej. "identifica-nota" → piano),
// para sembrar el toggle de materia cuando se llega con un ?filtro= en la URL.
const detectMateria = (f) => {
  if (!f || f === 'todos') return 'matematicas';
  // Subject-specific ids (piano-*, geografia-*) take priority over generic types
  if (f.startsWith('piano-') || f === 'identifica-nota') return 'piano';
  if (f.startsWith('geografia-') || f === 'explorador-mapa') return 'geografia';
  if (f.startsWith('ciencias-') || f === 'sistema-solar') return 'ciencias';
  if (f.startsWith('letras-') || f === 'abecedario' || f === 'letra-quiz' || f === 'silabas') return 'letras';
  const englishTypes = ['word-bank', 'verb-conjugator', 'true-or-false', 'fill-the-gap',
    'tap-the-pairs', 'sentence-transform', 'image-picker', 'word-scramble',
    'listen-and-type', 'expediciones-en', 'mini-story'];
  const pianoTypes = ['piano-prompter', 'identifica-nota'];
  const cienciasTypes = ['experimento-guia', 'sistema-solar'];
  const dibujoTypes = ['colorear', 'dibujo-guiado', 'dibujo-libre', 'mezclador-colores'];
  const geografiaTypes = ['explorador-mapa'];
  if (englishTypes.includes(f)) return 'ingles';
  if (pianoTypes.includes(f)) return 'piano';
  if (cienciasTypes.includes(f)) return 'ciencias';
  if (dibujoTypes.includes(f)) return 'dibujo';
  if (geografiaTypes.includes(f)) return 'geografia';
  return 'matematicas';
};

const Dashboard = () => {
  const { currentUser, logout, activeProfileId, activeProfile } = useAuth();
  const { profile, loading: profileLoading } = useProfile(activeProfileId);
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = resolveActiveTab(searchParams);
  const filtroParam = searchParams.get('filtro');

  const [materia, setMateria] = useState(() => detectMateria(filtroParam));
  // Explorar se monta perezosamente la primera vez que se activa, y ya no se
  // desmonta: evita repetir el fetch de las 7 colecciones en cada visita.
  // Ajustado durante el render (no en un efecto): la condición se apaga sola
  // en cuanto explorarVisitado pasa a true, así que no puede hacer loop.
  const [explorarVisitado, setExplorarVisitado] = useState(activeTab === 'explorar');
  if (activeTab === 'explorar' && !explorarVisitado) {
    setExplorarVisitado(true);
  }

  // Los perfiles de niño pequeño arrancan directo en Modo Peques.
  if (activeProfile?.esPeque) {
    return <Navigate to="/peques" replace />;
  }

  if (profileLoading) {
    return (
      <PageWrapper>
        <div style={{ textAlign: 'center', padding: '40px', fontSize: '1.5rem' }}>
          Cargando tu perfil...
        </div>
      </PageWrapper>
    );
  }

  // Si no hay perfil (no estaba en whitelist), mostrar acceso denegado
  if (!profile && !profileLoading) {
    return (
      <PageWrapper>
        <Header />
        <div style={{
          textAlign: 'center',
          padding: '40px',
          maxWidth: '600px',
          margin: '0 auto',
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>🔒</h1>
          <h2 style={{ color: '#e74c3c', marginBottom: '15px' }}>Acceso Restringido</h2>
          <p style={{ fontSize: '1.1rem', color: '#7f8c8d', marginBottom: '20px' }}>
            Tu cuenta <strong>{currentUser?.email}</strong> no tiene un perfil activo.
          </p>
          <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', marginBottom: '25px' }}>
            <p style={{ margin: 0 }}>
              Para jugar, pide a <strong>jesuscarrillog@gmail.com</strong> que te registre en la lista de acceso.
            </p>
          </div>
          <button
            className="boton-secundario"
            style={{ margin: '0 auto', justifyContent: 'center' }}
            onClick={() => logout()}
          >
            Cerrar Sesión
          </button>
        </div>
      </PageWrapper>
    );
  }

  const handleTabChange = (tab) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next, { replace: true });
  };

  // Cambia a la pestaña Explorar desde dentro de Hoy (CTAs), sin navegación completa.
  const goToExplorar = (filtro) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'explorar');
    if (filtro) {
      next.set('filtro', filtro);
    } else {
      next.delete('filtro');
    }
    setSearchParams(next, { replace: true });
  };

  return (
    <PageWrapper>
      <Header title={profile?.nombre ? `Centro de Mando de ${profile.nombre}` : 'Centro de Mando de Chuy'} subtitle={`¡Bienvenido de nuevo, ${profile?.nombre || 'súper explorador'}!`} />

      {profile && (
        <div className="boveda-header-personalizado">
          <div className="boveda-avatar">{profile.avatar || '😁'}</div>
          <div className="boveda-info">
            <h1>{profile.nombre}</h1>
            <p>Explora y domina todos los tipos de desafíos</p>
          </div>
        </div>
      )}

      <MateriaToggle materia={materia} onChange={setMateria} />

      <TabBar
        tabs={[
          { id: 'hoy', label: '🏠 Hoy' },
          { id: 'explorar', label: '🔍 Explorar' },
        ]}
        active={activeTab}
        onChange={handleTabChange}
      />

      <div style={{ display: activeTab === 'hoy' ? 'block' : 'none' }}>
        <HoyTab
          profile={profile}
          materia={materia}
          activeProfileId={activeProfileId}
          onGoToExplorar={goToExplorar}
        />
      </div>

      {explorarVisitado && (
        <div style={{ display: activeTab === 'explorar' ? 'block' : 'none' }}>
          <ExplorarTab
            profile={profile}
            materia={materia}
            initialFiltro={filtroParam}
          />
        </div>
      )}
    </PageWrapper>
  );
};

export default Dashboard;
