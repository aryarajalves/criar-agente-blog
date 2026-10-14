import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useToast } from '../components/ToastContext';
import { KeyRound, Mail, LogIn, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    // Se o admin já estiver logado, redireciona para o dashboard
    if (localStorage.getItem('token')) {
      navigate('/admin');
    }
  }, [navigate]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Por favor, preencha o e-mail e a senha.', 'error');
      return;
    }

    setLoading(true);
    try {
      const data = await api.login(email, password);
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('username', data.username);
      localStorage.setItem('email', data.email);
      showToast(`Bem-vindo de volta, ${data.username}!`);
      navigate('/admin');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Credenciais inválidas.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex-center" style={{ minHeight: '80vh', padding: '40px 24px' }}>
      <div className="glass-panel" style={{ padding: '40px', maxWidth: '440px', width: '100%', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div className="flex-center" style={{
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            width: 48,
            height: 48,
            borderRadius: '50%',
            margin: '0 auto 16px',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)',
            color: '#fff'
          }}>
            <KeyRound size={22} />
          </div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: 8 }} className="gradient-text">Acesso Restrito</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Painel administrativo do blog de interfaces.</p>
        </div>

        <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label htmlFor="email" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>E-mail</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <Mail size={16} />
              </span>
              <input 
                type="email" 
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field" 
                style={{ paddingLeft: 46 }}
                placeholder="nome@exemplo.com"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>Senha</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <KeyRound size={16} />
              </span>
              <input 
                type={showPassword ? "text" : "password"} 
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field" 
                style={{ paddingLeft: 46, paddingRight: 46 }}
                placeholder="Sua senha secreta"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  transition: 'var(--transition-smooth)'
                }}
                className="password-toggle-btn"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
          >
            {loading ? (
              <>
                <div className="spinner"></div> Carregando...
              </>
            ) : (
              <>
                Entrar no Painel <LogIn size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
