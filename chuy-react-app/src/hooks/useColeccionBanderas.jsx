import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { doc, updateDoc, increment, arrayUnion, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './useAuth';
import { ALBUM } from '../data/albumBanderas';
import { hoy, estadoBandera, combinar } from '../utils/coleccionBanderas';
import './useColeccionBanderas.css';

// Álbum de banderas: los juegos avisan cada bandera contestada (registrar(clave, bien),
// solo el primer intento) y aquí se juntan para escribir el perfil de una vez:
// useAuth escucha el perfil en vivo y cada escritura re-renderiza toda la app.
// Sin Provider (Peques, Dibujo, Simulacro) registrar no hace nada.
const ColeccionContext = createContext(null);
const NOMBRES = Object.fromEntries(ALBUM.map(a => [a.clave, a.nombre]));
const EVENTOS_POR_ESCRITURA = 6;
const ESPERA_MS = 3000;
const nada = () => {};

export const ColeccionBanderasProvider = ({ children }) => {
  const { activeProfileId, activeProfile } = useAuth();
  const pendiente = useRef({}); // clave → { aciertos, fallos, ultimoBien }
  const eventos = useRef(0);
  const temporizador = useRef(null);
  const perfilId = useRef(activeProfileId);
  const [aviso, setAviso] = useState(null);
  const avisoTimer = useRef(null);

  useEffect(() => { perfilId.current = activeProfileId; }, [activeProfileId]);

  const escribir = useCallback(() => {
    clearTimeout(temporizador.current);
    const datos = pendiente.current;
    pendiente.current = {};
    eventos.current = 0;
    if (!perfilId.current || !Object.keys(datos).length) return;
    const cambios = {};
    for (const [clave, p] of Object.entries(datos)) {
      const base = `banderasColeccion.${clave}`;
      if (p.aciertos) {
        cambios[`${base}.aciertos`] = increment(p.aciertos);
        cambios[`${base}.dias`] = arrayUnion(hoy());
      }
      if (p.fallos) cambios[`${base}.fallos`] = increment(p.fallos);
      cambios[`${base}.ultimoBien`] = p.ultimoBien;
      cambios[`${base}.ultima`] = Timestamp.now();
    }
    updateDoc(doc(db, 'profiles', perfilId.current), cambios)
      .catch(err => console.error('Error al guardar el álbum de banderas:', err));
  }, []);

  // Al salir de la aventura se escribe lo que quede.
  useEffect(() => () => { escribir(); clearTimeout(avisoTimer.current); }, [escribir]);

  const coleccion = activeProfile?.banderasColeccion;
  const registrar = useCallback((clave, bien) => {
    if (!clave) return;
    const previo = pendiente.current[clave];
    const antes = estadoBandera(combinar(coleccion?.[clave], previo));
    const nuevo = {
      aciertos: (previo?.aciertos || 0) + (bien ? 1 : 0),
      fallos: (previo?.fallos || 0) + (bien ? 0 : 1),
      ultimoBien: bien,
    };
    pendiente.current[clave] = nuevo;
    const despues = estadoBandera(combinar(coleccion?.[clave], nuevo));
    if (despues !== antes && (despues === 'pegada' || despues === 'dorada')) {
      setAviso({ nombre: NOMBRES[clave] || clave, dorada: despues === 'dorada' });
      clearTimeout(avisoTimer.current);
      avisoTimer.current = setTimeout(() => setAviso(null), 3500);
    }
    eventos.current += 1;
    clearTimeout(temporizador.current);
    if (eventos.current >= EVENTOS_POR_ESCRITURA) escribir();
    else temporizador.current = setTimeout(escribir, ESPERA_MS);
  }, [coleccion, escribir]);

  const valor = useMemo(() => ({ registrar }), [registrar]);

  return (
    <ColeccionContext.Provider value={valor}>
      {children}
      {aviso && (
        <div className="estampa-nueva" role="status">
          {aviso.dorada ? '⭐ ¡Estampa dorada' : '📒 ¡Nueva estampa'}: {aviso.nombre}!
        </div>
      )}
    </ColeccionContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useRegistrarBandera = () => useContext(ColeccionContext)?.registrar ?? nada;
