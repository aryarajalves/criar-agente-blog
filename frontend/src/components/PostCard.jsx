import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight } from 'lucide-react';

export default function PostCard({ post }) {
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };

  return (
    <article 
      className="glass-panel glass-panel-hover" 
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#131825', overflow: 'hidden' }}>
        {post.cover_image_url ? (
          <img 
            src={post.cover_image_url} 
            alt={post.title} 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'var(--transition-smooth)'
            }} 
            className="card-image"
          />
        ) : (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(236, 72, 153, 0.1))',
            color: 'rgba(255, 255, 255, 0.2)',
            fontSize: '3rem'
          }}>
            🖥️
          </div>
        )}
      </div>

      <div style={{ padding: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={12} />
            <span>{formatDate(post.created_at)}</span>
          </div>
          {post.tags && (
            <div style={{ display: 'flex', gap: 6 }}>
              {post.tags.split(',').slice(0, 2).map((tag, idx) => (
                <span 
                  key={idx} 
                  style={{
                    background: 'rgba(139, 92, 246, 0.08)',
                    border: '1px solid rgba(139, 92, 246, 0.15)',
                    color: '#c4b5fd',
                    padding: '2px 8px',
                    borderRadius: '30px',
                    fontSize: '0.7rem',
                    fontWeight: 600
                  }}
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>

        <h3 style={{
          fontSize: '1.25rem',
          lineHeight: 1.4,
          marginBottom: 10,
          fontWeight: 700
        }}>
          <Link to={`/post/${post.slug}`} className="hover-underline">
            {post.title}
          </Link>
        </h3>

        <p style={{
          fontSize: '0.9rem',
          color: 'var(--text-muted)',
          marginBottom: 20,
          flexGrow: 1,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {post.summary}
        </p>

        <Link 
          to={`/post/${post.slug}`} 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--color-primary)',
            transition: 'var(--transition-smooth)'
          }}
          className="read-more-link"
        >
          Ver Estudo de Caso <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
}
