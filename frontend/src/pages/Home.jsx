import React, { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
import { BookOpen, Calendar } from 'lucide-react';
import Pagination from '../components/Pagination';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();

  const PAGE_SIZE = 20;

  const tagParam = searchParams.get('tag');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await api.getPosts();
        setPosts(data.filter(p => p.published));
      } catch (err) {
        console.error('Erro ao carregar posts na Home:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  // Sincroniza o estado do filtro com a query string
  useEffect(() => {
    if (tagParam) {
      setSelectedTag(tagParam);
    } else {
      setSelectedTag(null);
    }
  }, [tagParam]);

  // Lista única de todas as tags dos posts
  const allTags = useMemo(() => {
    const tagsSet = new Set();
    posts.forEach(post => {
      if (post.tags) {
        post.tags.split(',').forEach(tag => {
          const trimmed = tag.trim();
          if (trimmed) tagsSet.add(trimmed);
        });
      }
    });
    return Array.from(tagsSet);
  }, [posts]);

  // Posts filtrados
  const filteredPosts = useMemo(() => {
    if (!selectedTag) return posts;
    return posts.filter(post => {
      if (!post.tags) return false;
      return post.tags.split(',').map(t => t.trim()).includes(selectedTag);
    });
  }, [posts, selectedTag]);

  // Posts paginados para a página atual (20 posts por página)
  const paginatedPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredPosts.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredPosts, currentPage, PAGE_SIZE]);

  const handleTagSelect = (tag) => {
    setCurrentPage(1);
    if (tag) {
      setSearchParams({ tag });
    } else {
      setSearchParams({});
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };

  return (
    <div style={{ padding: '48px 0 100px', minHeight: '80vh', position: 'relative' }}>
      <div className="container" style={{ maxWidth: '1000px' }}>
        
        {/* Cabeçalho da Página */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 16, 
          marginBottom: 48,
          animation: 'slideIn 0.5s ease-out'
        }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '50%',
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)'
            }}>
              <BookOpen size={20} />
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }} className="gradient-text">
              Artigos & Estudos de Caso
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '600px' }}>
            Explore e analise estudos de caso de interfaces premium, conversões de funil e design systems construídos sob medida.
          </p>
        </div>
        
        {/* Barra de Filtros por Tags */}
        {!loading && allTags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 36, alignItems: 'center', animation: 'fadeIn 0.4s ease' }} data-testid="tags-filter-bar">
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filtros:</span>
            <button
              onClick={() => handleTagSelect(null)}
              data-testid="filter-tag-all"
              style={{
                background: selectedTag === null ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.02)',
                border: selectedTag === null ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid var(--border-color)',
                color: selectedTag === null ? '#a5b4fc' : 'var(--text-muted)',
                padding: '6px 16px',
                borderRadius: '50px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'var(--transition-smooth)'
              }}
            >
              Todos os posts
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagSelect(tag)}
                data-testid={`filter-tag-${tag}`}
                style={{
                  background: selectedTag === tag ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.02)',
                  border: selectedTag === tag ? '1px solid rgba(139, 92, 246, 0.35)' : '1px solid var(--border-color)',
                  color: selectedTag === tag ? '#c4b5fd' : 'var(--text-muted)',
                  padding: '6px 16px',
                  borderRadius: '50px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Listagem de Posts */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
            <div className="spinner" style={{ width: 44, height: 44, color: 'var(--color-primary)' }}></div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="glass-panel" style={{ padding: '60px 40px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
              {selectedTag ? `Nenhum artigo publicado com a tag "${selectedTag}".` : "Nenhum artigo publicado ainda. Fique atento às próximas atualizações!"}
            </p>
          </div>
        ) : (
          <div 
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: 24,
              paddingBottom: 24,
              overflowX: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
            className="blog-horizontal-scroll"
          >
            {paginatedPosts.map((post) => (
              <Link
                key={post.id}
                to={`/post/${post.slug}`}
                className="glass-panel glass-panel-hover"
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 20,
                  padding: '20px',
                  width: '380px',
                  minHeight: '130px',
                  flexShrink: 0,
                  borderRadius: '16px',
                  cursor: 'pointer',
                  textDecoration: 'none'
                }}
              >
                {post.cover_image_url ? (
                  <div style={{ width: 90, height: 90, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                    <img 
                      src={post.cover_image_url} 
                      alt={post.title} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                ) : (
                  <div style={{ 
                    width: 90, 
                    height: 90, 
                    borderRadius: 10, 
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(236, 72, 153, 0.1))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(255, 255, 255, 0.3)',
                    fontSize: '2rem',
                    flexShrink: 0
                  }}>
                    🖥️
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden', flexGrow: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <Calendar size={12} />
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                  
                  <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    lineHeight: '1.35',
                    color: 'var(--text-highlight)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textAlign: 'left'
                  }}>
                    {post.title}
                  </h3>

                  {post.tags && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      {post.tags.split(',').slice(0, 2).map((tag, idx) => (
                        <span 
                          key={idx} 
                          style={{
                            background: 'rgba(139, 92, 246, 0.08)',
                            border: '1px solid rgba(139, 92, 246, 0.15)',
                            color: '#c4b5fd',
                            padding: '2px 8px',
                            borderRadius: '30px',
                            fontSize: '0.68rem',
                            fontWeight: 600
                          }}
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Componente de Paginação (20 por página) */}
        {!loading && filteredPosts.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredPosts.length}
            pageSize={PAGE_SIZE}
            onPageChange={(page) => setCurrentPage(page)}
          />
        )}

      </div>
    </div>
  );
}
