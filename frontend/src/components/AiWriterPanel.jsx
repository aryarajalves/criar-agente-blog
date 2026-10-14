import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Sparkles, X, ChevronDown, Copy, Check, Wand2, FileText, AlignLeft } from 'lucide-react';

const TONE_OPTIONS = [
  { value: 'profissional', label: '🎩 Profissional' },
  { value: 'descontraido', label: '😊 Descontraído' },
  { value: 'tecnico', label: '⚙️ Técnico' },
  { value: 'persuasivo', label: '🎯 Persuasivo' },
];

const SIZE_OPTIONS = [
  { value: 'curto', label: 'Curto (~300 palavras)' },
  { value: 'medio', label: 'Médio (~600 palavras)' },
  { value: 'longo', label: 'Longo (~1200 palavras)' },
];

export default function AiWriterPanel({ isOpen, onClose, onUseTitle, onUseSummary, onUseContent, onUseTags, showToast }) {
  const [description, setDescription] = useState('');
  const [tone, setTone] = useState('profissional');
  const [size, setSize] = useState('medio');
  const [variationsCount, setVariationsCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedVariationIndex, setSelectedVariationIndex] = useState(0);
  const [copiedField, setCopiedField] = useState(null);

  // Bloquear o scroll da tela de fundo quando o painel de IA estiver aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleGenerate = async () => {
    if (!description.trim()) {
      showToast('Descreva o post antes de gerar.', 'error');
      return;
    }
    setLoading(true);
    setResult(null);
    setSelectedVariationIndex(0);
    try {
      const data = await api.generateWithAI({ 
        description: description.trim(), 
        tone, 
        size, 
        variations_count: variationsCount 
      });
      setResult(data);
      showToast('Conteúdo gerado com sucesso! ✨');
    } catch (err) {
      showToast(err.message || 'Erro ao gerar conteúdo com IA.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (field, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      showToast('Não foi possível copiar.', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay escuro por baixo - sem fechar ao clicar */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 900,
          backdropFilter: 'blur(2px)',
        }}
        data-testid="ai-panel-overlay"
      />

      {/* Painel lateral deslizante */}
      <div
        data-testid="ai-writer-panel"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: '420px',
          maxWidth: '95vw',
          background: 'linear-gradient(180deg, #13111c 0%, #0e0d18 100%)',
          borderLeft: '1px solid rgba(139, 92, 246, 0.2)',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.6)',
          zIndex: 901,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header do Painel */}
        <div style={{
          padding: '24px 24px 20px',
          borderBottom: '1px solid rgba(139, 92, 246, 0.15)',
          flexShrink: 0,
          background: 'rgba(139, 92, 246, 0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 16px rgba(139, 92, 246, 0.4)',
              }}>
                <Sparkles size={18} color="#fff" />
              </div>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  Assistente de IA
                </h2>
                <p style={{ fontSize: '0.75rem', color: 'rgba(139, 92, 246, 0.8)', margin: 0, fontWeight: 500 }}>
                  Especialista em conteúdo de blog
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              data-testid="ai-panel-close"
              aria-label="Fechar painel de IA"
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Conteúdo scrollável */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Textarea de descrição */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Descreva o post que você quer criar
            </label>
            <textarea
              id="ai-description"
              data-testid="ai-description-input"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              placeholder="Ex: Quero um post sobre como criei uma interface de dashboard para gestão de clientes. Destaque os desafios de UX..."
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: 10, padding: '12px 14px',
                color: '#fff', fontSize: '0.88rem', lineHeight: 1.6,
                resize: 'vertical', fontFamily: 'inherit',
                transition: 'border-color 0.2s',
                outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(139, 92, 246, 0.6)'}
              onBlur={e => e.target.style.borderColor = 'rgba(139, 92, 246, 0.2)'}
            />
          </div>

          {/* Quantidade de variações para Teste A/B */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Variações para Teste A/B
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 2, 3].map(num => (
                <button
                  key={num}
                  type="button"
                  data-testid={`variations-count-${num}`}
                  onClick={() => setVariationsCount(num)}
                  style={{
                    flex: 1, padding: '10px 8px', borderRadius: 8, cursor: 'pointer',
                    fontSize: '0.82rem', fontWeight: 500, transition: 'all 0.2s',
                    background: variationsCount === num ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.03)',
                    border: variationsCount === num ? '1px solid rgba(139, 92, 246, 0.5)' : '1px solid rgba(255,255,255,0.07)',
                    color: variationsCount === num ? '#c4b5fd' : 'rgba(255,255,255,0.5)',
                    boxShadow: variationsCount === num ? '0 0 12px rgba(139,92,246,0.15)' : 'none',
                  }}
                >
                  {num} {num === 1 ? 'Opção' : 'Opções'}
                </button>
              ))}
            </div>
          </div>

          {/* Tom de escrita */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Tom de Escrita
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {TONE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  data-testid={`tone-option-${opt.value}`}
                  onClick={() => setTone(opt.value)}
                  style={{
                    padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                    fontSize: '0.82rem', fontWeight: 500, transition: 'all 0.2s',
                    background: tone === opt.value ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.03)',
                    border: tone === opt.value ? '1px solid rgba(139, 92, 246, 0.5)' : '1px solid rgba(255,255,255,0.07)',
                    color: tone === opt.value ? '#c4b5fd' : 'rgba(255,255,255,0.5)',
                    boxShadow: tone === opt.value ? '0 0 12px rgba(139,92,246,0.15)' : 'none',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tamanho do conteúdo */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Tamanho do Conteúdo
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {SIZE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  data-testid={`size-option-${opt.value}`}
                  onClick={() => setSize(opt.value)}
                  style={{
                    flex: 1, padding: '10px 8px', borderRadius: 8, cursor: 'pointer',
                    fontSize: '0.78rem', fontWeight: 500, transition: 'all 0.2s',
                    background: size === opt.value ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.03)',
                    border: size === opt.value ? '1px solid rgba(139, 92, 246, 0.5)' : '1px solid rgba(255,255,255,0.07)',
                    color: size === opt.value ? '#c4b5fd' : 'rgba(255,255,255,0.5)',
                    boxShadow: size === opt.value ? '0 0 12px rgba(139,92,246,0.15)' : 'none',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Botão Gerar */}
          <button
            type="button"
            data-testid="ai-generate-btn"
            onClick={handleGenerate}
            disabled={loading}
            style={{
              width: '100%', padding: '14px', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? 'rgba(139, 92, 246, 0.3)' : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.95rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: loading ? 'none' : '0 4px 20px rgba(139, 92, 246, 0.4)',
              transition: 'all 0.3s',
              opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 6px 28px rgba(139, 92, 246, 0.6)'; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.boxShadow = '0 4px 20px rgba(139, 92, 246, 0.4)'; }}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 18, height: 18 }} />
                Gerando conteúdo...
              </>
            ) : (
              <>
                <Wand2 size={18} />
                ✨ Gerar com IA
              </>
            )}
          </button>

          {/* Resultado */}
          {result && result.variations && result.variations.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'fadeIn 0.4s ease' }}>
              <div style={{
                height: '1px', background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.4), transparent)',
                margin: '4px 0'
              }} />

              {/* Seletor de variação (Abas) */}
              {result.variations.length > 1 && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginBottom: 8, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', textAlign: 'center' }}>
                    Variações Geradas (Teste A/B)
                  </label>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 10 }}>
                    {result.variations.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        data-testid={`variation-tab-${idx}`}
                        onClick={() => setSelectedVariationIndex(idx)}
                        style={{
                          padding: '6px 12px', borderRadius: 20, cursor: 'pointer',
                          fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s',
                          background: selectedVariationIndex === idx ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'rgba(255, 255, 255, 0.03)',
                          border: selectedVariationIndex === idx ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                          color: '#fff',
                          boxShadow: selectedVariationIndex === idx ? '0 2px 10px rgba(139, 92, 246, 0.3)' : 'none',
                        }}
                      >
                        Variação {String.fromCharCode(65 + idx)} {idx === 0 ? '(A)' : idx === 1 ? '(B)' : idx === 2 ? '(C)' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p style={{ fontSize: '0.8rem', color: 'rgba(139, 92, 246, 0.8)', fontWeight: 600, textAlign: 'center', margin: 0 }}>
                ✨ Variação {String.fromCharCode(65 + selectedVariationIndex)} — clique para aplicar
              </p>

              {/* Resultado: Título */}
              <ResultCard
                label="Título"
                icon={<FileText size={13} />}
                value={result.variations[selectedVariationIndex]?.title || ''}
                fieldKey="title"
                copiedField={copiedField}
                onCopy={(key, val) => {
                  handleCopy(key, val);
                  showToast('Título copiado para a área de transferência!', 'success');
                }}
                onUse={() => {
                  onUseTitle(result.variations[selectedVariationIndex]?.title);
                  showToast('Título aplicado com sucesso!');
                }}
              />

              {/* Resultado: Resumo */}
              <ResultCard
                label="Resumo (SEO)"
                icon={<AlignLeft size={13} />}
                value={result.variations[selectedVariationIndex]?.summary || ''}
                fieldKey="summary"
                copiedField={copiedField}
                onCopy={(key, val) => {
                  handleCopy(key, val);
                  showToast('Resumo copiado para a área de transferência!', 'success');
                }}
                onUse={() => {
                  onUseSummary(result.variations[selectedVariationIndex]?.summary);
                  showToast('Resumo aplicado com sucesso!');
                }}
              />

              {/* Resultado: Tags (SEO) */}
              <ResultCard
                label="Tags de SEO"
                icon={<FileText size={13} />}
                value={result.variations[selectedVariationIndex]?.tags || ''}
                fieldKey="tags"
                copiedField={copiedField}
                onCopy={(key, val) => {
                  handleCopy(key, val);
                  showToast('Tags copiadas para a área de transferência!', 'success');
                }}
                onUse={() => {
                  onUseTags(result.variations[selectedVariationIndex]?.tags);
                  showToast('Tags aplicadas com sucesso!');
                }}
              />

              {/* Resultado: Conteúdo */}
              <ResultCard
                label="Conteúdo (Markdown)"
                icon={<FileText size={13} />}
                value={result.variations[selectedVariationIndex]?.content || ''}
                fieldKey="content"
                copiedField={copiedField}
                onCopy={(key, val) => {
                  handleCopy(key, val);
                  showToast('Conteúdo copiado para a área de transferência!', 'success');
                }}
                onUse={() => {
                  onUseContent(result.variations[selectedVariationIndex]?.content);
                  showToast('Conteúdo aplicado com sucesso!');
                }}
                isLong
              />
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

function ResultCard({ label, icon, value, fieldKey, copiedField, onCopy, onUse, isLong = false }) {
  const [expanded, setExpanded] = useState(!isLong);

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(139, 92, 246, 0.15)',
      borderRadius: 10,
      overflow: 'hidden',
    }}>
      {/* Header do card */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(139, 92, 246, 0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#c4b5fd', fontSize: '0.78rem', fontWeight: 600 }}>
          {icon} {label}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded(p => !p)}
              style={{
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                fontSize: '0.72rem', padding: '2px 6px',
              }}
            >
              {expanded ? 'Recolher' : 'Expandir'}
              <ChevronDown size={11} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
          )}
          <button
            type="button"
            data-testid={`copy-${fieldKey}`}
            onClick={() => onCopy(fieldKey, value)}
            aria-label={`Copiar ${label}`}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 6, padding: '3px 8px', cursor: 'pointer', color: 'rgba(255,255,255,0.4)',
              fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s',
            }}
          >
            {copiedField === fieldKey ? <><Check size={11} /> Copiado</> : <><Copy size={11} /> Copiar</>}
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      {expanded && (
        <div style={{ padding: '10px 14px' }}>
          <p style={{
            fontSize: '0.83rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, margin: 0,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            maxHeight: isLong ? '200px' : 'none', overflowY: isLong ? 'auto' : 'visible',
          }}>
            {value}
          </p>
        </div>
      )}

      {/* Botão de aplicar */}
      <div style={{ padding: '8px 14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button
          type="button"
          data-testid={`use-${fieldKey}`}
          onClick={onUse}
          style={{
            width: '100%', padding: '8px', borderRadius: 7, cursor: 'pointer',
            background: 'rgba(139, 92, 246, 0.12)', border: '1px solid rgba(139, 92, 246, 0.25)',
            color: '#c4b5fd', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.25)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.12)'; }}
        >
          ↳ Usar {label} no formulário
        </button>
      </div>
    </div>
  );
}
