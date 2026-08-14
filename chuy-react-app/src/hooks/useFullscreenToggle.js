import { useCallback, useEffect, useState } from 'react';

/**
 * useFullscreenToggle — pantalla completa generica para un contenedor.
 *
 * A diferencia de useLienzoFullscreen (que ademas re-pinta un <canvas> 2D
 * preservando el dibujo), este hook no asume nada del contenido: solo
 * alterna la Fullscreen API real sobre `rootRef` (con el overlay CSS que el
 * propio componente aplique como respaldo si el navegador no la soporta) y
 * mantiene el estado sincronizado si el usuario sale con Esc.
 *
 * IMPORTANTE: el elemento en `rootRef` debe ser un ANCESTRO de TODO lo que
 * tenga que seguir viendose en pantalla completa (tarjetas flotantes,
 * botones de accion, texto de retos...). Si se fullscreenea un elemento mas
 * chico que solo envuelve el lienzo, todo lo que viva FUERA de el
 * (hermanos en el arbol de React) desaparece de la vista al entrar — ese fue
 * el bug original en Espacio3D: cada uno fullscreneaba su propio div interno
 * en vez del contenedor que tambien incluye la tarjeta y los botones.
 */
export function useFullscreenToggle(rootRef) {
  const [fullscreen, setFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    setFullscreen((prev) => {
      const next = !prev;
      try {
        if (next) {
          const el = rootRef.current || document.documentElement;
          (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
        } else if (document.fullscreenElement || document.webkitFullscreenElement) {
          (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
        }
      } catch {
        /* sin Fullscreen API: el overlay CSS igual maximiza */
      }
      return next;
    });
  }, [rootRef]);

  useEffect(() => {
    const onChange = () => {
      const activo = !!(document.fullscreenElement || document.webkitFullscreenElement);
      if (!activo) setFullscreen(false);
    };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  return { fullscreen, toggleFullscreen };
}
