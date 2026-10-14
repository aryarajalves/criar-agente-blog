import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../utils/api';
import { useToast } from './ToastContext';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import { formatBrasiliaDateTime } from '../utils/date';
import { MailPlus, Clock, ShieldCheck, Copy, Check, X, Sparkles, ExternalLink } from 'lucide-react';

export default function GenerateInviteModal({ isOpen, onClose, onInviteCreated }) {
  useLockBodyScroll(isOpen);

  const [role] = useState('admin');
  const [expiresInHours, setExpiresInHours] = useState(24);
  const [loading, setLoading] = useState(false);
  const [generatedInvite, setGeneratedInvite] = useState(null);
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleCreateInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.createInvite({
        role: 'admin',
        expires_in_hours: Number(expiresInHours),
      });

      const fullUrl = `${window.location.origin}/convite/${data.token}`;
      setGeneratedInvite({
        ...data,
        fullUrl,
      });

      showToast('Link de convite gerado com sucesso!');
      if (onInviteCreated) {
        onInviteCreated(data);
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Erro ao gerar link de convite.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!generatedInvite) return;
    navigator.clipboard.writeText(generatedInvite.fullUrl);
    setCopied(true);
    showToast('Link de convite copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleResetModal = () => {
    setGeneratedInvite(null);
    setCopied(false);
    setExpiresInHours(24);
    onClose();
  };

  return createPortal(
    <div className="modal-backdrop" id="invite-modal-backdrop">
      <div 
        className="modal-content glass-panel" 
        style={{ maxWidth: '480px', width: '92%', padding: '32px', textAlign: 'left', position: 'relative' }}
        id="invite-modal-content"
      >
        <button
          onClick={handleResetModal}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 4
          }}
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            width: 44,
            height: 44,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)'
          }}>
            <MailPlus size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700 }} className="gradient-text">
              Gerar Convite de Acesso
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Crie um link temporário para cadastrar um novo administrador.
            </p>
          </div>
        </div>

        {!generatedInvite ? (
          <form onSubmit={handleCreateInvite} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Campo: Tipo de Usuário (Apenas Admin) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>
                Tipo de Usuário
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)'
              }}>
                <ShieldCheck size={18} color="var(--color-primary)" />
                <span style={{ fontWeight: 600, color: 'var(--text-main)', flex: 1 }}>Admin</span>
                <span style={{
                  fontSize: '0.72rem',
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  color: '#a5b4fc',
                  padding: '2px 8px',
                  borderRadius: '50px',
                  fontWeight: 600
                }}>
                  Fixo
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                * O Super Admin é exclusivo das variáveis de ambiente e não pode ser gerado via convite.
              </p>
            </div>

            {/* Campo: Tempo para Expirar */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 10, fontWeight: 500 }}>
                <Clock size={15} /> Tempo para expirar o link
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[24, 48, 72, 96].map((hours) => (
                  <button
                    key={hours}
                    type="button"
                    onClick={() => setExpiresInHours(hours)}
                    data-testid={`invite-expiry-${hours}`}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 'var(--radius-md)',
                      background: expiresInHours === hours ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                      border: expiresInHours === hours ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                      color: expiresInHours === hours ? '#fff' : 'var(--text-muted)',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'var(--transition-smooth)',
                      textAlign: 'center'
                    }}
                  >
                    {hours}h
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                O link perderá a validade automaticamente após {expiresInHours} horas da criação.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
              <button
                type="button"
                onClick={handleResetModal}
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                data-testid="btn-generate-invite"
                style={{ flex: 1.4, justifyContent: 'center' }}
              >
                {loading ? <div className="spinner" /> : (
                  <>
                    <Sparkles size={16} /> Gerar Convite
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Visualização do Convite Gerado */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }} data-testid="invite-generated-result">
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              padding: '16px',
              borderRadius: 'var(--radius-md)'
            }}>
              <p style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 600, marginBottom: 4 }}>
                Link gerado com sucesso!
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Envie o endereço abaixo para o novo administrador. Válido por {expiresInHours} horas.
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>
                Link de Cadastro
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  readOnly
                  value={generatedInvite.fullUrl}
                  data-testid="generated-invite-input"
                  className="input-field"
                  style={{
                    fontSize: '0.82rem',
                    fontFamily: 'monospace',
                    background: 'rgba(0, 0, 0, 0.3)',
                    color: '#a5b4fc'
                  }}
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  data-testid="btn-copy-invite-link"
                  className={copied ? "btn-primary" : "btn-secondary"}
                  style={{
                    padding: '0 16px',
                    whiteSpace: 'nowrap',
                    gap: 6
                  }}
                  title="Copiar Link"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span>Tipo: <strong>Admin</strong></span>
              <span>Expira em: <strong>{formatBrasiliaDateTime(generatedInvite.expires_at)}</strong></span>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setGeneratedInvite(null)}
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Gerar Outro
              </button>
              <button
                type="button"
                onClick={handleResetModal}
                className="btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Concluir
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
