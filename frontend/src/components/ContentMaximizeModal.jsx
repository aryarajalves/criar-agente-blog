import React, { useRef, useEffect } from 'react';
import { Minimize2, X } from 'lucide-react';

/**
 * Modal fullscreen genérico para editar campos (título, resumo, conteúdo) com mais espaço.
 * Sincronizado bidirecionalmente com o estado do formulário.
 */
export default function ContentMaximizeModal({ 
  isOpen, 
  title = "Editor Expandido", 
  subtitle = "Modo expandido de edição", 
  value = "", 
  onChange, 
  onClose,
  isMarkdown = false,
  isTextarea = true
}) {
  const inputRef = useRef(null);

  // Bloquear scroll do body de fundo
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

  // Focar no elemento quando o modal abre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      // Mover cursor para o fim
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      data-testid="content-maximize-modal"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 950,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(8, 7, 16, 0.97)',
        backdropFilter: 'blur(12px)',
        animation: 'fadeInScale 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Barra superior do modal */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(139, 92, 246, 0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(99,102,241,0.3))',
            border: '1px solid rgba(139,92,246,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Minimize2 size={14} color="#c4b5fd" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
              {title}
            </h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
              {subtitle}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
            {value.length} caracteres
          </span>
          <button
            type="button"
            data-testid="content-modal-close"
            aria-label="Fechar editor expandido"
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
              color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', fontWeight: 500,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
          >
            <X size={14} />
            Fechar
          </button>
        </div>
      </div>

      {/* Dica de Markdown condicional */}
      {isMarkdown && (
        <div style={{
          flexShrink: 0,
          padding: '8px 24px',
          background: 'rgba(139, 92, 246, 0.04)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          display: 'flex', gap: 20, flexWrap: 'wrap',
        }}>
          {[
            ['# Título', 'H1'], ['## Subtítulo', 'H2'], ['**negrito**', 'Bold'],
            ['*itálico*', 'Italic'], ['- item', 'Lista'], ['```código```', 'Code'],
          ].map(([syntax, label]) => (
            <span key={label} style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
              <span style={{ color: 'rgba(139,92,246,0.7)' }}>{syntax}</span>
              {' '}<span style={{ color: 'rgba(255,255,255,0.2)' }}>→ {label}</span>
            </span>
          ))}
        </div>
      )}

      {/* Campo de edição adaptável */}
      <div style={{ flex: 1, display: 'flex', background: 'transparent' }}>
        {isTextarea ? (
          <textarea
            ref={inputRef}
            id="modal-textarea-field"
            data-testid="content-modal-textarea"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={isMarkdown ? "Escreva em Markdown aqui..." : "Escreva o texto do resumo..."}
            style={{
              flex: 1,
              width: '100%',
              boxSizing: 'border-box',
              padding: '28px 32px',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'rgba(255,255,255,0.88)',
              fontSize: '0.95rem',
              lineHeight: 1.8,
              resize: 'none',
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
              letterSpacing: '0.01em',
            }}
          />
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 32px' }}>
            <input
              ref={inputRef}
              type="text"
              id="modal-input-field"
              data-testid="content-modal-input"
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder="Digite o título do post..."
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#fff',
                fontSize: '2rem',
                fontWeight: 700,
                fontFamily: "var(--font-heading)",
                letterSpacing: '-0.02em',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: '12px',
              }}
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
