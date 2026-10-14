import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import Pagination from '../src/components/Pagination';

describe('Pagination Component', () => {
  test('não renderiza nada se o total de páginas for menor ou igual a 1', () => {
    const { container } = render(
      <Pagination currentPage={1} totalItems={15} pageSize={20} onPageChange={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renderiza informação de paginação correta para 45 itens com 20 por página', () => {
    render(
      <Pagination currentPage={1} totalItems={45} pageSize={20} onPageChange={vi.fn()} />
    );

    expect(screen.getByTestId('pagination-container')).toBeInTheDocument();
    expect(screen.getByTestId('pagination-info')).toHaveTextContent('Mostrando 1-20 de 45 posts (20 por página)');
    
    // Deve renderizar botões para as páginas 1, 2 e 3
    expect(screen.getByTestId('pagination-page-1')).toBeInTheDocument();
    expect(screen.getByTestId('pagination-page-2')).toBeInTheDocument();
    expect(screen.getByTestId('pagination-page-3')).toBeInTheDocument();
  });

  test('desabilita botão Anterior na primeira página e habilita Próximo', () => {
    const handlePageChange = vi.fn();
    render(
      <Pagination currentPage={1} totalItems={50} pageSize={20} onPageChange={handlePageChange} />
    );

    const prevBtn = screen.getByTestId('pagination-prev');
    const nextBtn = screen.getByTestId('pagination-next');

    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    // Clicar em próximo deve chamar onPageChange com página 2
    fireEvent.click(nextBtn);
    expect(handlePageChange).toHaveBeenCalledWith(2);
  });

  test('desabilita botão Próximo na última página e chama onPageChange ao clicar na página 2', () => {
    const handlePageChange = vi.fn();
    render(
      <Pagination currentPage={3} totalItems={45} pageSize={20} onPageChange={handlePageChange} />
    );

    const prevBtn = screen.getByTestId('pagination-prev');
    const nextBtn = screen.getByTestId('pagination-next');

    expect(prevBtn).not.toBeDisabled();
    expect(nextBtn).toBeDisabled();

    // Clicar em página 2
    fireEvent.click(screen.getByTestId('pagination-page-2'));
    expect(handlePageChange).toHaveBeenCalledWith(2);
  });
});
