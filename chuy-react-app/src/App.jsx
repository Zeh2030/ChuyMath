import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.jsx';
import './styles/themes.css';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminMigracion from './pages/AdminMigracion';
import AdminUsuarios from './pages/AdminUsuarios';
import Aventura from './pages/Aventura';
import Simulacro from './pages/Simulacro';
import Boveda from './pages/Boveda';
import Perfil from './pages/Perfil';
import ProfileSelector from './pages/ProfileSelector';
import Peques from './pages/Peques';

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.5rem' }}>Cargando autenticación...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Requiere que haya un perfil de hijo activo; si no, manda al selector "¿Quién va a jugar?".
const ProfileRequired = ({ children }) => {
  const { activeProfileId, profilesLoading } = useAuth();

  if (profilesLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.5rem' }}>Cargando perfiles...</div>;
  }

  if (!activeProfileId) {
    return <Navigate to="/elegir-perfil" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Selección de perfil (requiere cuenta, no requiere perfil activo) */}
        <Route
          path="/elegir-perfil"
          element={
            <ProtectedRoute>
              <ProfileSelector />
            </ProtectedRoute>
          }
        />

        {/* Modo Peques (requiere perfil activo; los perfiles esPeque arrancan aquí) */}
        <Route
          path="/peques"
          element={
            <ProtectedRoute>
              <ProfileRequired>
                <Peques />
              </ProfileRequired>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <ProfileRequired>
                <Dashboard />
              </ProfileRequired>
            </ProtectedRoute>
          }
        />
        <Route
          path="/aventura/:fecha"
          element={
            <ProtectedRoute>
              <ProfileRequired>
                <Aventura />
              </ProfileRequired>
            </ProtectedRoute>
          }
        />
        <Route
          path="/simulacro/:id"
          element={
            <ProtectedRoute>
              <ProfileRequired>
                <Simulacro />
              </ProfileRequired>
            </ProtectedRoute>
          }
        />
        <Route
          path="/boveda"
          element={
            <ProtectedRoute>
              <ProfileRequired>
                <Boveda />
              </ProfileRequired>
            </ProtectedRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <ProfileRequired>
                <Perfil />
              </ProfileRequired>
            </ProtectedRoute>
          }
        />

        {/* Rutas de administración: requieren cuenta, no perfil de hijo */}
        <Route
          path="/admin/migracion"
          element={
            <ProtectedRoute>
              <AdminMigracion />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/usuarios"
          element={
            <ProtectedRoute>
              <AdminUsuarios />
            </ProtectedRoute>
          }
        />

        {/* Redirigir a /dashboard si ya está logueado o a /login */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
