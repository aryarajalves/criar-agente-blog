import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Terminal, BookOpen, Shield, LogOut, Menu, X, Users } from 'lucide-react';
import { useToast } from './ToastContext';
import LogoutConfirmationModal from './LogoutConfirmationModal';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username') || 'Administrador';
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const currentPath = location.pathname;
  const isBlogActive = currentPath === '/' || currentPath.startsWith('/post/');
  const isUsersActive = currentPath === '/usuarios' || currentPath.startsWith('/usuarios');
  const isAdminActive = currentPath === '/login' || currentPath === '/admin';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    showToast('Logout realizado com sucesso.');
    setIsLogoutModalOpen(false);
    setIsMobileOpen(false);
    navigate('/');
  };

  const closeMobile = () => {
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Barra superior exibida apenas em dispositivos móveis */}
      <header className="mobile-header">
        <Link to="/" className="mobile-brand" onClick={closeMobile}>
          <div className="brand-icon">
            <Terminal size={18} color="#fff" />
          </div>
          <span className="brand-name gradient-text">
            ARYARAJ<span style={{ color: 'var(--color-secondary)' }}>.</span>
          </span>
        </Link>
        <button 
          className="mobile-menu-toggle"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label={isMobileOpen ? "Fechar menu" : "Abrir menu"}
        >
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Backdrop para fechar o menu ao clicar fora no mobile */}
      {isMobileOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={closeMobile}
          aria-hidden="true"
          data-testid="sidebar-backdrop"
        />
      )}

      {/* Barra Lateral (Sidebar) */}
      <aside className={`app-sidebar ${isMobileOpen ? 'open' : ''}`} data-testid="app-sidebar">
        {/* Topo: Logo & Marca */}
        <div className="sidebar-brand-wrapper">
          <Link to="/" className="sidebar-brand" onClick={closeMobile} data-testid="sidebar-logo">
            <div className="brand-icon">
              <Terminal size={18} color="#fff" />
            </div>
            <span className="brand-name gradient-text">
              ARYARAJ<span style={{ color: 'var(--color-secondary)' }}>.</span>
            </span>
          </Link>
        </div>

        {/* Menu de Navegação Vertical */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Navegação</div>
          
          {/* Item 1: Blog (Painel inicial) */}
          <Link
            to="/"
            onClick={closeMobile}
            className={`sidebar-nav-item ${isBlogActive ? 'active' : ''}`}
            data-testid="sidebar-link-blog"
          >
            <BookOpen size={18} />
            <span>Blog</span>
          </Link>

          {/* Item 2: Gestão de Usuário (Logo abaixo do Blog) */}
          <Link
            to={token ? "/usuarios" : "/login"}
            onClick={closeMobile}
            className={`sidebar-nav-item ${isUsersActive ? 'active' : ''}`}
            data-testid="sidebar-link-users"
          >
            <Users size={18} />
            <span>Gestão de Usuário</span>
          </Link>

          {/* Item 3: Painel Administrativo */}
          <Link
            to={token ? "/admin" : "/login"}
            onClick={closeMobile}
            className={`sidebar-nav-item ${isAdminActive ? 'active' : ''}`}
            data-testid="sidebar-link-admin"
          >
            <Shield size={18} />
            <span>Painel Administrativo</span>
          </Link>
        </nav>

        {/* Rodapé da barra lateral: Perfil / Logout */}
        <div className="sidebar-footer">
          {token ? (
            <div className="sidebar-user-card" data-testid="sidebar-user-card">
              <div className="sidebar-user-info">
                <span className="sidebar-user-badge">Admin</span>
                <span className="sidebar-user-name" title={username}>{username}</span>
              </div>
              <button
                onClick={() => setIsLogoutModalOpen(true)}
                className="sidebar-logout-btn"
                title="Sair do painel"
                aria-label="Sair"
                data-testid="sidebar-logout-btn"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="sidebar-guest-box" data-testid="sidebar-guest-box">
              <p className="sidebar-guest-text">Modo Leitura</p>
              <Link to="/login" onClick={closeMobile} className="sidebar-login-link">
                Acesso Restrito
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Modal de Confirmação de Logout */}
      <LogoutConfirmationModal
        isOpen={isLogoutModalOpen}
        onConfirm={handleLogout}
        onCancel={() => setIsLogoutModalOpen(false)}
      />
    </>
  );
}
