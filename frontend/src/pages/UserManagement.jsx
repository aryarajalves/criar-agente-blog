import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useToast } from '../components/ToastContext';
import { formatBrasiliaDateTime, parseUtcDate } from '../utils/date';
import GenerateInviteModal from '../components/GenerateInviteModal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Crown, 
  Trash2, 
  Clock, 
  Copy, 
  Check, 
  CheckCircle2, 
  XCircle, 
  AlertCircle 
} from 'lucide-react';

export default function UserManagement() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'invites'
  
  // Modais
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [copiedToken, setCopiedToken] = useState(null);

  const currentUserEmail = localStorage.getItem('email');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, invitesData] = await Promise.all([
        api.getUsers(),
        api.getInvites(),
      ]);
      setUsers(usersData);
      setInvites(invitesData);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Erro ao carregar dados de usuários.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDelete = (user) => {
    if (user.role === 'super_admin') {
      showToast('O Super Admin não pode ser excluído.', 'error');
      return;
    }
    if (user.email === currentUserEmail) {
      showToast('Você não pode excluir sua própria conta.', 'error');
      return;
    }
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await api.deleteUser(userToDelete.id);
      showToast(`Usuário ${userToDelete.username} excluído com sucesso.`);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      loadData();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Erro ao excluir usuário.', 'error');
    }
  };

  const handleCopyInviteLink = (token) => {
    const fullUrl = `${window.location.origin}/convite/${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    showToast('Link de convite copiado!');
    setTimeout(() => setCopiedToken(null), 3000);
  };

  const formatDate = (dateString) => {
    return formatBrasiliaDateTime(dateString);
  };

  const getInviteStatus = (invite) => {
    if (invite.used) {
      return { label: 'Utilizado', color: '#9ca3af', bg: 'rgba(156, 163, 175, 0.15)', icon: CheckCircle2 };
    }
    const expDate = parseUtcDate(invite.expires_at);
    const isExpired = expDate ? expDate < new Date() : false;
    if (isExpired) {
      return { label: 'Expirado', color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', icon: XCircle };
    }
    return { label: 'Ativo', color: '#34d399', bg: 'rgba(16, 185, 129, 0.15)', icon: Clock };
  };

  return (
    <div style={{ padding: '48px 0 100px', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '1100px' }}>
        
        {/* Cabeçalho */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 20,
          marginBottom: 36
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                width: 42,
                height: 42,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)'
              }}>
                <Users size={22} />
              </div>
              <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }} className="gradient-text">
                Gestão de Usuários
              </h1>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '600px' }}>
              Gerencie permissões de acesso, monitore contas ativas e gere links de convite para novos administradores.
            </p>
          </div>

          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="btn-primary"
            data-testid="btn-open-invite-modal"
            style={{ padding: '12px 20px', gap: 8 }}
          >
            <UserPlus size={18} />
            <span>Gerar Convite</span>
          </button>
        </div>

        {/* Abas: Usuários vs Convites */}
        <div style={{
          display: 'flex',
          gap: 12,
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: 16,
          marginBottom: 28
        }}>
          <button
            onClick={() => setActiveTab('users')}
            data-testid="tab-users"
            className={activeTab === 'users' ? "btn-secondary" : "nav-link"}
            style={activeTab === 'users' ? {
              padding: '8px 18px',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(99, 102, 241, 0.15)',
              borderColor: 'rgba(99, 102, 241, 0.35)',
              color: '#fff'
            } : {
              background: 'none',
              border: 'none',
              padding: '8px 14px',
              fontSize: '0.9rem',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <ShieldCheck size={16} />
            <span>Usuários Ativos ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('invites')}
            data-testid="tab-invites"
            className={activeTab === 'invites' ? "btn-secondary" : "nav-link"}
            style={activeTab === 'invites' ? {
              padding: '8px 18px',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(99, 102, 241, 0.15)',
              borderColor: 'rgba(99, 102, 241, 0.35)',
              color: '#fff'
            } : {
              background: 'none',
              border: 'none',
              padding: '8px 14px',
              fontSize: '0.9rem',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <Clock size={16} />
            <span>Histórico de Convites ({invites.length})</span>
          </button>
        </div>

        {loading ? (
          <div className="flex-center" style={{ minHeight: '300px' }}>
            <div className="spinner" style={{ width: 36, height: 36, color: 'var(--color-primary)' }} />
          </div>
        ) : (
          <>
            {/* Tabela de Usuários */}
            {activeTab === 'users' && (
              <div className="glass-panel" style={{ overflow: 'hidden' }} data-testid="users-table-container">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderBottom: '1px solid var(--border-color)',
                      color: 'var(--text-muted)',
                      fontSize: '0.8rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      <th style={{ padding: '16px 20px' }}>Usuário</th>
                      <th style={{ padding: '16px 20px' }}>E-mail</th>
                      <th style={{ padding: '16px 20px' }}>Função</th>
                      <th style={{ padding: '16px 20px' }}>Cadastrado Em</th>
                      <th style={{ padding: '16px 20px', textAlign: 'right' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      const isSuper = user.role === 'super_admin';
                      const isMe = user.email === currentUserEmail;

                      return (
                        <tr 
                          key={user.id} 
                          data-testid={`user-row-${user.id}`}
                          style={{
                            borderBottom: '1px solid var(--border-color)',
                            transition: 'var(--transition-smooth)'
                          }}
                        >
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{
                                width: 34,
                                height: 34,
                                borderRadius: '50%',
                                background: isSuper 
                                  ? 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' 
                                  : 'rgba(255, 255, 255, 0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                color: '#fff'
                              }}>
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span style={{ fontWeight: 600, color: 'var(--text-main)', display: 'block' }}>
                                  {user.username}
                                </span>
                                {isMe && (
                                  <span style={{ fontSize: '0.72rem', color: 'var(--color-primary)' }}>
                                    (Você)
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            {user.email}
                          </td>

                          <td style={{ padding: '16px 20px' }}>
                            {isSuper ? (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '4px 12px',
                                borderRadius: '50px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                letterSpacing: '0.04em',
                                background: 'rgba(236, 72, 153, 0.15)',
                                border: '1px solid rgba(236, 72, 153, 0.3)',
                                color: '#f472b6'
                              }}>
                                <Crown size={13} /> SUPER ADMIN
                              </span>
                            ) : (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '4px 12px',
                                borderRadius: '50px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                background: 'rgba(99, 102, 241, 0.12)',
                                border: '1px solid rgba(99, 102, 241, 0.25)',
                                color: '#a5b4fc'
                              }}>
                                <ShieldCheck size={13} /> ADMIN
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {formatDate(user.created_at)}
                          </td>

                          <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                            {isSuper ? (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                Fixo do Sistema
                              </span>
                            ) : isMe ? (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                Sessão Ativa
                              </span>
                            ) : (
                              <button
                                onClick={() => handleOpenDelete(user)}
                                data-testid={`btn-delete-user-${user.id}`}
                                className="sidebar-logout-btn"
                                style={{
                                  display: 'inline-flex',
                                  padding: '6px 12px',
                                  fontSize: '0.78rem',
                                  gap: 6
                                }}
                                title="Excluir Usuário"
                              >
                                <Trash2 size={14} /> Excluir
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tabela de Convites */}
            {activeTab === 'invites' && (
              <div className="glass-panel" style={{ overflow: 'hidden' }} data-testid="invites-table-container">
                {invites.length === 0 ? (
                  <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <p style={{ marginBottom: 12 }}>Nenhum convite foi gerado ainda.</p>
                    <button
                      onClick={() => setIsInviteModalOpen(true)}
                      className="btn-primary"
                      style={{ fontSize: '0.85rem', padding: '8px 16px' }}
                    >
                      Gerar Primeiro Convite
                    </button>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderBottom: '1px solid var(--border-color)',
                        color: 'var(--text-muted)',
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        <th style={{ padding: '16px 20px' }}>Link / Token</th>
                        <th style={{ padding: '16px 20px' }}>Função</th>
                        <th style={{ padding: '16px 20px' }}>Status</th>
                        <th style={{ padding: '16px 20px' }}>Expira Em</th>
                        <th style={{ padding: '16px 20px', textAlign: 'right' }}>Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invites.map((invite) => {
                        const statusInfo = getInviteStatus(invite);
                        const StatusIcon = statusInfo.icon;
                        const isCopied = copiedToken === invite.token;

                        return (
                          <tr 
                            key={invite.id} 
                            style={{ borderBottom: '1px solid var(--border-color)' }}
                            data-testid={`invite-row-${invite.id}`}
                          >
                            <td style={{ padding: '16px 20px' }}>
                              <span style={{
                                fontFamily: 'monospace',
                                fontSize: '0.82rem',
                                color: '#a5b4fc',
                                background: 'rgba(0, 0, 0, 0.3)',
                                padding: '4px 8px',
                                borderRadius: '4px'
                              }}>
                                ...{invite.token.substring(invite.token.length - 12)}
                              </span>
                              {invite.used_by_email && (
                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                  Usado por: {invite.used_by_email}
                                </span>
                              )}
                            </td>

                            <td style={{ padding: '16px 20px', fontSize: '0.85rem' }}>
                              <strong style={{ color: 'var(--text-main)' }}>Admin</strong>
                            </td>

                            <td style={{ padding: '16px 20px' }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '3px 10px',
                                borderRadius: '50px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                background: statusInfo.bg,
                                color: statusInfo.color
                              }}>
                                <StatusIcon size={12} /> {statusInfo.label}
                              </span>
                            </td>

                            <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              {formatDate(invite.expires_at)}
                            </td>

                            <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                              {!invite.used && parseUtcDate(invite.expires_at) > new Date() && (
                                <button
                                  onClick={() => handleCopyInviteLink(invite.token)}
                                  className={isCopied ? "btn-primary" : "btn-secondary"}
                                  data-testid={`btn-copy-invite-${invite.id}`}
                                  style={{
                                    display: 'inline-flex',
                                    padding: '6px 12px',
                                    fontSize: '0.78rem',
                                    gap: 6
                                  }}
                                  title="Copiar Link"
                                >
                                  {isCopied ? <Check size={14} /> : <Copy size={14} />}
                                  {isCopied ? 'Copiado!' : 'Copiar'}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}

        {/* Modal de Geração de Convite */}
        <GenerateInviteModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          onInviteCreated={() => loadData()}
        />

        {/* Modal de Exclusão de Usuário */}
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setIsDeleteModalOpen(false);
            setUserToDelete(null);
          }}
          title="Excluir Usuário"
          message={`Tem certeza que deseja excluir o usuário "${userToDelete?.username}" (${userToDelete?.email})? Esta ação não pode ser desfeita.`}
        />
      </div>
    </div>
  );
}
