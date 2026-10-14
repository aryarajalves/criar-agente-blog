import React from 'react';
import { createPortal } from 'react-dom';
import { LogOut, HelpCircle } from 'lucide-react';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

export default function LogoutConfirmationModal({ isOpen, onConfirm, onCancel }) {
  useLockBodyScroll(isOpen);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-backdrop" id="logout-modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '400px' }} id="logout-modal-content">
        <div style={{
          background: 'rgba(99, 102, 241, 0.1)',
          width: 56,
          height: 56,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          color: 'var(--color-primary)'
        }}>
          <HelpCircle size={24} />
        </div>

        <h3 style={{ fontSize: '1.25rem', marginBottom: 12 }} id="logout-modal-title">Confirmar Saída</h3>
        
        <p style={{ 
          fontSize: '0.9rem', 
          color: 'var(--text-muted)', 
          marginBottom: 28,
          lineHeight: 1.5
        }} id="logout-modal-desc">
          Tem certeza que deseja sair do painel administrativo?
        </p>

        <div style={{ display: 'flex', gap: 12 }}>
          {/* Apenas um botão para cancelar, conforme a regra de experiência do usuário */}
          <button 
            id="btn-logout-cancel"
            type="button"
            className="btn-secondary" 
            onClick={onCancel}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            Cancelar
          </button>
          
          <button 
            id="btn-logout-confirm"
            type="button"
            className="btn-primary" 
            onClick={onConfirm}
            style={{ 
              flex: 1, 
              justifyContent: 'center', 
              background: 'linear-gradient(135deg, var(--color-primary), #4f46e5)',
              boxShadow: '0 4px 15px -3px rgba(99, 102, 241, 0.4)'
            }}
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
