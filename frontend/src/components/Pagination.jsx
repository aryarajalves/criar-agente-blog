import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 20,
  onPageChange
}) {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  if (totalPages <= 1) return null;

  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Calcula quais números de página exibir
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pages = getPageNumbers();

  const handlePageSelect = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  return (
    <div 
      className="pagination-container"
      data-testid="pagination-container"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        padding: '24px 0 12px',
        marginTop: 20,
        borderTop: '1px solid var(--border-color)',
        color: 'var(--text-muted)',
        fontSize: '0.85rem'
      }}
    >
      <div data-testid="pagination-info">
        Mostrando <strong style={{ color: 'var(--text-main)' }}>{startItem}-{endItem}</strong> de <strong style={{ color: 'var(--text-main)' }}>{totalItems}</strong> posts (20 por página)
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Botão Anterior */}
        <button
          type="button"
          onClick={() => handlePageSelect(currentPage - 1)}
          disabled={currentPage === 1}
          data-testid="pagination-prev"
          className="btn-secondary"
          style={{
            padding: '8px 12px',
            fontSize: '0.82rem',
            opacity: currentPage === 1 ? 0.4 : 1,
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
          }}
          aria-label="Página anterior"
        >
          <ChevronLeft size={16} />
          <span>Anterior</span>
        </button>

        {/* Páginas numeradas */}
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => handlePageSelect(page)}
            data-testid={`pagination-page-${page}`}
            className={page === currentPage ? "btn-primary" : "btn-secondary"}
            style={{
              width: 36,
              height: 36,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)'
            }}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </button>
        ))}

        {/* Botão Próximo */}
        <button
          type="button"
          onClick={() => handlePageSelect(currentPage + 1)}
          disabled={currentPage === totalPages}
          data-testid="pagination-next"
          className="btn-secondary"
          style={{
            padding: '8px 12px',
            fontSize: '0.82rem',
            opacity: currentPage === totalPages ? 0.4 : 1,
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
          }}
          aria-label="Próxima página"
        >
          <span>Próximo</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
