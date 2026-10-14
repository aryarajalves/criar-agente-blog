import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { useToast } from './ToastContext';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import { MessageSquare, Send, Trash2, AlertTriangle, Camera } from 'lucide-react';

const DEFAULT_AVATAR = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23a855f7"/><stop offset="100%" stop-color="%236366f1"/></linearGradient></defs><rect width="100" height="100" fill="url(%23g)"/><circle cx="50" cy="40" r="18" fill="%23ffffff" opacity="0.95"/><path d="M20 85c0-15 12-25 30-25s30 10 30 25" fill="%23ffffff" opacity="0.95"/></svg>`;

export default function CommentsSection({ postId }) {
  const [comments, setComments] = useState([]);
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [content, setContent] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);

  useLockBodyScroll(!!commentToDelete);
  
  const { showToast } = useToast();
  const isAdmin = !!localStorage.getItem('token');

  const fetchComments = async () => {
    try {
      setFetching(true);
      const data = await api.getComments(postId);
      setComments(data);
    } catch (err) {
      console.error(err);
      if (err.message !== 'Post não encontrado.') {
        showToast(err.message || 'Erro ao carregar comentários.', 'error');
      }
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (postId) {
      fetchComments();
    }
  }, [postId]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Por favor, selecione uma imagem válida.', 'error');
      return;
    }

    try {
      setUploadingAvatar(true);
      const res = await api.uploadAvatar(file);
      setAvatarUrl(res.url);
      showToast('Foto de perfil carregada com sucesso!');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Erro ao carregar imagem de perfil.', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!authorName.trim() || !content.trim()) {
      showToast('Nome e Comentário são obrigatórios.', 'error');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        post_id: postId,
        author_name: authorName.trim(),
        author_email: authorEmail.trim() || null,
        content: content.trim(),
        author_avatar_url: avatarUrl || null
      };
      
      const newComment = await api.createComment(payload);
      showToast('Comentário enviado com sucesso!');
      setComments((prev) => [...prev, newComment]);
      
      setAuthorName('');
      setAuthorEmail('');
      setContent('');
      setAvatarUrl('');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Erro ao enviar comentário.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (comment) => {
    setCommentToDelete(comment);
  };

  const confirmDelete = async () => {
    if (!commentToDelete) return;
    try {
      setLoading(true);
      await api.deleteComment(commentToDelete.id);
      showToast('Comentário excluído com sucesso!');
      setComments((prev) => prev.filter((c) => c.id !== commentToDelete.id));
      setCommentToDelete(null);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Erro ao excluir comentário.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setCommentToDelete(null);
  };

  const formatDate = (dateString) => {
    let dateStr = dateString;
    if (dateStr && !dateStr.endsWith('Z') && !dateStr.includes('+')) {
      dateStr += 'Z';
    }
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateStr).toLocaleDateString('pt-BR', options);
  };

  return (
    <section style={{
      marginTop: 60,
      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      paddingTop: 40,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 30 }}>
        <MessageSquare size={22} style={{ color: 'var(--color-primary)' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
          Comentários ({comments.length})
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 40 }}>
        {fetching ? (
          <div className="flex-center" style={{ padding: '20px 0' }}>
            <div className="spinner" style={{ width: 30, height: 30, color: 'var(--color-primary)' }}></div>
          </div>
        ) : comments.length === 0 ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px dashed rgba(255, 255, 255, 0.08)',
            borderRadius: 12,
            padding: 30,
            textAlign: 'center',
            color: 'var(--text-muted)'
          }}>
            Nenhum comentário ainda. Seja o primeiro a enriquecer este post!
          </div>
        ) : (
          comments.map((comment) => (
            <div 
              key={comment.id}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 16,
                padding: 20,
                display: 'flex',
                gap: 16,
                position: 'relative',
              }}
              className="comment-card"
            >
              <img
                src={comment.author_avatar_url || DEFAULT_AVATAR}
                alt={comment.author_name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = DEFAULT_AVATAR;
                }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  flexShrink: 0
                }}
              />
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{comment.author_name}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>• {formatDate(comment.created_at)}</span>
                </div>
                <p style={{ 
                  margin: 0, 
                  fontSize: '0.95rem', 
                  lineHeight: 1.6, 
                  color: 'rgba(255, 255, 255, 0.85)',
                  whiteSpace: 'pre-line' 
                }}>
                  {comment.content}
                </p>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleDeleteClick(comment)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(239, 68, 68, 0.6)',
                    cursor: 'pointer',
                    position: 'absolute',
                    top: 20,
                    right: 20,
                    padding: 4,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  className="delete-comment-btn"
                  title="Excluir Comentário"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        padding: 30,
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
      }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 20 }}>
          Deixe seu comentário
        </h3>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <input
                id="comment-avatar-input"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={loading || uploadingAvatar}
                style={{ display: 'none' }}
              />
              <label
                htmlFor="comment-avatar-input"
                style={{
                  display: 'block',
                  width: 70,
                  height: 70,
                  borderRadius: '50%',
                  cursor: (loading || uploadingAvatar) ? 'not-allowed' : 'pointer',
                  border: '2px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  overflow: 'hidden',
                  position: 'relative',
                  transition: 'border-color 0.2s ease, transform 0.2s ease'
                }}
                className="avatar-upload-label"
                title="Escolha uma foto de perfil"
              >
                {uploadingAvatar ? (
                  <div className="flex-center" style={{ width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="spinner" style={{ width: 20, height: 20, borderTopColor: '#ffffff' }}></div>
                  </div>
                ) : (
                  <img
                    src={avatarUrl || DEFAULT_AVATAR}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
                
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  background: 'var(--color-primary, #a855f7)',
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #06080f',
                  color: '#ffffff',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                }}>
                  <Camera size={11} />
                </div>
              </label>
            </div>

            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, minWidth: '250px' }}>
              <div>
                <label htmlFor="comment-author" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                  Nome *
                </label>
                <input
                  id="comment-author"
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Seu nome"
                  disabled={loading || uploadingAvatar}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                  }}
                />
              </div>
              
              <div>
                <label htmlFor="comment-email" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                  E-mail (opcional, não será publicado)
                </label>
                <input
                  id="comment-email"
                  type="email"
                  value={authorEmail}
                  onChange={(e) => setAuthorEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  disabled={loading || uploadingAvatar}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="comment-content" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8 }}>
              Comentário *
            </label>
            <textarea
              id="comment-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva aqui seu comentário..."
              rows={4}
              disabled={loading || uploadingAvatar}
              required
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontSize: '0.95rem',
                lineHeight: 1.5,
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifycontent: 'flex-end', justifyContent: 'flex-end' }}>
            <button
              id="submit-comment-button"
              type="submit"
              disabled={loading || uploadingAvatar}
              className="btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 24px',
                fontWeight: 600,
                cursor: (loading || uploadingAvatar) ? 'not-allowed' : 'pointer',
                opacity: (loading || uploadingAvatar) ? 0.7 : 1
              }}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16, borderTopColor: '#ffffff' }}></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Send size={16} /> Enviar Comentário
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {commentToDelete && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              width: 56,
              height: 56,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#ef4444'
            }}>
              <AlertTriangle size={24} />
            </div>

            <h3 style={{ fontSize: '1.25rem', marginBottom: 12, textAlign: 'center' }}>Excluir Comentário?</h3>
            
            <p style={{ 
              fontSize: '0.9rem', 
              color: 'var(--text-muted)', 
              marginBottom: 28,
              lineHeight: 1.5,
              textAlign: 'center'
            }}>
              Tem certeza que deseja excluir o comentário de "{commentToDelete.author_name}"? Esta ação não pode ser desfeita e removerá permanentemente o conteúdo.
            </p>

            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                type="button"
                className="btn-secondary" 
                onClick={cancelDelete}
                style={{ flex: 1, justifyContent: 'center' }}
                disabled={loading}
              >
                Cancelar
              </button>
              
              <button 
                type="button"
                className="btn-primary" 
                onClick={confirmDelete}
                disabled={loading}
                style={{ 
                  flex: 1, 
                  justifyContent: 'center', 
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  boxShadow: '0 4px 15px -3px rgba(239, 68, 68, 0.4)'
                }}
              >
                {loading ? 'Excluindo...' : (
                  <>
                    <Trash2 size={16} /> Excluir
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
