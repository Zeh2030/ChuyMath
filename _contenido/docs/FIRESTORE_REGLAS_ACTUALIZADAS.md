# 🔐 Reglas de Firestore - Versión en Vivo

> ⚠️ **DOCUMENTO ÚNICO Y DEFINITIVO**
> Este archivo es el "source of truth" para las reglas de Firestore.
> Cualquier actualización aquí debe reflejarse en Firebase Console.

---

## 📋 Versión Actual

**Última actualización:** 2025-11-24

Estas son las reglas que **deben estar en Firebase Console** en todo momento.

---

## ✅ Código de Reglas Completo

Copia TODO este código y pégalo en:
**Firebase Console → Firestore Database → Rules Tab → Publicar**

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // ============================================
    // HELPER: Identificar si es administrador
    // ============================================
    function isAdmin() {
      return request.auth.token.email == 'jesuscarrillog@gmail.com';
    }

    // ============================================
    // WHITELIST: Usuarios autorizados
    // Todos autenticados pueden LEER (comprobar si están autorizados)
    // Solo admin puede ESCRIBIR (agregar nuevos usuarios)
    // ============================================
    match /whitelist/{document=**} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }

    // ============================================
    // AVENTURAS: Contenido de aventuras diarias
    // Todos autenticados pueden LEER
    // Solo admin puede ESCRIBIR
    // ============================================
    match /aventuras/{aventura} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }

    // ============================================
    // CONTEO DE FIGURAS: Nuevas aventuras de conteo
    // Todos autenticados pueden LEER
    // Solo admin puede ESCRIBIR
    // ============================================
    match /conteo-figuras/{contenido} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }

    // ============================================
    // SECUENCIAS: Aventuras de patrones y secuencias
    // Todos autenticados pueden LEER
    // Solo admin puede ESCRIBIR
    // ============================================
    match /secuencias/{contenido} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }

    // ============================================
    // OPERACIONES: Ejercicios de operaciones matemáticas
    // Todos autenticados pueden LEER
    // Solo admin puede ESCRIBIR
    // ============================================
    match /operaciones/{contenido} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }

    // ============================================
    // CRIPTOARITMETICA: Problemas de criptoaritmética
    // Todos autenticados pueden LEER
    // Solo admin puede ESCRIBIR
    // ============================================
    match /criptoaritmetica/{contenido} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }

    // ============================================
    // BALANZA-LOGICA: Ejercicios de balanza lógica
    // Todos autenticados pueden LEER
    // Solo admin puede ESCRIBIR
    // ============================================
    match /balanza-logica/{contenido} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }

    // ============================================
    // DESARROLLO-CUBOS: Problemas de desarrollo de cubos
    // Todos autenticados pueden LEER
    // Solo admin puede ESCRIBIR
    // ============================================
    match /desarrollo-cubos/{contenido} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }

    // ============================================
    // PALABRA-DEL-DIA: Ejercicios de vocabulario
    // Todos autenticados pueden LEER
    // Solo admin puede ESCRIBIR
    // ============================================
    match /palabra-del-dia/{contenido} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }

    // ============================================
    // SIMULACROS: Exámenes y simulacros completos
    // Todos autenticados pueden LEER
    // Solo admin puede ESCRIBIR
    // ============================================
    match /simulacros/{simulacro} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }

    // ============================================
    // PROFILES: Datos de juego y progreso del usuario
    // Cada usuario solo puede LEER/ESCRIBIR su propio documento
    // ============================================
    match /profiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // ============================================
    // USERS: Metadatos de Firebase Authentication
    // Cada usuario solo puede LEER/ESCRIBIR su propio documento
    // ============================================
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 📊 Matriz de Permisos

| Colección | Lectura | Escritura | Notas |
|-----------|---------|-----------|-------|
| whitelist | ✅ Todos autenticados | 🔐 Solo Admin | Para autorizar nuevos usuarios |
| aventuras | ✅ Todos autenticados | 🔐 Solo Admin | Aventuras diarias por fecha |
| conteo-figuras | ✅ Todos autenticados | 🔐 Solo Admin | ✨ NUEVA - Conteo geométrico |
| secuencias | ✅ Todos autenticados | 🔐 Solo Admin | ✨ NUEVA - Patrones y secuencias |
| operaciones | ✅ Todos autenticados | 🔐 Solo Admin | ✨ NUEVA - Operaciones matemáticas |
| criptoaritmetica | ✅ Todos autenticados | 🔐 Solo Admin | ✨ NUEVA - Criptoaritmética |
| balanza-logica | ✅ Todos autenticados | 🔐 Solo Admin | ✨ NUEVA - Balanza lógica |
| desarrollo-cubos | ✅ Todos autenticados | 🔐 Solo Admin | ✨ NUEVA - Desarrollo de cubos |
| palabra-del-dia | ✅ Todos autenticados | 🔐 Solo Admin | ✨ NUEVA - Vocabulario |
| simulacros | ✅ Todos autenticados | 🔐 Solo Admin | Exámenes completos |
| profiles | ✅ Solo dueño | ✅ Solo dueño | Datos personales del jugador |
| users | ✅ Solo dueño | ✅ Solo dueño | Metadatos de autenticación |

---

## 🔄 Cómo Usar Este Documento

### 1️⃣ **Cuando necesites actualizar reglas en Firebase:**
   - Copia el código de "Código de Reglas Completo"
   - Pega en Firebase Console → Firestore → Rules
   - Click "Publicar"
   - ✅ Actualiza este documento en git

### 2️⃣ **Cuando agregues nuevas colecciones:**
   - Agrega la nueva regla aquí en este archivo
   - Actualiza la matriz de permisos
   - Copia TODO el código a Firebase
   - Publica en Firebase Console
   - Commit a git con cambios

### 3️⃣ **Para verificar qué está en Firebase:**
   - Compara el código aquí con Firebase Console Rules
   - Si son diferentes, sincroniza usando paso 1️⃣

---

## 📝 Cambios por Fecha

| Fecha | Cambio | Admin |
|-------|--------|-------|
| 2025-11-24 | Agregadas 7 nuevas colecciones (conteo-figuras, secuencias, operaciones, etc.) | jesuscarrillog@gmail.com |
| 2025-11-XX | (Próximas actualizaciones) | - |

---

## ✅ Verificación Rápida

Después de publicar en Firebase, verifica que funcione:

```bash
1. Abre: localhost:5173/boveda
2. Debería mostrar:
   ✅ Aventuras
   ✅ Conteo de Figuras
   ✅ Secuencias
   ✅ Simulacros
   ✅ Otros tipos con 🔒 si no hay contenido
   
3. Si ves error rojo "No se pudo cargar..."
   → Las reglas NO están actualizadas en Firebase
   → Vuelve a copiar y pegar el código completo
```

---

## 🚀 Próximas Colecciones

Cuando agregues nuevas colecciones, sigue este patrón:

```javascript
match /nueva-coleccion/{documento} {
  allow read: if request.auth != null;
  allow write: if isAdmin();
}
```

Luego:
1. Actualiza este archivo
2. Publica en Firebase
3. El código automáticamente cargará la nueva colección

