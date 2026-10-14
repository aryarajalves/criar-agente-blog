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

  test('renderiza imediatamente o formulário com campo de WhatsApp (bandeira BR) e inputs vazios, concluindo com senha forte', async () => {
    api.validateInvite.mockResolvedValue({
      valid: true,
      role: 'admin',
      expires_at: new Date(Date.now() + 86400000).toISOString(),
    });

    api.acceptInvite.mockResolvedValue({
      message: 'Conta criada com sucesso!',
      username: 'novo_admin',
      email: 'novo@admin.com',
      whatsapp: '+55 (11) 99999-8888',
      role: 'admin',
    });

    render(
      <MemoryRouter initialEntries={['/convite/token_valido_123']}>
        <Routes>
          <Route path="/convite/:token" element={<AcceptInvite />} />
        </Routes>
      </MemoryRouter>
    );

    // O painel aparece de uma só vez
    expect(screen.getByTestId('accept-invite-card')).toBeInTheDocument();
    expect(screen.getByText('Criar Conta de Administrador')).toBeInTheDocument();

    // Validação do campo WhatsApp com DDI do Brasil por padrão
    expect(screen.getByTestId('input-invite-whatsapp')).toBeInTheDocument();
    expect(screen.getByTestId('selected-flag')).toHaveTextContent('🇧🇷');
    expect(screen.getByTestId('selected-ddi')).toHaveTextContent('+55');

    // Validação de que NÃO inicia com conteúdo pré-preenchido
    const inputUsername = screen.getByTestId('input-invite-username');
    const inputEmail = screen.getByTestId('input-invite-email');
    const inputWhatsapp = screen.getByTestId('input-whatsapp-number');
    const inputPassword = screen.getByTestId('input-invite-password');
    const inputConfirm = screen.getByTestId('input-invite-confirm-password');

    expect(inputUsername.value).toBe('');
    expect(inputEmail.value).toBe('');
    expect(inputWhatsapp.value).toBe('');
    expect(inputPassword.value).toBe('');
    expect(inputConfirm.value).toBe('');

    // Preencher campos manualmente com WhatsApp e senha forte de 12+ caracteres
    fireEvent.change(inputUsername, { target: { value: 'novo_admin' } });
    fireEvent.change(inputEmail, { target: { value: 'novo@admin.com' } });
    fireEvent.change(inputWhatsapp, { target: { value: '11999998888' } });
    fireEvent.change(inputPassword, { target: { value: 'SenhaForte@2026' } });
    fireEvent.change(inputConfirm, { target: { value: 'SenhaForte@2026' } });

    // Checklist de requisitos da senha deve estar presente
    expect(screen.getByTestId('password-requirements-checklist')).toBeInTheDocument();

    // Submeter formulário
    fireEvent.click(screen.getByTestId('btn-submit-invite'));

    await waitFor(() => {
      expect(api.acceptInvite).toHaveBeenCalledWith('token_valido_123', {
        username: 'novo_admin',
        email: 'novo@admin.com',
        whatsapp: '+55 (11) 99999-8888',
        password: 'SenhaForte@2026',
      });
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.stringContaining('Conta de Administrador criada com sucesso')
      );
    });
  });

  test('valida e bloqueia senhas que não atendem aos critérios de 12 caracteres, maiúscula, minúscula, número e especial', async () => {
    api.validateInvite.mockResolvedValue({
      valid: true,
      role: 'admin',
      expires_at: new Date(Date.now() + 86400000).toISOString(),
    });

    render(
      <MemoryRouter initialEntries={['/convite/token_valido_123']}>
        <Routes>
          <Route path="/convite/:token" element={<AcceptInvite />} />
        </Routes>
      </MemoryRouter>
    );

    const inputUsername = screen.getByTestId('input-invite-username');
    const inputEmail = screen.getByTestId('input-invite-email');
    const inputPassword = screen.getByTestId('input-invite-password');
    const inputConfirm = screen.getByTestId('input-invite-confirm-password');
    const submitBtn = screen.getByTestId('btn-submit-invite');

    fireEvent.change(inputUsername, { target: { value: 'admin_test' } });
    fireEvent.change(inputEmail, { target: { value: 'admin@test.com' } });

    // 1. Senha com menos de 12 caracteres
    fireEvent.change(inputPassword, { target: { value: 'Short1@' } });
    fireEvent.change(inputConfirm, { target: { value: 'Short1@' } });
    fireEvent.click(submitBtn);
    expect(mockShowToast).toHaveBeenCalledWith('A senha deve ter no mínimo 12 caracteres.', 'error');

    // 2. Senha sem letra maiúscula
    fireEvent.change(inputPassword, { target: { value: 'senhafraca@123' } });
    fireEvent.change(inputConfirm, { target: { value: 'senhafraca@123' } });
    fireEvent.click(submitBtn);
    expect(mockShowToast).toHaveBeenCalledWith('A senha deve conter pelo menos uma letra maiúscula.', 'error');

    // 3. Senha sem letra minúscula
    fireEvent.change(inputPassword, { target: { value: 'SENHAFRACA@123' } });
    fireEvent.change(inputConfirm, { target: { value: 'SENHAFRACA@123' } });
    fireEvent.click(submitBtn);
    expect(mockShowToast).toHaveBeenCalledWith('A senha deve conter pelo menos uma letra minúscula.', 'error');

    // 4. Senha sem número
    fireEvent.change(inputPassword, { target: { value: 'SenhaForteSemNumero@' } });
    fireEvent.change(inputConfirm, { target: { value: 'SenhaForteSemNumero@' } });
    fireEvent.click(submitBtn);
    expect(mockShowToast).toHaveBeenCalledWith('A senha deve conter pelo menos um número.', 'error');

    // 5. Senha sem caractere especial
    fireEvent.change(inputPassword, { target: { value: 'SenhaForte123456' } });
    fireEvent.change(inputConfirm, { target: { value: 'SenhaForte123456' } });
    fireEvent.click(submitBtn);
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.stringContaining('A senha deve conter pelo menos um caractere especial'),
      'error'
    );
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
