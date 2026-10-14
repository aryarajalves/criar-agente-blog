import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { useToast } from './ToastContext';
import AiWriterPanel from './AiWriterPanel';
import ContentMaximizeModal from './ContentMaximizeModal';
import { ArrowLeft, Save, Upload, X, Sparkles, Maximize2 } from 'lucide-react';

export default function PostForm({ post, onSave, onCancel }) {
  const { showToast } = useToast();
  
  // Estados do formulário
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [tags, setTags] = useState('');
  const [published, setPublished] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  // Estados de upload de imagem
  const [activeImageTab, setActiveImageTab] = useState('upload'); // 'upload' | 'url'
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  // Estados da IA e do Modal de Conteúdo
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [maximizeConfig, setMaximizeConfig] = useState({
    isOpen: false,
    title: '',
    subtitle: '',
    value: '',
    isTextarea: true,
    isMarkdown: false,
    onChange: () => {}
  });

  // Inicializa o formulário se estiver em modo de edição
  useEffect(() => {
    if (post) {
      setTitle(post.title || '');
      setSlug(post.slug || '');
      setSummary(post.summary || '');
      setContent(post.content || '');
      setCoverImageUrl(post.cover_image_url || '');
      setTags(post.tags || '');
      setPublished(!!post.published);
      if (post.cover_image_url && !post.cover_image_url.includes('/static/uploads/')) {
        setActiveImageTab('url');
      } else {
        setActiveImageTab('upload');
      }
    } else {
      // Limpa os campos se for criação
      setTitle('');
      setSlug('');
      setSummary('');
      setContent('');
      setCoverImageUrl('');
      setTags('');
      setPublished(false);
      setActiveImageTab('upload');
    }
  }, [post]);

  const handleOpenMaximize = (fieldLabel, fieldValue, setFieldVal, isTextarea, isMarkdown) => {
    setMaximizeConfig({
      isOpen: true,
      title: `Editar ${fieldLabel}`,
      subtitle: `Modo expandido de edição para o campo ${fieldLabel.toLowerCase()}`,
      value: fieldValue,
      isTextarea,
      isMarkdown,
      onChange: (newValue) => {
        setFieldVal(newValue);
        setMaximizeConfig(prev => ({ ...prev, value: newValue }));
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !summary || !content) {
      showToast('Por favor, preencha os campos obrigatórios (Título, Resumo e Conteúdo).', 'error');
      return;
    }

    setFormLoading(true);
    const postData = {
      title,
      slug: slug || undefined,
      summary,
      content,
      cover_image_url: coverImageUrl || null,
      tags: tags || null,
      published
    };

    try {
      await onSave(postData);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Erro ao salvar o post.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Por favor, selecione apenas arquivos de imagem.', 'error');
      return;
    }

    try {
      setImageUploading(true);
      const res = await api.uploadImage(file);
      setCoverImageUrl(res.url);
      showToast('Imagem de capa enviada com sucesso!');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Erro ao fazer upload da imagem.', 'error');
    } finally {
      setImageUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <button type="button" onClick={onCancel} className="btn-secondary" style={{ padding: 10 }}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 style={{ fontSize: '2rem' }}>
            {post ? 'Editar Post' : 'Novo Post'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Preencha as informações do seu caso de interface.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Título do Post */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label htmlFor="post-title" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, margin: 0 }}>Título do Post *</label>
              <button
                type="button"
                data-testid="btn-maximize-title"
                onClick={() => handleOpenMaximize('Título do Post', title, setTitle, false, false)}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <Maximize2 size={11} /> Expandir
              </button>
            </div>
            <input 
              type="text" 
              id="post-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field" 
              placeholder="Ex: Como projetei a interface do Dashboard X"
              required
            />
          </div>

          {/* Slug e Imagem de Capa */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label htmlFor="post-slug" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>Slug da URL (Opcional)</label>
              <input 
                type="text" 
                id="post-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="input-field" 
                placeholder="Ex: dashboard-x-design"
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Imagem de Capa</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setActiveImageTab('upload')}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '0.75rem',
                      color: activeImageTab === 'upload' ? 'var(--color-primary)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      fontWeight: activeImageTab === 'upload' ? 600 : 400,
                      padding: '2px 6px',
                      borderBottom: activeImageTab === 'upload' ? '2px solid var(--color-primary)' : '2px solid transparent',
                      transition: 'all 0.2s'
                    }}
                  >
                    Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveImageTab('url')}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '0.75rem',
                      color: activeImageTab === 'url' ? 'var(--color-primary)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      fontWeight: activeImageTab === 'url' ? 600 : 400,
                      padding: '2px 6px',
                      borderBottom: activeImageTab === 'url' ? '2px solid var(--color-primary)' : '2px solid transparent',
                      transition: 'all 0.2s'
                    }}
                  >
                    Link URL
                  </button>
                </div>
              </div>

              {activeImageTab === 'upload' ? (
                <div style={{ position: 'relative' }}>
                  {coverImageUrl ? (
                    <div style={{
                      position: 'relative',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      overflow: 'hidden',
                      height: '46px',
                      display: 'flex',
                      alignItems: 'center',
                      background: 'rgba(255,255,255,0.02)'
                    }}>
                      <img
                        src={coverImageUrl}
                        alt="Preview da capa"
                        style={{ width: '60px', height: '100%', objectFit: 'cover', borderRight: '1px solid var(--border-color)' }}
                      />
                      <div style={{ padding: '0 12px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Imagem carregada com sucesso
                      </div>
                      <button
                        type="button"
                        onClick={() => setCoverImageUrl('')}
                        aria-label="Remover imagem de capa"
                        data-testid="remove-cover-image"
                        style={{
                          marginRight: '8px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          color: '#f87171',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        border: '1px dashed var(--border-color)',
                        borderRadius: '8px',
                        padding: '12px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: 'rgba(255,255,255,0.01)',
                        height: '46px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-primary)';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.01)';
                      }}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        style={{ display: 'none' }}
                        data-testid="file-upload-input"
                      />
                      {imageUploading ? (
                        <>
                          <div className="spinner" style={{ width: 14, height: 14 }}></div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Enviando...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={14} style={{ color: 'var(--text-muted)' }} />
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                            Selecionar imagem de capa
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <input 
                  type="text" 
                  id="post-cover"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  className="input-field" 
                  placeholder="Ex: http://host.com/imagem.png"
                />
              )}
            </div>
          </div>

          {/* Tags do Post (NOVO CAMPO DE SEO) */}
          <div>
            <label htmlFor="post-tags" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 500 }}>
              Tags de SEO (separadas por vírgula)
            </label>
            <input 
              type="text" 
              id="post-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="input-field" 
              placeholder="Ex: SaaS, UI/UX, Design de Interfaces, Landing Page"
              data-testid="post-tags-input"
            />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 4 }}>
              As tags ajudam na estruturação interna das páginas e geram metadados Open Graph de SEO para buscadores e redes sociais.
            </p>
          </div>

          {/* Resumo Meta Description (SEO) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label htmlFor="post-summary" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, margin: 0 }}>Resumo Meta Description (SEO) *</label>
              <button
                type="button"
                data-testid="btn-maximize-summary"
                onClick={() => handleOpenMaximize('Resumo Meta Description', summary, setSummary, true, false)}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <Maximize2 size={11} /> Expandir
              </button>
            </div>
            <textarea 
              id="post-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="input-field" 
              rows="2"
              style={{ resize: 'none' }}
              placeholder="Um pequeno resumo atraente do artigo para listagem e buscadores do Google..."
              required
            />
          </div>

          {/* Conteúdo do Post */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label htmlFor="post-content" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Conteúdo do Post (Suporta Markdown básico) *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  id="btn-ai-writer"
                  data-testid="btn-ai-writer"
                  aria-label="Abrir assistente de IA"
                  onClick={() => setAiPanelOpen(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px', borderRadius: 7, cursor: 'pointer',
                    background: 'rgba(139, 92, 246, 0.12)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    color: '#c4b5fd', fontSize: '0.78rem', fontWeight: 600,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.22)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.12)'; }}
                >
                  <Sparkles size={12} /> ✨ IA
                </button>
                <button
                  type="button"
                  id="btn-maximize-content"
                  data-testid="btn-maximize-content"
                  aria-label="Maximizar editor de conteúdo"
                  onClick={() => handleOpenMaximize('Conteúdo do Post', content, setContent, true, true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px', borderRadius: 7, cursor: 'pointer',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
                >
                  <Maximize2 size={12} /> Expandir
                </button>
              </div>
            </div>
            <textarea 
              id="post-content"
              data-testid="post-content-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="input-field" 
              rows="12"
              placeholder="Escreva seu artigo aqui... Use títulos como '# Meu Título' e listas com '- item'"
              required
            />
          </div>

          {/* Publicar imediatamente */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input 
              type="checkbox" 
              id="published" 
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: 'var(--color-primary)', cursor: 'pointer' }}
            />
            <label htmlFor="published" style={{ fontSize: '0.9rem', cursor: 'pointer', userSelect: 'none' }}>
              Publicar imediatamente (ficará disponível publicamente e indexável)
            </label>
          </div>

          {/* Botões de Ação */}
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            <button type="button" onClick={onCancel} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={formLoading} style={{ flex: 2, justifyContent: 'center' }}>
              {formLoading ? (
                <>
                  <div className="spinner"></div> Salvando...
                </>
              ) : (
                <>
                  Salvar Post <Save size={16} />
                </>
              )}
            </button>
          </div>

        </div>
      </form>

      {/* Painel lateral do Assistente de IA */}
      <AiWriterPanel
        isOpen={aiPanelOpen}
        onClose={() => setAiPanelOpen(false)}
        onUseTitle={(val) => setTitle(val)}
        onUseSummary={(val) => setSummary(val)}
        onUseContent={(val) => setContent(val)}
        onUseTags={(val) => setTags(val)}
        showToast={showToast}
      />

      {/* Modal fullscreen de edição de conteúdo genérico */}
      <ContentMaximizeModal
        isOpen={maximizeConfig.isOpen}
        title={maximizeConfig.title}
        subtitle={maximizeConfig.subtitle}
        value={maximizeConfig.value}
        isTextarea={maximizeConfig.isTextarea}
        isMarkdown={maximizeConfig.isMarkdown}
        onChange={maximizeConfig.onChange}
        onClose={() => setMaximizeConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
