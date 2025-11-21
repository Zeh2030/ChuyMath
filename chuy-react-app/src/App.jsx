import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.jsx';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminMigracion from './pages/AdminMigracion';
import Aventura from './pages/Aventura';
import Simulacro from './pages/Simulacro';
import Boveda from './pages/Boveda';

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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/migracion"
          element={
            <ProtectedRoute>
              <AdminMigracion />
            </ProtectedRoute>
          }
        />
        <Route
          path="/aventura/:fecha"
          element={
            <ProtectedRoute>
              <Aventura />
            </ProtectedRoute>
          }
        />
        <Route
          path="/simulacro/:id"
          element={
            <ProtectedRoute>
              <Simulacro />
            </ProtectedRoute>
          }
        />
        <Route
          path="/boveda"
          element={
            <ProtectedRoute>
              <Boveda />
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
