import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import Sidebar from '../src/components/Sidebar';

// Mock do ToastContext
vi.mock('../src/components/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
  ToastProvider: ({ children }) => <div>{children}</div>,
}));

describe('Sidebar Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  test('renderiza a logo ARYARAJ, o item inicial Blog, a Gestão de Usuário logo abaixo e o Painel Administrativo em seguida', () => {
    localStorage.setItem('token', 'fake-jwt-token');

    render(
      <MemoryRouter initialEntries={['/']}>
        <Sidebar />
      </MemoryRouter>
    );

    // Deve renderizar a logo ARYARAJ
    expect(screen.getAllByText(/ARYARAJ/i)[0]).toBeInTheDocument();

    // 1. Deve renderizar o item inicial de navegação Blog
    const blogLink = screen.getByTestId('sidebar-link-blog');
    expect(blogLink).toBeInTheDocument();
    expect(blogLink).toHaveAttribute('href', '/');
    expect(blogLink).toHaveTextContent('Blog');

    // 2. Deve renderizar Gestão de Usuário logo abaixo do Blog
    const usersLink = screen.getByTestId('sidebar-link-users');
    expect(usersLink).toBeInTheDocument();
    expect(usersLink).toHaveAttribute('href', '/usuarios');
    expect(usersLink).toHaveTextContent('Gestão de Usuário');

    // 3. Deve renderizar o Painel Administrativo em seguida
    const adminLink = screen.getByTestId('sidebar-link-admin');
    expect(adminLink).toBeInTheDocument();
    expect(adminLink).toHaveAttribute('href', '/admin');
    expect(adminLink).toHaveTextContent('Painel Administrativo');

    // Não deve renderizar Parcerias
    expect(screen.queryByText(/parcerias/i)).not.toBeInTheDocument();
  });

  test('destaca o Blog como ativo na página inicial (/) e os demais como inativos', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Sidebar />
      </MemoryRouter>
    );

    const blogLink = screen.getByTestId('sidebar-link-blog');
    const usersLink = screen.getByTestId('sidebar-link-users');
    const adminLink = screen.getByTestId('sidebar-link-admin');

    expect(blogLink).toHaveClass('active');
    expect(usersLink).not.toHaveClass('active');
    expect(adminLink).not.toHaveClass('active');
  });

  test('destaca Gestão de Usuário como ativo quando estiver na rota /usuarios', () => {
    render(
      <MemoryRouter initialEntries={['/usuarios']}>
        <Sidebar />
      </MemoryRouter>
    );

    const blogLink = screen.getByTestId('sidebar-link-blog');
    const usersLink = screen.getByTestId('sidebar-link-users');
    const adminLink = screen.getByTestId('sidebar-link-admin');

    expect(blogLink).not.toHaveClass('active');
    expect(usersLink).toHaveClass('active');
    expect(adminLink).not.toHaveClass('active');
  });

  test('destaca Painel Administrativo como ativo quando estiver na rota /admin ou /login', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Sidebar />
      </MemoryRouter>
    );

    const blogLink = screen.getByTestId('sidebar-link-blog');
    const usersLink = screen.getByTestId('sidebar-link-users');
    const adminLink = screen.getByTestId('sidebar-link-admin');

    expect(blogLink).not.toHaveClass('active');
    expect(usersLink).not.toHaveClass('active');
    expect(adminLink).toHaveClass('active');
  });

  test('exibe modo leitura quando usuário não está autenticado', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Sidebar />
      </MemoryRouter>
    );

    expect(screen.getByTestId('sidebar-guest-box')).toBeInTheDocument();
    expect(screen.getByText('Modo Leitura')).toBeInTheDocument();
    expect(screen.queryByTestId('sidebar-user-card')).not.toBeInTheDocument();
  });

  test('exibe dados do usuário e botão de sair quando autenticado', () => {
    localStorage.setItem('token', 'fake-jwt-token');
    localStorage.setItem('username', 'aryaraj_test');

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Sidebar />
      </MemoryRouter>
    );

    expect(screen.getByTestId('sidebar-user-card')).toBeInTheDocument();
    expect(screen.getByText('aryaraj_test')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-logout-btn')).toBeInTheDocument();
  });

  test('abre modal de confirmação de logout ao clicar no botão de sair', () => {
    localStorage.setItem('token', 'fake-jwt-token');

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Sidebar />
      </MemoryRouter>
    );

    const logoutBtn = screen.getByTestId('sidebar-logout-btn');
    fireEvent.click(logoutBtn);

    expect(screen.getByText('Confirmar Saída')).toBeInTheDocument();
    expect(screen.getByText(/Tem certeza que deseja sair do painel administrativo/i)).toBeInTheDocument();
  });

  test('alterna a abertura do menu mobile ao clicar no botão de toggle', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Sidebar />
      </MemoryRouter>
    );

    const toggleBtn = screen.getByLabelText(/Abrir menu/i);
    expect(toggleBtn).toBeInTheDocument();

    // Clica para abrir
    fireEvent.click(toggleBtn);
    expect(screen.getByTestId('sidebar-backdrop')).toBeInTheDocument();

    // Clica no backdrop para fechar
    fireEvent.click(screen.getByTestId('sidebar-backdrop'));
    expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument();
  });
});
