import { useState, useRef, useCallback, useLayoutEffect, useEffect } from 'react';

/**
 * useLienzoFullscreen — modo pantalla completa para lienzos de dibujo.
 *
 * Al alternar: intenta la Fullscreen API del navegador (si no, el overlay CSS que
 * aplica el componente igual maximiza) y re-ajusta el canvas al nuevo tamaño SIN
 * perder el dibujo (saca una foto y la vuelve a pintar). También re-ajusta al
 * cambiar el tamaño de la ventana (rotación / cambio de viewport al entrar en FS).
 *
 * El componente aplica su propia clase `.X-fullscreen` según el `fullscreen` que devuelve.
 */
export function useLienzoFullscreen({ canvasRef, wrapperRef, rootRef }) {
  const [fullscreen, setFullscreen] = useState(false);
  const primerRender = useRef(true);

  // Re-ajusta el canvas al tamaño actual del wrapper, preservando el dibujo.
  const refit = useCallback(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const w = wrapper.clientWidth;
    const h = wrapper.clientHeight;
    if (!w || !h) return;
    let foto = null;
    try { foto = canvas.toDataURL('image/png'); } catch { foto = null; }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, w, h);
    if (foto) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, w, h);
      img.src = foto;
    }
  }, [canvasRef, wrapperRef]);

  const toggle = useCallback(() => {
    const next = !fullscreen;
    setFullscreen(next);
    try {
      if (next) {
        const el = rootRef?.current || document.documentElement;
        (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
      } else if (document.fullscreenElement || document.webkitFullscreenElement) {
        (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
      }
    } catch {
      /* sin Fullscreen API: el overlay CSS igual maximiza */
    }
  }, [fullscreen, rootRef]);

  // Al entrar/salir de pantalla completa, re-ajusta tras el reflow. Salta el 1er render.
  useLayoutEffect(() => {
    if (primerRender.current) { primerRender.current = false; return; }
    const id = window.requestAnimationFrame(() => refit());
    return () => window.cancelAnimationFrame(id);
  }, [fullscreen, refit]);

  // Re-ajusta al cambiar el tamaño de la ventana (rotación, viewport de FS). Con debounce.
  useEffect(() => {
    let t = null;
    const onResize = () => {
      window.clearTimeout(t);
      t = window.setTimeout(refit, 150);
    };
    window.addEventListener('resize', onResize);
    return () => { window.clearTimeout(t); window.removeEventListener('resize', onResize); };
  }, [refit]);

  // Si salen de la Fullscreen API (p. ej. con Esc), sincroniza el overlay CSS.
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

  return { fullscreen, toggle };
}
