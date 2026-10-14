import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { ArrowLeft, Calendar, User, Share2 } from 'lucide-react';
import { useToast } from '../components/ToastContext';
import CommentsSection from '../components/CommentsSection';

export default function PostDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const data = await api.getPostBySlug(slug);
        setPost(data);
        
        // Atualiza dinamicamente as metatags para indexação e compartilhamento social (SEO)
        document.title = `${data.title} | Aryaraj - Interfaces`;
        
        // Tenta encontrar ou criar meta tag de descrição
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.name = 'description';
          document.head.appendChild(metaDesc);
        }
        metaDesc.content = data.summary;
        
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Link do post copiado para a área de transferência!');
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };

  if (loading) {
    return (
      <div className="container flex-center" style={{ minHeight: '60vh' }}>
        <div className="spinner" style={{ width: 40, height: 40, color: 'var(--color-primary)' }}></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: 16 }}>Erro ao carregar o post</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>{error || 'Post não encontrado.'}</p>
        <Link to="/" className="btn-primary">
          <ArrowLeft size={16} /> Voltar para a Home
        </Link>
      </div>
    );
  }

  return (
    <article style={{ paddingBottom: 100 }}>
      {/* Post Banner */}
      <div style={{ position: 'relative', width: '100%', height: '400px', background: '#0a0d17', overflow: 'hidden' }}>
        {post.cover_image_url ? (
          <img 
            src={post.cover_image_url} 
            alt={post.title} 
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #1e1b4b, #0c0a0f)',
            opacity: 0.7
          }} />
        )}
        
        {/* Banner Overlay */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '100%',
          background: 'linear-gradient(to top, var(--bg-main) 0%, rgba(6, 8, 15, 0.4) 60%, rgba(6, 8, 15, 0) 100%)',
          display: 'flex',
          alignItems: 'flex-end',
          paddingBottom: 40
        }}>
          <div className="container">
            <Link 
              to="/" 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: 'var(--color-primary)',
                fontSize: '0.9rem',
                fontWeight: 600,
                marginBottom: 24,
                transition: 'var(--transition-smooth)'
              }}
              className="back-link"
            >
              <ArrowLeft size={16} /> Voltar para a Home
            </Link>
            
            {post.tags && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {post.tags.split(',').map((tag, idx) => (
                  <Link 
                    key={idx} 
                    to={`/?tag=${encodeURIComponent(tag.trim())}`}
                    style={{
                      background: 'rgba(139, 92, 246, 0.12)',
                      border: '1px solid rgba(139, 92, 246, 0.25)',
                      color: '#c4b5fd',
                      padding: '4px 12px',
                      borderRadius: '50px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      letterSpacing: '0.03em',
                      textDecoration: 'none',
                      transition: 'var(--transition-smooth)'
                    }}
                    className="tag-badge"
                  >
                    {tag.trim()}
                  </Link>
                ))}
              </div>
            )}
            
            <h1 style={{ fontSize: '3rem', lineHeight: 1.2, fontWeight: 800, marginBottom: 20 }}>
              {post.title}
            </h1>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={16} />
                <span>{formatDate(post.created_at)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={16} />
                <span>Escrito por Aryaraj</span>
              </div>
              <button 
                onClick={handleShare}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <Share2 size={16} />
                Compartilhar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container" style={{ marginTop: 40, maxWidth: '800px' }}>
        {/* Render content: simples mapeamento se o usuário salvar Markdown/HTML básico */}
        <div 
          style={{
            fontSize: '1.1rem',
            lineHeight: 1.8,
            color: 'var(--text-main)'
          }}
          className="post-content-body"
        >
          {/* Quebra linhas de texto para renderizar blocos simples em parágrafos se não for HTML */}
          {post.content.startsWith('<') ? (
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          ) : (
            post.content.split('\n\n').map((paragraph, idx) => {
              if (paragraph.startsWith('# ')) {
                return <h2 key={idx} style={{ fontSize: '1.8rem', marginTop: 32, marginBottom: 16 }}>{paragraph.replace('# ', '')}</h2>;
              } else if (paragraph.startsWith('## ')) {
                return <h3 key={idx} style={{ fontSize: '1.4rem', marginTop: 28, marginBottom: 12 }}>{paragraph.replace('## ', '')}</h3>;
              } else if (paragraph.startsWith('### ')) {
                return <h4 key={idx} style={{ fontSize: '1.2rem', marginTop: 24, marginBottom: 10 }}>{paragraph.replace('### ', '')}</h4>;
              } else if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
                return (
                  <ul key={idx} style={{ marginLeft: 24, marginBottom: 16 }}>
                    {paragraph.split('\n').map((li, lIdx) => (
                      <li key={lIdx} style={{ marginBottom: 6 }}>{li.replace(/^[-*]\s+/, '')}</li>
                    ))}
                  </ul>
                );
              }
              return <p key={idx} style={{ marginBottom: 20 }}>{paragraph}</p>;
            })
          )}
        </div>

        <CommentsSection postId={post.id} />
      </div>
    </article>
  );
}
