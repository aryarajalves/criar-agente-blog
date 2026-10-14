import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useToast } from '../components/ToastContext';
import { UserCheck, Shield, Lock, Mail, User, Eye, EyeOff, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';

export default function AcceptInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [validInvite, setValidInvite] = useState({ role: 'admin' });
  const [error, setError] = useState(null);

  // Estados dos inputs iniciados explicitamente vazios
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Garante que todos os campos iniciem rigorosamente em branco
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');

    const checkInvite = async () => {
      try {
        const data = await api.validateInvite(token);
        setValidInvite(data);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Convite inválido ou expirado.');
      }
    };

    if (token) {
      checkInvite();
    } else {
      setError('Token de convite não informado.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim() || !email.trim() || !password) {
      showToast('Por favor, preencha todos os campos obrigatórios.', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('A senha deve ter no mínimo 6 caracteres.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('As senhas não coincidem.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.acceptInvite(token, {
        username: username.trim(),
        email: email.trim(),
        password,
      });

      showToast('Conta de Administrador criada com sucesso! Faça seu login para continuar.');
      navigate('/login');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Erro ao criar conta de administrador.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Se o convite for comprovadamente inválido ou expirado
  if (error) {
    return (
      <div 
        className="container flex-center" 
        style={{ minHeight: '80vh', padding: '40px 24px', animation: 'none', transition: 'none' }}
      >
        <div 
          className="glass-panel" 
          style={{ maxWidth: '460px', width: '100%', padding: '40px', textAlign: 'center', animation: 'none', transition: 'none' }} 
          data-testid="invite-error-card"
        >
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            width: 56,
            height: 56,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: '#f87171'
          }}>
            <AlertTriangle size={26} />
          </div>

          <h2 style={{ fontSize: '1.5rem', marginBottom: 12 }}>Convite Inválido ou Expirado</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 28, lineHeight: 1.6 }}>
            {error || 'Não foi possível validar este link de convite. Ele pode já ter sido utilizado ou seu tempo de validade expirou.'}
          </p>

          <Link to="/" className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
            <ArrowLeft size={16} /> Voltar para o Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="container flex-center" 
      style={{ minHeight: '80vh', padding: '40px 24px', animation: 'none', transition: 'none' }}
    >
      <div 
        className="glass-panel" 
        style={{ maxWidth: '480px', width: '100%', padding: '40px', animation: 'none', transition: 'none' }} 
        data-testid="accept-invite-card"
      >
        
        {/* Cabeçalho do Card */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div className="flex-center" style={{
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            width: 52,
            height: 52,
            borderRadius: '50%',
            margin: '0 auto 16px',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)',
            color: '#fff'
          }}>
            <UserCheck size={24} />
          </div>

          <h2 style={{ fontSize: '1.75rem', marginBottom: 8 }} className="gradient-text">
            Criar Conta de Administrador
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: 16 }}>
            Você foi convidado para gerenciar e publicar artigos no blog.
          </p>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            borderRadius: '50px',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: '#c4b5fd',
            fontSize: '0.8rem',
            fontWeight: 600
          }}>
            <Shield size={14} /> Função: {validInvite?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
          </div>
        </div>

        {/* Formulário de Cadastro */}
        <form 
          onSubmit={handleSubmit} 
          autoComplete="off"
          style={{ display: 'flex', flexDirection: 'column', gap: 18, animation: 'none', transition: 'none' }} 
          data-testid="accept-invite-form"
        >
          {/* Campos ocultos de armadilha para absorver o autofill indevido do navegador */}
          <input type="text" name="fake_username_remembered" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
          <input type="password" name="fake_password_remembered" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

          {/* Nome de Usuário */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>
              Nome de Usuário
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <User size={16} />
              </span>
              <input
                type="text"
                name="invite_admin_username"
                autoComplete="off"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: joao_silva"
                className="input-field"
                style={{ paddingLeft: 44, animation: 'none', transition: 'none' }}
                data-testid="input-invite-username"
              />
            </div>
          </div>

          {/* E-mail Profissional */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>
              E-mail Profissional
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <Mail size={16} />
              </span>
              <input
                type="email"
                name="invite_admin_email"
                autoComplete="new-password"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="input-field"
                style={{ paddingLeft: 44, animation: 'none', transition: 'none' }}
                data-testid="input-invite-email"
              />
            </div>
          </div>

          {/* Senha */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>
              Senha de Acesso
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                name="invite_admin_password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="input-field"
                style={{ paddingLeft: 44, paddingRight: 44, animation: 'none', transition: 'none' }}
                data-testid="input-invite-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirmar Senha */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>
              Confirmar Senha
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                name="invite_admin_confirm_password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita sua senha"
                className="input-field"
                style={{ paddingLeft: 44, animation: 'none', transition: 'none' }}
                data-testid="input-invite-confirm-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary"
            data-testid="btn-submit-invite"
            style={{ width: '100%', justifyContent: 'center', marginTop: 12, padding: '14px', animation: 'none', transition: 'none' }}
          >
            {submitting ? (
              <div className="spinner" />
            ) : (
              <>
                <span>Concluir Cadastro</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
