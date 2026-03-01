# ChuyMath — El Mundo de Chuy

Plataforma educativa de matemáticas construida para un niño de 2do grado de primaria que compite en **olimpiadas de matemáticas**. Las olimpiadas exponen a los concursantes a temas adelantados a su grado (fracciones, área, lógica, criptoaritmética, etc.), por lo que la app cubre contenido más allá del currículo estándar.

---

## ¿Qué hace la app?

- **Aventuras diarias**: Misiones de matemáticas con múltiples tipos de ejercicios (opción múltiple, balanza lógica, cubos, mapas, Numberblocks, etc.)
- **Simulacros**: Exámenes de práctica sin feedback inmediato, con calificación y explicaciones al final — simulando condiciones reales de olimpiada
- **Bóveda**: Biblioteca de contenido y recursos
- **Perfil y trofeos**: Racha de días, logros y progreso por habilidad
- **Panel de administración**: Carga de contenido (aventuras y simulacros) desde JSON a Firestore

---

## Stack

React 19 + Vite 7 · Firebase (Auth + Firestore) · React Router v7 · Netlify

Ver detalles técnicos en [arquitectura.md](arquitectura.md).

---

## Correr localmente

```bash
cd chuy-react-app
npm install
# Crear archivo .env con credenciales de Firebase (ver .env.example)
npm run dev
```

---

## Contenido

Los simulacros y aventuras viven como archivos JSON en `_contenido/`. Para subirlos a Firestore:

1. Ir a `/admin/migracion` en la app
2. Seleccionar el tipo (aventura o simulacro)
3. Pegar el JSON y migrar

Ver instrucciones detalladas en [INSTRUCCIONES_SIMULACRO.md](INSTRUCCIONES_SIMULACRO.md).

---

## Estado actual

- [x] Autenticación con Google
- [x] Dashboard con racha y trofeos
- [x] Aventuras con 7+ tipos de misiones
- [x] Simulacros con 17+ exámenes de práctica
- [x] Gestión de múltiples usuarios
- [x] Desplegado en producción (Netlify)

---

## Visión a futuro

El proyecto fue construido para uso personal, pero su arquitectura ya soporta múltiples usuarios. Los posibles próximos pasos hacia un SaaS son:

- Registro self-service para familias
- Aislamiento de datos por familia/tenant
- Sistema de pagos (suscripción mensual por niño)
- Panel de padres para ver progreso

El 80% del trabajo técnico ya está hecho. La decisión de monetizar depende de validar el producto con otras familias primero.
