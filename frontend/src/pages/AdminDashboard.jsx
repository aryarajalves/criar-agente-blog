import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useToast } from '../components/ToastContext';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import PostForm from '../components/PostForm';
import Pagination from '../components/Pagination';
import { Plus, Edit, Trash2, Eye, CheckCircle, FileWarning } from 'lucide-react';

const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  let normalizedString = dateString;
  if (!dateString.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(dateString)) {
    normalizedString = dateString + 'Z';
  }
  const date = new Date(normalizedString);
  return date.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentView, setCurrentView] = useState('list'); // 'list' | 'create' | 'edit'
  const [selectedPost, setSelectedPost] = useState(null);

  const PAGE_SIZE = 20;
  
  // Estado do Modal de Exclusão
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchPosts();
  }, [navigate]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminPosts();
      setPosts(data);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Erro ao carregar dados.', 'error');
      if (err.message.includes('Não autorizado')) {
        localStorage.clear();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateView = () => {
    setSelectedPost(null);
    setCurrentView('create');
  };

  const handleOpenEditView = (post) => {
    setSelectedPost(post);
    setCurrentView('edit');
  };

  const handleSavePost = async (postData) => {
    try {
      if (currentView === 'create') {
        await api.createPost(postData);
        showToast('Post criado com sucesso!');
      } else {
        await api.updatePost(selectedPost.id, postData);
        showToast('Post atualizado com sucesso!');
      }
      setCurrentView('list');
      fetchPosts();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Erro ao salvar o post.', 'error');
      throw err; // Relança o erro para o PostForm interromper o loading
    }
  };

  // Exclusão protegida conforme a regra do popup
  const handleOpenDeleteModal = (post) => {
    setPostToDelete(post);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!postToDelete) return;
    try {
      await api.deletePost(postToDelete.id);
      showToast('Post excluído permanentemente.');
      setDeleteModalOpen(false);
      setPostToDelete(null);
      fetchPosts();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Erro ao excluir o post.', 'error');
    }
  };

  return (
    <div className="container" style={{ padding: '40px 24px 100px' }}>
      
      {/* View de Listagem */}
      {currentView === 'list' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36 }}>
            <div>
              <h1 style={{ fontSize: '2rem' }}>Gerenciamento de Posts</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Crie e edite seus cases de interfaces.</p>
            </div>
            
            <button onClick={handleOpenCreateView} className="btn-primary" data-testid="new-post-btn">
              <Plus size={16} /> Novo Post
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <div className="spinner" style={{ width: 40, height: 40, color: 'var(--color-primary)' }}></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Nenhum post no banco de dados. Clique em "Novo Post" para começar!
            </div>
          ) : (
            <>
              <div className="glass-panel" style={{ overflow: 'hidden', padding: '10px 0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '16px 24px' }}>Título</th>
                      <th style={{ padding: '16px 24px' }}>Slug</th>
                      <th style={{ padding: '16px 24px' }}>Status</th>
                      <th style={{ padding: '16px 24px' }}>Última Atualização</th>
                      <th style={{ padding: '16px 24px', textAlign: 'right' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((post) => (
                      <tr key={post.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'var(--transition-smooth)' }} className="table-row">
                        <td style={{ padding: '16px 24px', fontWeight: 600 }}>{post.title}</td>
                        <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>{post.slug}</td>
                        <td style={{ padding: '16px 24px' }}>
                          {post.published ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#34d399', fontSize: '0.85rem' }}>
                              <CheckCircle size={14} /> Publicado
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#f59e0b', fontSize: '0.85rem' }}>
                              <FileWarning size={14} /> Rascunho
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '16px 24px', color: 'var(--text-muted)' }}>
                          {formatDateTime(post.updated_at)}
                        </td>
                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <a href={`/post/${post.slug}`} target="_blank" rel="noreferrer" className="btn-secondary" style={{ padding: 8 }}>
                              <Eye size={14} />
                            </a>
                            <button onClick={() => handleOpenEditView(post)} className="btn-secondary" style={{ padding: 8, color: 'var(--color-primary)' }} data-testid={`edit-post-${post.id}`}>
                              <Edit size={14} />
                            </button>
                            <button onClick={() => handleOpenDeleteModal(post)} className="btn-secondary" style={{ padding: 8, color: '#f87171', background: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.1)' }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginação da lista de posts (20 por página) */}
              {posts.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalItems={posts.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={(page) => setCurrentPage(page)}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* View de Criação ou Edição */}
      {(currentView === 'create' || currentView === 'edit') && (
        <PostForm 
          post={selectedPost} 
          onSave={handleSavePost} 
          onCancel={() => setCurrentView('list')} 
        />
      )}

      {/* Modal de Exclusão Padrão do Sistema */}
      <DeleteConfirmationModal 
        isOpen={deleteModalOpen}
        title={postToDelete?.title || ''}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setPostToDelete(null);
        }}
      />
    </div>
  );
}
