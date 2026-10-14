import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, test, expect, vi } from 'vitest';
import Header from '../src/components/Header';

// Mock do ToastContext
vi.mock('../src/components/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
  ToastProvider: ({ children }) => <div>{children}</div>,
}));

describe('Header Component (Backward Compatibility)', () => {
  test('renderiza a Sidebar com logo, link do Blog e Painel Administrativo', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    );

    // Deve renderizar a logo ARYARAJ
    expect(screen.getAllByText(/ARYARAJ/i)[0]).toBeInTheDocument();
    
    // Deve renderizar o link de navegação Blog
    const blogLink = screen.getByTestId('sidebar-link-blog');
    expect(blogLink).toBeInTheDocument();
    expect(blogLink).toHaveAttribute('href', '/');

    // Deve renderizar Gestão de Usuário
    const usersLink = screen.getByTestId('sidebar-link-users');
    expect(usersLink).toBeInTheDocument();

    // Deve renderizar o Painel Administrativo
    const adminLink = screen.getByTestId('sidebar-link-admin');
    expect(adminLink).toBeInTheDocument();

    // NÃO deve renderizar o link de Parcerias
    expect(screen.queryByText(/parcerias/i)).not.toBeInTheDocument();
  });

  test('mantém a classe active no Blog quando na home page (/)', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    );
    
    const blogLink = screen.getByTestId('sidebar-link-blog');
    expect(blogLink).toHaveClass('active');
  });

  test('mantém a classe active no Painel Administrativo na rota /admin', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Header />
      </MemoryRouter>
    );
    
    const adminLink = screen.getByTestId('sidebar-link-admin');
    expect(adminLink).toHaveClass('active');
  });
});
