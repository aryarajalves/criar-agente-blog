import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import App from '../src/App';

// Mock dos serviços de API
vi.mock('../src/utils/api', () => ({
  api: {
    getPosts: vi.fn().mockResolvedValue([]),
    validateInvite: vi.fn().mockResolvedValue({ valid: true, role: 'admin' }),
  },
}));

describe('App Component Layout Routing', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  test('não renderiza a barra lateral na rota de convite (/convite/:token), exibindo tela standalone', async () => {
    window.history.pushState({}, 'Convite', '/convite/meu_token_123');

    render(<App />);

    await screen.findByTestId('invite-page-standalone');

    // NÃO deve renderizar a barra lateral
    expect(screen.queryByTestId('app-sidebar')).not.toBeInTheDocument();
  });

  test('renderiza a barra lateral normalmente na página inicial (/)', async () => {
    window.history.pushState({}, 'Home', '/');

    render(<App />);

    await screen.findByTestId('app-sidebar');
  });

  test('renderiza a área de conteúdo principal rolável, o footer fixo e a máscara de gradiente na rota inicial', async () => {
    window.history.pushState({}, 'Home', '/');

    render(<App />);

    const mainContent = await screen.findByTestId('app-main-content');
    const footer = screen.getByTestId('app-footer');
    const footerMask = screen.getByTestId('app-footer-mask');

    expect(mainContent).toBeInTheDocument();
    expect(footer).toBeInTheDocument();
    expect(footerMask).toBeInTheDocument();
    expect(footer).toHaveTextContent(/Aryaraj - Interfaces Premium/i);
  });

  test('não renderiza o footer fixo nem a máscara na rota isolada de convite', async () => {
    window.history.pushState({}, 'Convite', '/convite/token_teste_standalone');

    render(<App />);

    await screen.findByTestId('invite-page-standalone');

    expect(screen.queryByTestId('app-footer')).not.toBeInTheDocument();
    expect(screen.queryByTestId('app-footer-mask')).not.toBeInTheDocument();
  });
});
