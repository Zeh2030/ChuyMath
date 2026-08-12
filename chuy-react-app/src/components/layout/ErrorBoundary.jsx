import React from 'react';
import './ErrorBoundary.css';

/**
 * Evita que un fallo en una mision deje la pagina en blanco.
 *
 * Sin esto, cualquier error dentro del arbol desmonta la app entera y el niño
 * se queda mirando una pantalla vacia. El caso mas comun no es un bug del
 * componente sino un `React.lazy` que no puede bajar su chunk: pasa justo
 * despues de desplegar, cuando el navegador tiene el index viejo en cache y
 * pide un archivo que ya no existe. Por eso el boton principal recarga.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    // Un chunk que no carga suele venir de un despliegue reciente.
    const esChunk = /Loading chunk|dynamically imported module|Failed to fetch/i
      .test(error?.message || '');

    return (
      <div className="eb-caja">
        <div className="eb-emoji">{esChunk ? '🔄' : '🛠️'}</div>
        <h3 className="eb-titulo">
          {esChunk ? '¡Hay una versión nueva!' : 'Algo se rompió aquí'}
        </h3>
        <p className="eb-texto">
          {esChunk
            ? 'Se acaba de actualizar la app. Recarga la página y sigue jugando.'
            : 'Esta parte no se pudo mostrar. Puedes recargar o volver atrás.'}
        </p>
        <div className="eb-acciones">
          <button className="eb-btn" onClick={() => window.location.reload()}>
            Recargar
          </button>
          <button
            className="eb-btn eb-btn-secundario"
            onClick={() => this.setState({ error: null })}
          >
            Intentar de nuevo
          </button>
        </div>
        <details className="eb-detalle">
          <summary>Detalles técnicos</summary>
          <code>{error?.message || String(error)}</code>
        </details>
      </div>
    );
  }
}

export default ErrorBoundary;
