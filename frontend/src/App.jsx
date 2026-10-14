import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ToastProvider } from './components/ToastContext';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import PostDetail from './pages/PostDetail';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import AcceptInvite from './pages/AcceptInvite';

function AppContent() {
  const location = useLocation();
  const isInvitePage = location.pathname.startsWith('/convite/');

  if (isInvitePage) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }} data-testid="invite-page-standalone">
        <Routes>
          <Route path="/convite/:token" element={<AcceptInvite />} />
        </Routes>
      </main>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      
      <div className="app-main-wrapper">
        <main className="app-main-content" data-testid="app-main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/post/:slug" element={<PostDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/usuarios" element={<UserManagement />} />
          </Routes>
        </main>
        
        <footer className="app-footer" data-testid="app-footer">
          <div className="app-footer-mask" data-testid="app-footer-mask" />
          <div className="container">
            <p style={{ marginBottom: 6 }}>
              &copy; {new Date().getFullYear()} Aryaraj - Interfaces Premium. Todos os direitos reservados.
            </p>
            <p style={{ fontSize: '0.75rem' }}>
              Desenvolvido com React, FastAPI e PostgreSQL. Focado em SEO e alta conversão de parcerias.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ToastProvider>
  );
}
