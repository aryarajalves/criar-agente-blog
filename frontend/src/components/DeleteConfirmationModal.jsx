import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

export default function DeleteConfirmationModal({ isOpen, onConfirm, onCancel, title }) {
  useLockBodyScroll(isOpen);

  if (!isOpen) return null;

  return (
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

        <h3 style={{ fontSize: '1.25rem', marginBottom: 12 }}>Excluir Post?</h3>
        
        <p style={{ 
          fontSize: '0.9rem', 
          color: 'var(--text-muted)', 
          marginBottom: 28,
          lineHeight: 1.5
        }}>
          Tem certeza que deseja excluir o post "{title}"? Esta ação não pode ser desfeita e removerá permanentemente o conteúdo do banco de dados.
        </p>

        <div style={{ display: 'flex', gap: 12 }}>
          {/* Apenas um botão para cancelar, conforme a regra de experiência do usuário */}
          <button 
            type="button"
            className="btn-secondary" 
            onClick={onCancel}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            Cancelar
          </button>
          
          <button 
            type="button"
            className="btn-primary" 
            onClick={onConfirm}
            style={{ 
              flex: 1, 
              justifyContent: 'center', 
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              boxShadow: '0 4px 15px -3px rgba(239, 68, 68, 0.4)'
            }}
          >
            <Trash2 size={16} /> Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
