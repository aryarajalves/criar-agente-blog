import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import AcceptInvite from '../src/pages/AcceptInvite';
import { api } from '../src/utils/api';

vi.mock('../src/utils/api', () => ({
  api: {
    validateInvite: vi.fn(),
    acceptInvite: vi.fn(),
  },
}));

const mockShowToast = vi.fn();
vi.mock('../src/components/ToastContext', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

describe('AcceptInvite Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renderiza imediatamente o formulário de cadastro com inputs rigorosamente vazios e conclui cadastro', async () => {
    api.validateInvite.mockResolvedValue({
      valid: true,
      role: 'admin',
      expires_at: new Date(Date.now() + 86400000).toISOString(),
    });

    api.acceptInvite.mockResolvedValue({
      message: 'Conta criada com sucesso!',
      username: 'novo_admin',
      email: 'novo@admin.com',
      role: 'admin',
    });

    render(
      <MemoryRouter initialEntries={['/convite/token_valido_123']}>
        <Routes>
          <Route path="/convite/:token" element={<AcceptInvite />} />
        </Routes>
      </MemoryRouter>
    );

    // O painel aparece de uma só vez (sem depender de spinner de carregamento)
    expect(screen.getByTestId('accept-invite-card')).toBeInTheDocument();
    expect(screen.getByText('Criar Conta de Administrador')).toBeInTheDocument();

    // Validação de que NÃO inicia com conteúdo pré-preenchido
    const inputUsername = screen.getByTestId('input-invite-username');
    const inputEmail = screen.getByTestId('input-invite-email');
    const inputPassword = screen.getByTestId('input-invite-password');
    const inputConfirm = screen.getByTestId('input-invite-confirm-password');

    expect(inputUsername.value).toBe('');
    expect(inputEmail.value).toBe('');
    expect(inputPassword.value).toBe('');
    expect(inputConfirm.value).toBe('');

    // Preencher campos manualmente
    fireEvent.change(inputUsername, { target: { value: 'novo_admin' } });
    fireEvent.change(inputEmail, { target: { value: 'novo@admin.com' } });
    fireEvent.change(inputPassword, { target: { value: 'senha123456' } });
    fireEvent.change(inputConfirm, { target: { value: 'senha123456' } });

    // Submeter formulário
    fireEvent.click(screen.getByTestId('btn-submit-invite'));

    await waitFor(() => {
      expect(api.acceptInvite).toHaveBeenCalledWith('token_valido_123', {
        username: 'novo_admin',
        email: 'novo@admin.com',
        password: 'senha123456',
      });
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.stringContaining('Conta de Administrador criada com sucesso')
      );
    });
  });

  test('exibe alerta de erro quando o convite for inválido ou expirado', async () => {
    api.validateInvite.mockRejectedValue(new Error('Este link de convite expirou.'));

    render(
      <MemoryRouter initialEntries={['/convite/token_expirado']}>
        <Routes>
          <Route path="/convite/:token" element={<AcceptInvite />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('invite-error-card')).toBeInTheDocument();
      expect(screen.getByText('Convite Inválido ou Expirado')).toBeInTheDocument();
      expect(screen.getByText('Este link de convite expirou.')).toBeInTheDocument();
    });
  });
});
