import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import './ProfileSelector.css';

const AVATARES_RAPIDOS = ['🦸', '🦄', '🐱', '🐶', '🦊', '🐻', '🦁', '🐵', '🐨', '🐸', '🚀', '🌈'];

/**
 * ProfileSelector — Pantalla "¿Quién va a jugar?"
 * Elige el perfil de hijo activo, crea perfiles nuevos (self-service) y los gestiona.
 */
const ProfileSelector = () => {
  const {
    profiles, profilesLoading, cuentaAutorizada,
    switchProfile, crearPerfilHijo, borrarPerfil,
    currentUser, logout,
  } = useAuth();
  const navigate = useNavigate();

  const [modo, setModo] = useState('ver'); // 'ver' | 'crear'
  const [gestionando, setGestionando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [avatar, setAvatar] = useState(AVATARES_RAPIDOS[0]);
  const [esPeque, setEsPeque] = useState(false);
  const [creando, setCreando] = useState(false);
  const [porBorrar, setPorBorrar] = useState(null); // id pendiente de confirmar

  const elegir = (p) => {
    switchProfile(p.id);
    navigate(p.esPeque ? '/peques' : '/dashboard');
  };

  const editar = (id) => {
    switchProfile(id);
    navigate('/perfil');
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setCreando(true);
    try {
      await crearPerfilHijo({ nombre, avatar, esPeque });
      navigate(esPeque ? '/peques' : '/dashboard');
    } catch (err) {
      console.error('Error al crear perfil:', err);
      setCreando(false);
    }
  };

  const confirmarBorrar = async (id) => {
    try {
      await borrarPerfil(id);
    } catch (err) {
      console.error('Error al borrar perfil:', err);
    }
    setPorBorrar(null);
  };

  if (profilesLoading) {
    return (
      <div className="psel-bg">
        <div className="psel-cargando">Cargando perfiles…</div>
      </div>
    );
  }

  // Cuenta sin autorizar y sin perfiles
  if (!cuentaAutorizada && profiles.length === 0) {
    return (
      <div className="psel-bg">
        <div className="psel-noauth">
          <div className="psel-noauth-emoji">🔒</div>
          <h2>Tu cuenta aún no está autorizada</h2>
          <p>Pídele al administrador que agregue <strong>{currentUser?.email}</strong> para poder entrar.</p>
          <button className="psel-logout" onClick={logout}>Cerrar sesión</button>
        </div>
      </div>
    );
  }

  return (
    <div className="psel-bg">
      <div className="psel-container">
        <h1 className="psel-titulo">¿Quién va a jugar?</h1>

        {modo === 'crear' ? (
          <form className="psel-form" onSubmit={handleCrear}>
            <div className="psel-form-avatar">{avatar}</div>
            <div className="psel-avatares">
              {AVATARES_RAPIDOS.map((a) => (
                <button
                  type="button"
                  key={a}
                  className={`psel-avatar-opt ${avatar === a ? 'sel' : ''}`}
                  onClick={() => setAvatar(a)}
                >
                  {a}
                </button>
              ))}
            </div>
            <input
              className="psel-input"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre del jugador"
              maxLength={20}
              autoFocus
            />
            <label className="psel-check">
              <input type="checkbox" checked={esPeque} onChange={(e) => setEsPeque(e.target.checked)} />
              <span>Es un niño pequeño (2-5 años) · Modo Peques 🧸</span>
            </label>
            <div className="psel-form-acciones">
              <button type="button" className="psel-btn-sec" onClick={() => setModo('ver')}>
                Cancelar
              </button>
              <button type="submit" className="psel-btn-pri" disabled={!nombre.trim() || creando}>
                {creando ? 'Creando…' : 'Crear perfil'}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="psel-grid">
              {profiles.map((p) => (
                <div key={p.id} className="psel-card-wrap">
                  <button className="psel-card" onClick={() => elegir(p)}>
                    <span className="psel-card-avatar">{p.avatar || '🙂'}</span>
                    <span className="psel-card-nombre">{p.nombre || 'Jugador'}</span>
                  </button>
                  {gestionando && (
                    <div className="psel-card-acciones">
                      <button className="psel-mini psel-editar" onClick={() => editar(p.id)} title="Editar">✏️</button>
                      <button className="psel-mini psel-borrar" onClick={() => setPorBorrar(p.id)} title="Borrar">🗑️</button>
                    </div>
                  )}
                  {porBorrar === p.id && (
                    <div className="psel-confirm">
                      <p>¿Borrar a <strong>{p.nombre}</strong> y su progreso?</p>
                      <div className="psel-confirm-acciones">
                        <button className="psel-btn-sec" onClick={() => setPorBorrar(null)}>No</button>
                        <button className="psel-btn-danger" onClick={() => confirmarBorrar(p.id)}>Sí, borrar</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <button className="psel-card psel-card-add" onClick={() => setModo('crear')}>
                <span className="psel-card-avatar">➕</span>
                <span className="psel-card-nombre">Agregar</span>
              </button>
            </div>

            <div className="psel-footer">
              <button className="psel-toggle" onClick={() => { setGestionando(!gestionando); setPorBorrar(null); }}>
                {gestionando ? '✓ Listo' : '⚙️ Administrar perfiles'}
              </button>
              <button className="psel-logout" onClick={logout}>Cerrar sesión</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileSelector;
